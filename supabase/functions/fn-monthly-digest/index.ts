import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date()
    // Repasse is M-2: sending on 10/Apr => competência Feb
    const repasseMonth = now.getMonth() - 2 // 0-indexed
    const repasseYear = repasseMonth < 0 ? now.getFullYear() - 1 : now.getFullYear()
    const repasseMonthAdjusted = ((repasseMonth % 12) + 12) % 12
    const repasseLabel = `${MONTHS_PT[repasseMonthAdjusted]}/${repasseYear}`

    // Current month for projections
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const currentMonthEnd = new Date(nextMonthStart.getTime() - 86400000).toISOString().split('T')[0]

    // Get all doctors with whatsapp digest enabled
    const { data: profiles } = await supabase
      .from('fn_doctor_profile')
      .select('user_id, whatsapp_number, whatsapp_digest_enabled')
      .eq('whatsapp_digest_enabled', true)
      .not('whatsapp_number', 'is', null)

    if (!profiles?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No active profiles' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let sent = 0
    let failed = 0

    for (const profile of profiles) {
      try {
        // Get doctor profile name
        const { data: docProfile } = await supabase
          .from('profiles')
          .select('medico_nome')
          .eq('user_id', profile.user_id)
          .maybeSingle()

        const firstName = docProfile?.medico_nome?.split(' ')[0] ?? 'Doutor'
        const medicoNome = docProfile?.medico_nome ?? ''

        // ── 1. REPASSE (M-2) ──
        // Build date range for repasse month
        const repasseStart = `${repasseYear}-${String(repasseMonthAdjusted + 1).padStart(2, '0')}-01`
        const repasseEnd = new Date(repasseYear, repasseMonthAdjusted + 1, 0).toISOString().split('T')[0]

        const { data: repasseData } = await supabase
          .from('Repasse')
          .select('"Vl. Repasse", "Qtde"')
          .ilike('"Médico"', `%${medicoNome}%`)
          .gte('"Dt. Atendimento"', repasseStart)
          .lte('"Dt. Atendimento"', repasseEnd)

        let totalRepasse = 0
        let totalQtdRepasse = 0
        for (const r of repasseData ?? []) {
          const val = parseFloat(String(r['Vl. Repasse'] ?? '0').replace(',', '.'))
          const qtd = parseInt(String(r['Qtde'] ?? '0'))
          if (!isNaN(val)) totalRepasse += val
          if (!isNaN(qtd)) totalQtdRepasse += qtd
        }

        // ── 2. NPS (previous month) ──
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        const prevStart = prevMonthStart.toISOString().split('T')[0]
        const prevEnd = prevMonthEnd.toISOString().split('T')[0]

        const { data: npsData } = await supabase
          .from('NPS')
          .select('nota_real')
          .ilike('prestador_nome', `%${medicoNome}%`)
          .gte('data_atendimento', prevStart)
          .lte('data_atendimento', prevEnd)
          .not('nota_real', 'is', null)

        const npsScores = (npsData ?? []).map(n => n.nota_real).filter((n): n is number => n !== null)
        const avgNps = npsScores.length > 0
          ? Math.round(npsScores.reduce((a, b) => a + b, 0) / npsScores.length * 10) / 10
          : null

        // ── 3. EXAMES (previous month) ──
        const { data: examesData, count: examesCount } = await supabase
          .from('Exames')
          .select('Exame', { count: 'exact', head: true })
          .ilike('"Médico executante"', `%${medicoNome}%`)
          .gte('"Dt. Pedido"', prevStart)
          .lte('"Dt. Pedido"', prevEnd)

        // ── 4. TURNOS PROJETADOS (current month) ──
        const { data: shiftsData } = await supabase
          .from('fn_calendar_shifts')
          .select('id, shift_type, service_id')
          .eq('user_id', profile.user_id)
          .gte('shift_date', currentMonthStart)
          .lte('shift_date', currentMonthEnd)

        const shiftCount = shiftsData?.length ?? 0

        // ── 5. PRODUTIVIDADE PROJETADA (current month gross) ──
        let monthGross = 0
        const serviceIds = [...new Set((shiftsData ?? []).map(s => s.service_id))]
        if (serviceIds.length > 0) {
          const { data: shiftValues } = await supabase
            .from('fn_shift_values')
            .select('service_id, shift_type, value_brl')
            .in('service_id', serviceIds)

          const valMap = new Map<string, number>()
          for (const sv of shiftValues ?? []) {
            valMap.set(`${sv.service_id}:${sv.shift_type}`, sv.value_brl)
          }
          for (const s of shiftsData ?? []) {
            monthGross += valMap.get(`${s.service_id}:${s.shift_type}`) ?? 0
          }
        }

        // Also add fixed income (pro_labore, distribuicao)
        const { data: fixedServices } = await supabase
          .from('fn_services')
          .select('regime, fixed_monthly_value, distribution_frequency, distribution_months')
          .eq('user_id', profile.user_id)
          .in('regime', ['pro_labore', 'distribuicao_lucros'])
          .eq('is_active', true)

        for (const svc of fixedServices ?? []) {
          if (svc.regime === 'pro_labore') {
            monthGross += svc.fixed_monthly_value ?? 0
          } else if (svc.regime === 'distribuicao_lucros') {
            const freq = svc.distribution_frequency
            const months = svc.distribution_months as number[] | null
            const currentMonth = now.getMonth() + 1
            if (freq === 'monthly') {
              monthGross += svc.fixed_monthly_value ?? 0
            } else if (months?.includes(currentMonth)) {
              monthGross += svc.fixed_monthly_value ?? 0
            }
          }
        }

        // ── BUILD MESSAGE ──
        const prevLabel = `${MONTHS_PT[now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1]}/${now.getMonth() - 1 < 0 ? now.getFullYear() - 1 : now.getFullYear()}`
        const currentLabel = `${MONTHS_PT[now.getMonth()]}/${now.getFullYear()}`

        const lines: string[] = []
        lines.push(`📊 *Resumo Mensal - ${currentLabel}*`)
        lines.push('')
        lines.push(`📋 *Dados processados (${prevLabel}):*`)
        lines.push(`💰 Repasse (${repasseLabel}): R$ ${Math.round(totalRepasse).toLocaleString('pt-BR')} (${totalQtdRepasse} procedimentos)`)
        lines.push(`⭐ NPS médio: ${avgNps !== null ? avgNps.toString() : 'sem dados'}`)
        lines.push(`🔬 Exames realizados: ${examesCount ?? 0}`)
        lines.push('')
        lines.push(`📅 *Projeção ${currentLabel}:*`)
        lines.push(`🗓 Turnos projetados: ${shiftCount}`)
        lines.push(`💵 Produtividade bruta projetada: R$ ${Math.round(monthGross).toLocaleString('pt-BR')}`)

        const messageBody = lines.join('\n')

        // Send via WhatsApp (using free-form text via send-whatsapp)
        const phone = profile.whatsapp_number!.replace(/\D/g, '')

        const waRes = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              to: phone,
              recipientName: medicoNome,
              notificationType: 'monthly_digest',
              templateName: 'resumo_mensal_fn',
              templateParams: [
                firstName,
                messageBody,
              ],
            }),
          }
        )

        const waData = await waRes.json()
        if (waData.success) { sent++ } else { failed++ }
        console.log(`Monthly digest for ${firstName}: sent=${waData.success}`)

      } catch (err) {
        console.error(`Error for user ${profile.user_id}:`, err)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, month: currentMonthStart }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})
