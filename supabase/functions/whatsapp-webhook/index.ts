import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const VERIFY_TOKEN = "imag_whatsapp_verify_2024";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Keywords mapping
const KEYWORDS: Record<string, string> = {
  radioburger: "radioburger",
  "radio burger": "radioburger",
  "próximo radioburger": "radioburger",
  "proximo radioburger": "radioburger",
};

function detectKeyword(text: string): string | null {
  const normalized = text.toLowerCase().trim();
  for (const [key, value] of Object.entries(KEYWORDS)) {
    if (normalized.includes(key)) return value;
  }
  return null;
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

async function handleRadioburger(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabaseAdmin
    .from("admin_radioburger_dates")
    .select("date, description")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return "Ainda não temos uma data confirmada para o próximo Radioburger. Fique atento às comunicações! 🍔";
  }

  const next = data[0];
  const formatted = formatDateBR(next.date);
  const desc = next.description ? `\n📝 ${next.description}` : "";
  return `🍔 O próximo *Radioburger* será em *${formatted}*!${desc}\n\nTe esperamos lá! 😄`;
}

async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
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
  const result = await response.json();
  console.log("WhatsApp reply sent:", JSON.stringify(result));
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
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

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      // Status update or other non-message event
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const msg = messages[0];
    const from = msg.from; // sender phone number
    const msgType = msg.type;

    // Only handle text messages
    if (msgType !== "text") {
      await sendWhatsAppMessage(from, "Desculpe, no momento só consigo responder a mensagens de texto. 😊");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const text = msg.text?.body || "";
    const keyword = detectKeyword(text);

    let reply: string;

    if (keyword === "radioburger") {
      reply = await handleRadioburger();
    } else {
      reply = "Olá! 👋 No momento, posso te ajudar com:\n\n🍔 *radioburger* — próxima data do Radioburger\n\nDigite uma das palavras-chave acima para receber a informação.";
    }

    await sendWhatsAppMessage(from, reply);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
