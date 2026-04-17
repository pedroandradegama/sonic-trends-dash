import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const transcriptIn = formData.get('transcript') as string | null;

    let finalTranscript = transcriptIn;
    if (!finalTranscript && audioFile) {
      const wf = new FormData();
      wf.append('file', audioFile, 'audio.webm');
      wf.append('model', 'whisper-1');
      wf.append('language', 'pt');
      const wr = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}` },
        body: wf,
      });
      const wd = await wr.json();
      finalTranscript = wd.text;
    }

    if (!finalTranscript) {
      return new Response(JSON.stringify({ error: 'No transcript' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `Você é um parser de deslocamentos pessoais. A partir do texto transcrito, extraia APENAS JSON válido com esta estrutura:

{
  "entries": [{
    "label": string,
    "origin_description": string,
    "destination_description": string,
    "duration_minutes": number,
    "days_of_week": number[],
    "time_of_day": string,
    "is_round_trip": boolean
  }]
}

Considere hoje = ${today}. Interprete linguagem natural em português. Se is_round_trip=true, duplique o duration_minutes. Retorne SOMENTE JSON, sem markdown.`;

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalTranscript },
        ],
      }),
    });

    const gptData = await gptRes.json();
    let entries: any[] = [];
    try {
      const parsed = JSON.parse(gptData.choices[0].message.content);
      entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    } catch {
      entries = [];
    }

    return new Response(JSON.stringify({ transcript: finalTranscript, entries }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
