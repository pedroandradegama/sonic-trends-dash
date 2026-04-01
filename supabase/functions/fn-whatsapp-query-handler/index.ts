import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MONTHS_PT: Record<string, number> = {
  janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3, maio: 4,
  junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9,
  novembro: 10, dezembro: 11,
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
}

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function parseMonthFromText(text: string): { year: number; month: number } | null {
  const lower = text.toLowerCase()
  const now = new Date()

  if (lower.includes('este mês') || lower.includes('esse mês') || lower.includes('mês atual')) {
    return { year: now.getFullYear(), month: now.getMonth() }
  }
  if (lower.includes('mês que vem') || lower.includes('próximo mês') || lower.includes('proximo mes')) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { year: next.getFullYear(), month: next.getMonth() }
  }
  if (lower.includes('mês passado') || lower.includes('mes passado')) {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return { year: prev.getFullYear(), month: prev.getMonth() }
  }

  for (const [name, idx] of Object.entries(MONTHS_PT)) {
    if (lower.includes(name)) {
      const yearMatch = lower.match(/20\d\d/)
      const year = yearMatch ? parseInt(yearMatch[0]) : now.getFullYear()
      return { year, month: idx }
    }
  }

  const mmyyyy = lower.match(/(\d{2})[\/\-](\d{4})/)
  if (mmyyyy) {
    return { year: parseInt(mmyyyy[2]), month: parseInt(mmyyyy[1]) - 1 }
  }

  return null
}

function isProductionQuery(text: string): boolean {
  const lower = text.toLowerCase()
  const keywords = [
    'produção', 'producao', 'quanto produzi', 'quanto vou produzir',
    'valor do mês', 'valor de', 'projeção', 'projecao', 'receita',
    'quanto ganhei', 'quanto vou ganhar', 'repasse',
  ]
  return keywords.some(k => lower.includes(k))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { from_number, message_text } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const cleanPhone = from_number.replace(/\D/g, '')
    const { data: fnProfile } = await supabase
      .from('fn_doctor_profile')
      .select('user_id, whatsapp_number')
      .or(`whatsapp_number.eq.${cleanPhone},whatsapp_number.eq.+55${cleanPhone},whatsapp_number.eq.55${cleanPhone}`)
      .maybeSingle()

    if (!fnProfile) {
      return new Response(JSON.stringify({ handled: false, reason: 'user_not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const uid = fnProfile.user_id

    if (!isProductionQuery(message_text)) {
      return new Response(JSON.stringify({ handled: false, reason: 'not_production_query' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const parsed = parseMonthFromText(message_text)
    const now = new Date()
    const targetYear = parsed?.year ?? now.getFullYear()
    const targetMonth = parsed?.month ?? now.getMonth()

    const startStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`
    const endStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-31`

    const { data: shifts } = await supabase
      .from('fn_calendar_shifts')
      .select('shift_date, shift_type, service_id')
      .eq('user_id', uid)
      .gte('shift_date', startStr)
      .lte('shift_date', endStr)

    if (!shifts?.length) {
      const monthLabel = `${MONTHS_SHORT[targetMonth]}/${String(targetYear).slice(2)}`
      const response = `Não encontrei turnos registrados para *${monthLabel}* no seu Navegador Financeiro. Acesse o Portal para adicionar seus turnos.`

      await sendResponse(cleanPhone, response)
      await logQuery(supabase, uid, cleanPhone, message_text, 'producao_mes', response, `${targetYear}-${String(targetMonth+1).padStart(2,'0')}`)

      return new Response(JSON.stringify({ handled: true, response }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let totalGross = 0
    const byService: Record<string, { name: string; gross: number; shifts: number }> = {}

    for (const shift of shifts) {
      const { data: sv } = await supabase
        .from('fn_shift_values')
        .select('value_brl')
        .eq('service_id', shift.service_id)
        .eq('shift_type', shift.shift_type)
        .maybeSingle()

      const { data: svc } = await supabase
        .from('fn_services')
        .select('name, fiscal_mode, fiscal_pct_total')
        .eq('id', shift.service_id)
        .maybeSingle()

      const val = sv?.value_brl ?? 0
      totalGross += val

      const svcName = svc?.name ?? 'Serviço'
      if (!byService[shift.service_id]) byService[shift.service_id] = { name: svcName, gross: 0, shifts: 0 }
      byService[shift.service_id].gross += val
      byService[shift.service_id].shifts += 1
    }

    const monthLabel = `${MONTHS_SHORT[targetMonth]}/${String(targetYear).slice(2)}`
    const serviceLines = Object.values(byService)
      .map(s => `  • ${s.name}: R$ ${Math.round(s.gross).toLocaleString('pt-BR')} (${s.shifts} turno${s.shifts !== 1 ? 's' : ''})`)
      .join('\n')

    const response = [
      `📊 *Produção estimada — ${monthLabel}*`,
      '',
      serviceLines,
      '',
      `*Total bruto: R$ ${Math.round(totalGross).toLocaleString('pt-BR')}*`,
      '',
      '_Para ver recebimentos, fluxo de caixa e valores líquidos, acesse o Portal._',
    ].join('\n')

    await sendResponse(cleanPhone, response)
    await logQuery(supabase, uid, cleanPhone, message_text, 'producao_mes', response, `${targetYear}-${String(targetMonth+1).padStart(2,'0')}`)

    return new Response(JSON.stringify({ handled: true, gross: totalGross, response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})

async function sendResponse(toPhone: string, text: string) {
  const token = Deno.env.get('WHATSAPP_TOKEN')
  const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  if (!token || !phoneId) return

  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: text },
    }),
  })
}

async function logQuery(
  supabase: any, userId: string, fromNumber: string,
  queryText: string, queryType: string, response: string, monthRef: string
) {
  await supabase.from('fn_whatsapp_queries').insert({
    user_id: userId,
    from_number: fromNumber,
    query_type: queryType,
    query_text: queryText,
    response,
    month_ref: monthRef,
  })
}
