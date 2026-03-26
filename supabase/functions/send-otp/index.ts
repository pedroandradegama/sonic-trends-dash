import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Invalidate old codes
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("user_email", email.toLowerCase())
      .eq("used", false);

    // Insert new code
    const { error: insertError } = await supabase.from("otp_codes").insert({
      user_email: email.toLowerCase(),
      code,
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    // Send via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "IMAG Portal <noreply@resend.dev>",
        to: [email.toLowerCase()],
        subject: `Código de acesso: ${code}`,
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 24px; text-align: center;">
            <h2 style="color: #2D6A7E; margin-bottom: 8px;">Portal do Médico</h2>
            <p style="color: #636E7D; font-size: 14px; margin-bottom: 24px;">
              Seu código de verificação é:
            </p>
            <div style="background: #F8F9FB; border: 1px solid #DFE3E8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1A2332;">
                ${code}
              </span>
            </div>
            <p style="color: #636E7D; font-size: 12px;">
              Este código expira em 10 minutos.<br/>
              Se você não solicitou este código, ignore este email.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-otp error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
