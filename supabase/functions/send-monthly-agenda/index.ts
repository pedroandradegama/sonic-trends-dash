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

    // Get next month range
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const startStr = nextMonth.toISOString().split("T")[0];
    const endStr = nextMonthEnd.toISOString().split("T")[0];

    const monthNames = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ];
    const monthName = monthNames[nextMonth.getMonth()];

    // Get all agenda communications for next month
    const { data: agendas, error } = await supabase
      .from("agenda_comunicacoes")
      .select("*")
      .gte("data_agenda", startStr)
      .lte("data_agenda", endStr)
      .order("data_agenda");

    if (error) throw error;

    // Group by user_id
    const byUser = new Map<string, any[]>();
    for (const a of agendas || []) {
      const arr = byUser.get(a.user_id) || [];
      arr.push(a);
      byUser.set(a.user_id, arr);
    }

    let sent = 0;
    for (const [userId, userAgendas] of byUser) {
      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("medico_nome, whatsapp_number")
        .eq("user_id", userId)
        .single();

      if (!profile?.whatsapp_number) continue;

      const phone = profile.whatsapp_number.replace(/\D/g, "");
      if (!phone) continue;

      // Build summary
      const lines = userAgendas.map((a: any) => {
        const date = new Date(a.data_agenda + "T12:00:00");
        const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" });
        return `${dayName} ${a.data_agenda.split("-").reverse().join("/")} ${a.horario_inicio?.slice(0, 5) || ""}${a.horario_fim ? "-" + a.horario_fim.slice(0, 5) : ""} (${a.status})`;
      });

      const summary = `Suas agendas para ${monthName}:\n${lines.join("\n")}`.slice(0, 900);

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
            notificationType: "monthly_agenda",
            templateName: "menu_unidade",
            templateParams: [summary],
            languageCode: "pt_BR",
          }),
        });
        if (resp.ok) sent++;
      } catch (e) {
        console.error("Error sending monthly agenda:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, sent, totalUsers: byUser.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
