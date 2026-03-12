import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Find articles that need summaries (missing row OR all summary fields null)
    const { data: allArticles, error: allArticlesError } = await supabase
      .from("ultrasound_articles")
      .select("id, title, url, tags, subgroup, source, publication_date")
      .order("publication_date", { ascending: false })
      .limit(100);

    if (allArticlesError) {
      throw allArticlesError;
    }

    const articleIds = (allArticles || []).map((a: any) => a.id);

    const { data: existingSummaries, error: existingSummariesError } = articleIds.length
      ? await supabase
          .from("article_summaries")
          .select("article_id, summary_3min, summary_5min, summary_10min")
          .in("article_id", articleIds)
      : { data: [], error: null as any };

    if (existingSummariesError) {
      throw existingSummariesError;
    }

    const summaryMap = new Map((existingSummaries || []).map((s: any) => [s.article_id, s]));

    const articlesToProcess = (allArticles || [])
      .filter((article: any) => {
        const s = summaryMap.get(article.id);
        if (!s) return true;
        return !s.summary_3min && !s.summary_5min && !s.summary_10min;
      })
      .slice(0, 20);

    if (!articlesToProcess || articlesToProcess.length === 0) {
      console.log("No articles to summarize");
      return new Response(
        JSON.stringify({ success: true, summarized: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Summarizing ${articlesToProcess.length} articles`);

    let summarized = 0;
    let failed = 0;

    for (const article of articlesToProcess) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            max_tokens: 4096,
            messages: [
              {
                role: "system",
                content: `Você é um assistente especializado em radiologia e ultrassonografia.
Analise o artigo científico e retorne SOMENTE um JSON válido com esta estrutura:
{
  "short_title": "título em português, máximo 60 caracteres",
  "hot_topics": ["termo1", "termo2", "termo3", "termo4"],
  "evidence_level": "Alto" | "Moderado" | "Baixo",
  "emoji_highlight": "emoji único representativo do tema",
  "clinical_impact": "1 parágrafo sobre impacto direto na prática clínica",
  "summary_3min": "resumo em ~350 palavras — leitura rápida, achados principais",
  "summary_5min": "resumo em ~600 palavras — leitura padrão, metodologia e resultados",
  "summary_10min": "resumo em ~1100 palavras — leitura aprofundada, discussão completa"
}
Todos os textos em português brasileiro. Linguagem técnica acessível para radiologistas.
Responda APENAS com o JSON, sem texto adicional nem markdown.`,
              },
              {
                role: "user",
                content: `Título: "${article.title}"\nTags: ${article.tags?.join(", ") || "N/A"}\nSubgrupo: ${article.subgroup}\nFonte: ${article.source}\nData: ${article.publication_date}\nURL: ${article.url}`,
              },
            ],
          }),
        });

        if (!response.ok) {
          console.error(`AI error for article ${article.id}: ${response.status}`);
          failed++;
          continue;
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content?.trim() || "";

        // Try to parse JSON from response (handle markdown code blocks)
        let parsed;
        try {
          const jsonStr = content.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
          parsed = JSON.parse(jsonStr);
        } catch {
          console.error(`Failed to parse JSON for article ${article.id}:`, content.substring(0, 200));
          failed++;
          continue;
        }

        const { error: insertError } = await supabase.from("article_summaries").upsert(
          {
            article_id: article.id,
            short_title: parsed.short_title || null,
            hot_topics: parsed.hot_topics || [],
            evidence_level: parsed.evidence_level || null,
            emoji_highlight: parsed.emoji_highlight || "🔬",
            clinical_impact: parsed.clinical_impact || null,
            summary_3min: parsed.summary_3min || null,
            summary_5min: parsed.summary_5min || null,
            summary_10min: parsed.summary_10min || null,
          },
          { onConflict: "article_id" }
        );

        if (insertError) {
          console.error(`DB error for article ${article.id}:`, insertError.message);
          failed++;
        } else {
          summarized++;
        }
      } catch (err) {
        console.error(`Error summarizing article ${article.id}:`, err);
        failed++;
      }
    }

    // 2. Populate dispatch queue for active doctors
    const { data: doctors } = await supabase
      .from("doctor_preferences")
      .select("user_id, digest_article_limit, digest_next_dispatch")
      .eq("digest_active", true);

    if (doctors && doctors.length > 0) {
      const { data: newSummaries } = await supabase
        .from("article_summaries")
        .select("article_id")
        .or("summary_3min.not.is.null,summary_5min.not.is.null,summary_10min.not.is.null")
        .order("summarized_at", { ascending: false })
        .limit(30);

      const articleIds = (newSummaries || []).map((s: any) => s.article_id);

      for (const doctor of doctors) {
        const limit = doctor.digest_article_limit || 5;
        
        // Check next dispatch date - if past or today, schedule for today
        const nextDispatch = doctor.digest_next_dispatch
          ? new Date(doctor.digest_next_dispatch)
          : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduledFor = nextDispatch <= today
          ? new Date().toISOString().split("T")[0]
          : nextDispatch.toISOString().split("T")[0];

        // Get already dispatched article IDs for this doctor to avoid duplicates
        const { data: alreadyDispatched } = await supabase
          .from("digest_dispatch_queue")
          .select("article_id")
          .eq("doctor_id", doctor.user_id)
          .in("status", ["sent", "pending"]);

        const alreadyDispatchedIds = new Set(
          (alreadyDispatched || []).map((d: any) => d.article_id)
        );

        const newArticleIds = articleIds
          .filter((id: string) => !alreadyDispatchedIds.has(id))
          .slice(0, limit);

        const entries = newArticleIds.map((articleId: string) => ({
          doctor_id: doctor.user_id,
          article_id: articleId,
          scheduled_for: scheduledFor,
          status: "pending",
        }));

        if (entries.length > 0) {
          const { error: insertError } = await supabase
            .from("digest_dispatch_queue")
            .insert(entries);
          if (insertError) {
            console.error(`Queue insert error for ${doctor.user_id}:`, insertError.message);
          } else {
            console.log(`Queued ${entries.length} articles for ${doctor.user_id} on ${scheduledFor}`);
          }
        }
      }
    }

    console.log(`Done: ${summarized} summarized, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, summarized, failed }),
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
