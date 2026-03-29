import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function findServiceByName(
  supabase: any,
  userId: string,
  mention: string
): Promise<string | null> {
  const { data } = await supabase
    .from('fn_services')
    .select('id, name')
    .eq('user_id', userId)
  if (!data) return null
  const lower = mention.toLowerCase()
  const match = data.find((s: any) =>
    s.name.toLowerCase().includes(lower) ||
    lower.includes(s.name.toLowerCase().split(' ')[0])
  )
  return match?.id ?? null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const transcript = formData.get('transcript') as string | null

    let finalTranscript = transcript

    if (!finalTranscript && audioFile) {
      const whisperForm = new FormData()
      whisperForm.append('file', audioFile, 'audio.webm')
      whisperForm.append('model', 'whisper-1')
      whisperForm.append('language', 'pt')

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}` },
        body: whisperForm,
      })
      const whisperData = await whisperRes.json()
      finalTranscript = whisperData.text
    }

    if (!finalTranscript) {
      return new Response(JSON.stringify({ error: 'No transcript' }), { status: 400, headers: corsHeaders })
    }

    const { data: services } = await supabase
      .from('fn_services')
      .select('id, name')
      .eq('user_id', user.id)

    const servicesContext = services
      ?.map((s: any) => `- "${s.name}" (id: ${s.id})`)
      .join('\n') ?? ''

    const systemPrompt = `Você é um parser de comandos de agenda médica.
Extraia turnos de trabalho do texto transcrito e retorne APENAS JSON válido, sem markdown.

Serviços disponíveis do médico:
${servicesContext}

Convenção de slots:
- slot1 = 07h–13h (manhã)
- slot2 = 13h–19h (tarde)
- slot3 = 19h–01h (noite)
- slot4 = 01h–07h (madrugada)
- plantao_6h = plantão de 6h
- plantao_12h = plantão de 12h
- plantao_24h = plantão de 24h

Datas relativas devem ser resolvidas considerando hoje = ${new Date().toISOString().split('T')[0]}.
Meses por extenso em português devem ser interpretados corretamente.

Retorne um array JSON com objetos:
{
  "service_name": "nome mencionado",
  "service_id": "id se encontrado ou null",
  "shift_date": "YYYY-MM-DD",
  "shift_type": "slot1|slot2|slot3|slot4|plantao_6h|plantao_12h|plantao_24h",
  "confidence": 0.0-1.0,
  "raw_mention": "trecho original que originou essa entrada"
}

Se não conseguir extrair nenhum turno, retorne [].
Se houver ambiguidade no nome do serviço, use service_id: null e mantenha service_name.`

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalTranscript },
        ],
      }),
    })

    const gptData = await gptRes.json()
    let parsedActions: any[] = []

    try {
      const raw = gptData.choices[0].message.content.trim()
      parsedActions = JSON.parse(raw)
    } catch {
      parsedActions = []
    }

    for (const action of parsedActions) {
      if (!action.service_id && action.service_name) {
        action.service_id = await findServiceByName(
          supabase, user.id, action.service_name
        )
      }
    }

    await supabase.from('fn_voice_commands').insert({
      user_id: user.id,
      raw_transcript: finalTranscript,
      parsed_actions: parsedActions,
      applied: false,
    })

    return new Response(
      JSON.stringify({ transcript: finalTranscript, actions: parsedActions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
