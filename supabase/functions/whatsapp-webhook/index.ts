import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const VERIFY_TOKEN = "imag_whatsapp_verify_2024";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ── Send free-text WhatsApp message ──────────────────────────
async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  const result = await res.json();
  console.log("WhatsApp reply sent:", JSON.stringify(result));
  return result;
}

// ── Classify intent via OpenAI ───────────────────────────────
async function classifyIntent(text: string): Promise<{
  type: "task_create" | "query_data" | "radioburger" | "chitchat";
  entities: Record<string, unknown>;
}> {
  const today = new Date().toISOString().split("T")[0];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um assistente de classificação de intenções para médicos radiologistas.
Hoje é ${today}. Classifique a mensagem e extraia entidades relevantes.

Tipos possíveis:
- "task_create": o usuário quer criar um lembrete ou tarefa. Extraia title, category (financial|professional|personal|health), due_date (YYYY-MM-DD), is_recurring (bool), recurrence_type (weekly|monthly|yearly ou null).
- "query_data": o usuário quer consultar dados financeiros, produção, RPH, NPS, escalas.
- "radioburger": o usuário pergunta sobre o próximo radioburger.
- "chitchat": saudação ou conversa genérica.

Retorne JSON: { "type": "...", "entities": {...} }`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  const data = await res.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { type: "chitchat", entities: {} };
  }
}

// ── Intent handlers ──────────────────────────────────────────

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

async function handleRadioburger(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabaseAdmin
    .from("admin_radioburger_dates")
    .select("date, description")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(1);

  if (!data || data.length === 0) {
    return "Ainda não temos uma data confirmada para o próximo Radioburger. Fique atento! 🍔";
  }
  const next = data[0];
  const desc = next.description ? `\n📝 ${next.description}` : "";
  return `🍔 O próximo *Radioburger* será em *${formatDateBR(next.date)}*!${desc}\n\nTe esperamos lá! 😄`;
}

async function handleTaskCreate(
  userId: string,
  entities: Record<string, unknown>
): Promise<string> {
  const title = (entities.title as string) || "Nova tarefa";
  const category = (entities.category as string) || "personal";
  const dueDate = (entities.due_date as string) || null;
  const isRecurring = (entities.is_recurring as boolean) || false;

  const recurrenceRule = isRecurring
    ? {
        type: entities.recurrence_type || "monthly",
        day_of_month: new Date().getDate(),
      }
    : null;

  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .insert({
      medico_id: userId,
      title,
      category,
      due_date: dueDate,
      is_recurring: isRecurring,
      recurrence_rule: recurrenceRule,
      created_via: "whatsapp",
    })
    .select()
    .single();

  if (error) {
    console.error("Task creation error:", error);
    return "Desculpe, não consegui criar a tarefa. Tente novamente ou acesse o app. 😕";
  }

  const dueLine = task.due_date
    ? `📅 Vencimento: ${formatDateBR(task.due_date)}\n`
    : "";
  const recurLine = task.is_recurring ? "🔄 Tarefa recorrente\n" : "";

  return (
    `✅ Tarefa criada!\n\n` +
    `📋 *${task.title}*\n` +
    dueLine +
    recurLine +
    `\nVocê receberá lembretes via WhatsApp.`
  );
}

async function handleQueryData(userId: string): Promise<string> {
  // Try to fetch latest KPI snapshot
  const { data: kpi } = await supabaseAdmin
    .from("fn_kpi_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .single();

  if (kpi) {
    const rate = kpi.effective_rate?.toFixed(2) ?? "N/A";
    const gross = (kpi.total_gross / 100)?.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }) ?? "N/A";
    return (
      `📊 *Resumo Financeiro (${kpi.snapshot_month})*\n\n` +
      `💰 Bruto: ${gross}\n` +
      `⏱ Horas: ${kpi.total_hours}h\n` +
      `📈 Taxa efetiva: R$ ${rate}/h\n` +
      `🗓 Plantões: ${kpi.shift_count}`
    );
  }

  return (
    "Ainda não tenho dados financeiros para exibir. " +
    "Configure seus serviços no Navegador Financeiro primeiro! 📊"
  );
}

// ── Main handler ─────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Webhook verification (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Incoming message (POST)
  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).slice(0, 500));

    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const msg = messages[0];
    const from = msg.from;

    // Only handle text messages
    if (msg.type !== "text") {
      await sendWhatsAppMessage(
        from,
        "Desculpe, no momento só consigo responder a mensagens de texto. 😊"
      );
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const text = msg.text?.body || "";

    // 1. Identify doctor by whatsapp_number
    const { data: profile } = await supabaseAdmin
      .from("fn_doctor_profile")
      .select("user_id, whatsapp_number")
      .eq("whatsapp_number", from)
      .single();

    if (!profile) {
      await sendWhatsAppMessage(
        from,
        "Número não cadastrado. Acesse o app IMAG para vincular seu WhatsApp no perfil do Navegador Financeiro. 📱"
      );
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const userId = profile.user_id;

    // 2. Classify intent via GPT
    const intent = await classifyIntent(text);
    console.log("Intent classified:", JSON.stringify(intent));

    // 3. Route to handler
    let reply: string;

    switch (intent.type) {
      case "radioburger":
        reply = await handleRadioburger();
        break;
      case "task_create":
        reply = await handleTaskCreate(userId, intent.entities);
        break;
      case "query_data":
        reply = await handleQueryData(userId);
        break;
      default:
        reply =
          "Olá! 👋 Sou o assistente IMAG. Posso te ajudar com:\n\n" +
          "📋 *Criar tarefas* — ex: \"me lembre de renovar o CRM dia 15\"\n" +
          "📊 *Consultar dados* — ex: \"como foi meu faturamento?\"\n" +
          "🍔 *Radioburger* — ex: \"quando é o próximo radioburger?\"\n\n" +
          "O que você precisa?";
    }

    await sendWhatsAppMessage(from, reply);

    // 4. Log conversation context
    await supabaseAdmin.from("whatsapp_conversations").upsert(
      {
        medico_id: userId,
        phone_number: from,
        last_intent: intent.type,
        context: { last_message: text, last_response: reply },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "medico_id" }
    );

    // 5. Dispatch to FN query handler for deeper analysis
    if (text.trim().length > 3) {
      const fnHandlerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fn-whatsapp-query-handler`;
      fetch(fnHandlerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ from_number: from, message_text: text }),
      }).catch((err) => console.error("FN query handler error:", err));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
