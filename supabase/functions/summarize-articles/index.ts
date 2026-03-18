import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUMMARY_READY_FILTER = "summary_3min.not.is.null,summary_5min.not.is.null,summary_10min.not.is.null";

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getScheduledFor(nextDispatch: string | null): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!nextDispatch) {
    return toDateOnly(new Date());
  }

  const dispatchDate = new Date(nextDispatch);
  return dispatchDate <= today ? toDateOnly(new Date()) : toDateOnly(dispatchDate);
}

async function getLatestSummarizedArticleIds(supabase: ReturnType<typeof createClient>, limit = 100): Promise<string[]> {
  const { data, error } = await supabase
    .from("article_summaries")
    .select("article_id")
    .or(SUMMARY_READY_FILTER)
    .order("summarized_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return Array.from(new Set((data || []).map((item: any) => item.article_id).filter(Boolean)));
}

async function queueDigestArticles(
  supabase: ReturnType<typeof createClient>,
  candidateArticleIds: string[]
): Promise<number> {
  const articleIds = Array.from(new Set(candidateArticleIds.filter(Boolean)));

  if (articleIds.length === 0) {
    return 0;
  }

  const { data: doctors, error: doctorsError } = await supabase
    .from("doctor_preferences")
    .select("user_id, digest_article_limit, digest_next_dispatch")
    .eq("digest_active", true);

  if (doctorsError) {
    throw doctorsError;
  }

  let queued = 0;

  for (const doctor of doctors || []) {
    const { data: alreadyDispatched, error: existingError } = await supabase
      .from("digest_dispatch_queue")
      .select("article_id")
      .eq("doctor_id", doctor.user_id)
      .in("status", ["sent", "pending"]);

    if (existingError) {
      console.error(`Queue lookup error for ${doctor.user_id}:`, existingError.message);
      continue;
    }

    const alreadyDispatchedIds = new Set(
      (alreadyDispatched || []).map((item: any) => item.article_id)
    );

    const limit = doctor.digest_article_limit || 5;
    const scheduledFor = getScheduledFor(doctor.digest_next_dispatch);
    const entries = articleIds
      .filter((articleId) => !alreadyDispatchedIds.has(articleId))
      .slice(0, limit)
      .map((articleId) => ({
        doctor_id: doctor.user_id,
        article_id: articleId,
        scheduled_for: scheduledFor,
        status: "pending",
      }));

    if (entries.length === 0) {
      continue;
    }

    const { error: insertError } = await supabase
      .from("digest_dispatch_queue")
      .insert(entries);

    if (insertError) {
      console.error(`Queue insert error for ${doctor.user_id}:`, insertError.message);
      continue;
    }

    queued += entries.length;
    console.log(`Queued ${entries.length} articles for ${doctor.user_id} on ${scheduledFor}`);
  }

  return queued;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const queuedBefore = await queueDigestArticles(
      supabase,
      await getLatestSummarizedArticleIds(supabase, 100)
    );

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "LOVABLE_API_KEY not configured",
          queued: queuedBefore,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: allArticles, error: allArticlesError } = await supabase
      .from("ultrasound_articles")
      .select("id, title, url, tags, subgroup, source, publication_date")
      .order("publication_date", { ascending: false })
      .limit(100);

    if (allArticlesError) {
      throw allArticlesError;
    }

    const articleIds = (allArticles || []).map((article: any) => article.id);
    const { data: existingSummaries, error: existingSummariesError } = articleIds.length
      ? await supabase
          .from("article_summaries")
          .select("article_id, summary_3min, summary_5min, summary_10min")
          .in("article_id", articleIds)
      : { data: [], error: null as any };

    if (existingSummariesError) {
      throw existingSummariesError;
    }

    const summaryMap = new Map((existingSummaries || []).map((item: any) => [item.article_id, item]));
    const articlesToProcess = (allArticles || [])
      .filter((article: any) => {
        const summary = summaryMap.get(article.id);
        if (!summary) return true;
        return !summary.summary_3min && !summary.summary_5min && !summary.summary_10min;
      })
      .slice(0, 8);

    if (articlesToProcess.length === 0) {
      console.log("No articles to summarize");
      return new Response(
        JSON.stringify({ success: true, summarized: 0, failed: 0, queued: queuedBefore }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Summarizing ${articlesToProcess.length} articles`);

    let summarized = 0;
    let failed = 0;
    const summarizedArticleIds: string[] = [];

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
          continue;
        }

        summarized++;
        summarizedArticleIds.push(article.id);
      } catch (err) {
        console.error(`Error summarizing article ${article.id}:`, err);
        failed++;
      }
    }

    const queuedAfter = await queueDigestArticles(supabase, summarizedArticleIds);

    console.log(`Done: ${summarized} summarized, ${failed} failed, ${queuedBefore + queuedAfter} queued`);

    return new Response(
      JSON.stringify({ success: true, summarized, failed, queued: queuedBefore + queuedAfter }),
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