import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getReadingTimeField(minutes: number): string {
  if (minutes === 3) return "summary_3min";
  if (minutes === 10) return "summary_10min";
  return "summary_5min";
}

function truncateParam(text: string, maxLen = 900): string {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    // 1. Get pending dispatches for today
    const { data: pendingItems, error: fetchError } = await supabase
      .from("digest_dispatch_queue")
      .select("id, doctor_id, article_id, scheduled_for")
      .eq("scheduled_for", today)
      .eq("status", "pending");

    if (fetchError) {
      console.error("Error fetching dispatch queue:", fetchError.message);
      throw fetchError;
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log("No pending dispatches for today");
      return new Response(
        JSON.stringify({ success: true, dispatched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Group by doctor
    const byDoctor = new Map<string, typeof pendingItems>();
    for (const item of pendingItems) {
      const group = byDoctor.get(item.doctor_id) || [];
      group.push(item);
      byDoctor.set(item.doctor_id, group);
    }

    let dispatched = 0;
    let failed = 0;

    for (const [doctorId, items] of byDoctor.entries()) {
      try {
        // Get doctor profile + preferences
        const { data: profile } = await supabase
          .from("profiles")
          .select("medico_nome, whatsapp_number")
          .eq("user_id", doctorId)
          .maybeSingle();

        if (!profile?.whatsapp_number) {
          console.log(`No WhatsApp number for doctor ${doctorId}, skipping`);
          await supabase
            .from("digest_dispatch_queue")
            .update({ status: "skipped" })
            .in("id", items.map((i) => i.id));
          continue;
        }

        const { data: prefs } = await supabase
          .from("doctor_preferences")
          .select("digest_reading_time, digest_frequency")
          .eq("user_id", doctorId)
          .maybeSingle();

        const readingTime = prefs?.digest_reading_time || 5;
        const summaryField = getReadingTimeField(readingTime);

        // Get article details + summaries
        const articleIds = items.map((i) => i.article_id);
        const { data: articles } = await supabase
          .from("ultrasound_articles")
          .select("id, title, url, source, publication_date")
          .in("id", articleIds);

        const { data: summaries } = await supabase
          .from("article_summaries")
          .select("*")
          .in("article_id", articleIds);

        const summaryMap = new Map((summaries || []).map((s: any) => [s.article_id, s]));

        // 3. Send header template
        const dataFormatada = formatDate(today);
        const { error: headerError } = await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: profile.whatsapp_number,
            recipientName: profile.medico_nome,
            notificationType: "artigos_resumo",
            templateName: "digest_radiologia_introducao",
            languageCode: "pt_BR",
            templateParams: [
              dataFormatada,
              readingTime.toString(),
              (articles?.length || 0).toString(),
            ],
          },
        });

        if (headerError) {
          console.error(`Failed to send header to ${doctorId}:`, headerError.message);
        }

        // 4. Send one message per article
        let allSent = true;
        for (const article of articles || []) {
          const summary = summaryMap.get(article.id);
          if (!summary) continue;

          const summaryText = (summary as any)[summaryField] || summary.summary_5min || summary.summary_3min || summary.summary_10min || "";
          if (!summaryText) {
            console.log(`No summary text for article ${article.id}, skipping`);
            continue;
          }
          const { error: artError } = await supabase.functions.invoke("send-whatsapp", {
            body: {
              to: profile.whatsapp_number,
              recipientName: profile.medico_nome,
              notificationType: "artigos_resumo",
              templateName: "digest_radiologia_artigo",
              languageCode: "pt_BR",
              templateParams: [
                truncateParam((summary as any).short_title || article.title, 200),
                truncateParam(article.source, 100),
                truncateParam(summaryText, 900),
                truncateParam(article.url, 500),
              ],
            },
          });

          if (artError) {
            console.error(`Failed to send article ${article.id} to ${doctorId}:`, artError.message);
            allSent = false;
          }

          // Delay between sends to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (!allSent || headerError) {
          const errMsg = headerError?.message || "One or more articles failed";
          console.error(`Partial failure for ${doctorId}:`, errMsg);

          await supabase
            .from("digest_dispatch_queue")
            .update({ status: "failed" })
            .in("id", items.map((i) => i.id));

          failed += items.length;
        } else {
          // Success
          await supabase
            .from("digest_dispatch_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .in("id", items.map((i) => i.id));

          // Recalculate next dispatch
          const nextInterval =
            prefs?.digest_frequency === "biweekly" ? 14 :
            prefs?.digest_frequency === "monthly" ? 30 : 7;
          const nextDispatch = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000).toISOString();

          await supabase
            .from("doctor_preferences")
            .update({ digest_next_dispatch: nextDispatch })
            .eq("user_id", doctorId);

          dispatched += items.length;
        }
      } catch (err) {
        console.error(`Error dispatching to ${doctorId}:`, err);
        await supabase
          .from("digest_dispatch_queue")
          .update({ status: "failed" })
          .in("id", items.map((i) => i.id));
        failed += items.length;
      }
    }

    // 5. Chain cleanup
    try {
      await supabase.functions.invoke("cleanup-summaries");
    } catch (err) {
      console.error("Cleanup chain error:", err);
    }

    console.log(`Dispatch done: ${dispatched} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, dispatched, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
