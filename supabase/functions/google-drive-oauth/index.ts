import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, code, medico_id } = await req.json();

    if (action === "get_auth_url") {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

      if (!clientId || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "Google OAuth not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent("https://www.googleapis.com/auth/drive.readonly")}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(medico_id)}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_code") {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

      if (!clientId || !clientSecret || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "Google OAuth not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenRes.json();

      if (tokens.error) {
        return new Response(JSON.stringify({ error: tokens.error_description || tokens.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("google_drive_integrations").upsert(
        {
          medico_id,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          status: "active",
          folder_id: "",
        },
        { onConflict: "medico_id" }
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_folders") {
      const { data: integration } = await supabase
        .from("google_drive_integrations")
        .select("access_token_encrypted, refresh_token_encrypted, token_expires_at")
        .eq("medico_id", medico_id)
        .single();

      if (!integration) {
        return new Response(JSON.stringify({ error: "Not connected" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let accessToken = integration.access_token_encrypted;

      // Refresh token if expired
      if (new Date(integration.token_expires_at!) < new Date()) {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refresh_token: integration.refresh_token_encrypted,
            client_id: Deno.env.get("GOOGLE_CLIENT_ID"),
            client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET"),
            grant_type: "refresh_token",
          }),
        });
        const refreshed = await refreshRes.json();
        accessToken = refreshed.access_token;

        await supabase
          .from("google_drive_integrations")
          .update({
            access_token_encrypted: refreshed.access_token,
            token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          })
          .eq("medico_id", medico_id);
      }

      const driveRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'&fields=files(id,name)&pageSize=50",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const driveData = await driveRes.json();

      return new Response(JSON.stringify({ folders: driveData.files || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      await supabase
        .from("google_drive_integrations")
        .update({ status: "disconnected" })
        .eq("medico_id", medico_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save_folder") {
      const { folder_id, folder_name, file_patterns, auto_process } = await req.json();

      await supabase
        .from("google_drive_integrations")
        .update({
          folder_id,
          folder_name,
          file_patterns: file_patterns || [],
          auto_process: auto_process ?? false,
        })
        .eq("medico_id", medico_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
