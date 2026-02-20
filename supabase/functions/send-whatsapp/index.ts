import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

interface SendWhatsAppRequest {
  to: string;
  recipientName?: string;
  notificationType: string;
  templateName: string;
  templateParams?: string[];
  languageCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Valida o JWT via getUser
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!WHATSAPP_TOKEN) {
    return new Response(JSON.stringify({ error: "WHATSAPP_TOKEN não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!WHATSAPP_PHONE_NUMBER_ID) {
    return new Response(JSON.stringify({ error: "WHATSAPP_PHONE_NUMBER_ID não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: SendWhatsAppRequest = await req.json();
    const {
      to,
      recipientName,
      notificationType,
      templateName,
      templateParams = [],
      languageCode = "pt_BR",
    } = body;

    if (!to || !templateName || !notificationType) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: to, templateName, notificationType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Monta o payload do template
    const components: object[] = [];
    if (templateParams.length > 0) {
      components.push({
        type: "body",
        parameters: templateParams.map((p) => ({ type: "text", text: p })),
      });
    }

    const metaPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    console.log("Enviando mensagem WhatsApp:", { to, templateName, notificationType });

    const metaResponse = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metaPayload),
    });

    const metaData = await metaResponse.json();
    console.log("Resposta Meta API:", JSON.stringify(metaData));

    const metaMessageId = metaData?.messages?.[0]?.id ?? null;
    const success = metaResponse.ok && !!metaMessageId;

    // Registra no log com service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseAdmin.from("whatsapp_notifications").insert({
      notification_type: notificationType,
      recipient_phone: to,
      recipient_name: recipientName ?? null,
      template_name: templateName,
      template_params: { params: templateParams },
      status: success ? "sent" : "failed",
      meta_message_id: metaMessageId,
      error_message: success ? null : JSON.stringify(metaData),
      sent_at: success ? new Date().toISOString() : null,
      created_by: user.id,
    });

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Falha ao enviar via Meta API", details: metaData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: metaMessageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Erro ao enviar WhatsApp:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
