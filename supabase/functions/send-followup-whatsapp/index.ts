import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find cases with overdue follow-ups
    const today = new Date().toISOString().split("T")[0];
    const { data: cases, error } = await supabase
      .from("interesting_cases")
      .select("*, profiles!inner(medico_nome, whatsapp_number)")
      .eq("wants_followup", true)
      .not("followup_days", "is", null);

    if (error) throw error;

    let sent = 0;
    for (const c of cases || []) {
      const examDate = new Date(c.exam_date);
      const targetDate = new Date(examDate);
      targetDate.setDate(targetDate.getDate() + c.followup_days);
      const targetStr = targetDate.toISOString().split("T")[0];

      if (targetStr !== today) continue;

      const profile = (c as any).profiles;
      if (!profile?.whatsapp_number) continue;

      const phone = profile.whatsapp_number.replace(/\D/g, "");
      if (!phone) continue;

      // Send WhatsApp via existing send-whatsapp function
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            to: phone,
            recipientName: profile.medico_nome,
            notificationType: "followup_reminder",
            templateName: "menu_unidade",
            templateParams: [
              `Lembrete: Follow-up do paciente ${c.patient_name} (${c.diagnostic_hypothesis || "sem hipótese"}) está previsto para hoje.`,
            ],
            languageCode: "pt_BR",
          }),
        });
        if (resp.ok) sent++;
      } catch (e) {
        console.error("Error sending follow-up WhatsApp:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
