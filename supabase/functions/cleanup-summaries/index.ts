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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get fully dispatched article IDs
    const { data: fullyDispatched, error: rpcError } = await supabase.rpc(
      "get_fully_dispatched_article_ids"
    );

    let clearedSummaries = 0;
    if (!rpcError && fullyDispatched?.length > 0) {
      const ids = fullyDispatched.map((r: any) => r.article_id);
      const { error: updateError } = await supabase
        .from("article_summaries")
        .update({
          summary_3min: null,
          summary_5min: null,
          summary_10min: null,
          clinical_impact: null,
        })
        .in("article_id", ids);

      if (updateError) {
        console.error("Error clearing summaries:", updateError.message);
      } else {
        clearedSummaries = ids.length;
      }
    }

    // 2. Delete old articles (>60 days) without pending dispatches
    const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    // Get pending article IDs first
    const { data: pendingArticles } = await supabase
      .from("digest_dispatch_queue")
      .select("article_id")
      .eq("status", "pending");

    const pendingIds = (pendingArticles || []).map((p: any) => p.article_id);

    let deletedOld = 0;
    if (pendingIds.length > 0) {
      const { data: deleted } = await supabase
        .from("ultrasound_articles")
        .delete()
        .lt("created_at", cutoffDate)
        .not("id", "in", `(${pendingIds.join(",")})`)
        .select("id");
      deletedOld = deleted?.length || 0;
    } else {
      const { data: deleted } = await supabase
        .from("ultrasound_articles")
        .delete()
        .lt("created_at", cutoffDate)
        .select("id");
      deletedOld = deleted?.length || 0;
    }

    console.log(`Cleanup: ${clearedSummaries} summaries cleared, ${deletedOld} old articles deleted`);

    return new Response(
      JSON.stringify({ success: true, clearedSummaries, deletedOld }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
