import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WEEKDAYS_PT = ['dom','seg','ter','qua','qui','sex','sáb']
const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function formatShiftType(st: string): string {
  const map: Record<string, string> = {
    slot1: '7h–13h', slot2: '13h–19h', slot3: '19h–01h', slot4: '01h–07h',
    plantao_6h: 'Plantão 6h', plantao_12h: 'Plantão 12h', plantao_24h: 'Plantão 24h',
  }
  return map[st] ?? st
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    const nextMonday = new Date(now)
    nextMonday.setDate(now.getDate() + daysToMonday)
    const nextSunday = new Date(nextMonday)
    nextSunday.setDate(nextMonday.getDate() + 6)

    const startStr = nextMonday.toISOString().split('T')[0]
    const endStr = nextSunday.toISOString().split('T')[0]

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
        const { data: shifts } = await supabase
          .from('fn_calendar_shifts')
          .select('shift_date, shift_type, service_id')
          .eq('user_id', profile.user_id)
          .gte('shift_date', startStr)
          .lte('shift_date', endStr)
          .order('shift_date')

        const { data: docProfile } = await supabase
          .from('profiles')
          .select('medico_nome')
          .eq('user_id', profile.user_id)
          .maybeSingle()

        const firstName = docProfile?.medico_nome?.split(' ')[0] ?? 'Doutor'

        const serviceIds = [...new Set((shifts ?? []).map(s => s.service_id))]
        const { data: services } = await supabase
          .from('fn_services')
          .select('id, name')
          .in('id', serviceIds.length > 0 ? serviceIds : ['__none__'])

        const svcMap = Object.fromEntries((services ?? []).map(s => [s.id, s.name]))

        let weekText = ''
        if (!shifts?.length) {
          weekText = 'Nenhum turno registrado para a próxima semana.'
        } else {
          const byDay = new Map<string, typeof shifts>()
          for (const s of shifts) {
            const arr = byDay.get(s.shift_date) ?? []
            arr.push(s)
            byDay.set(s.shift_date, arr)
          }
          const lines: string[] = []
          byDay.forEach((dayShifts, date) => {
            const d = new Date(date + 'T12:00:00')
            const dow = WEEKDAYS_PT[d.getDay()]
            const day = d.getDate()
            const mon = MONTHS_PT[d.getMonth()]
            const turnosStr = dayShifts
              .map(s => `${svcMap[s.service_id] ?? '?'} (${formatShiftType(s.shift_type)})`)
              .join(' + ')
            lines.push(`${dow} ${day}/${mon}: ${turnosStr}`)
          })
          weekText = lines.join('\n')
        }

        let weekGross = 0
        for (const shift of shifts ?? []) {
          const { data: sv } = await supabase
            .from('fn_shift_values')
            .select('value_brl')
            .eq('service_id', shift.service_id)
            .eq('shift_type', shift.shift_type)
            .maybeSingle()
          weekGross += sv?.value_brl ?? 0
        }

        const startLabel = `${nextMonday.getDate()}/${MONTHS_PT[nextMonday.getMonth()]}`
        const endLabel = `${nextSunday.getDate()}/${MONTHS_PT[nextSunday.getMonth()]}`

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
              recipientName: docProfile?.medico_nome,
              notificationType: 'weekly_agenda_digest',
              templateName: 'agenda_semanal_fn',
              templateParams: [
                firstName,
                `${startLabel} a ${endLabel}`,
                shifts?.length ? weekText.slice(0, 900) : 'Nenhum turno registrado.',
                weekGross > 0 ? `R$ ${Math.round(weekGross).toLocaleString('pt-BR')}` : 'Sem turnos',
              ],
            }),
          }
        )

        const waData = await waRes.json()
        if (waData.success) { sent++ } else { failed++ }
      } catch (err) {
        console.error(`Error for user ${profile.user_id}:`, err)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, week: `${startStr} to ${endStr}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})
