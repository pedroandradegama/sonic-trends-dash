import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * This edge function syncs agenda confirmations FROM HOP IMAG project
 * INTO this project's agenda_comunicacoes table.
 * 
 * It can be called:
 * 1. By HOP IMAG via webhook when an agenda is confirmed/rejected
 * 2. Periodically to poll for status changes
 * 
 * Modes:
 * - webhook: receives { agenda_id, status, confirmed_by } from HOP
 * - poll: fetches all recent changes from HOP's agenda_comunicacoes
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const localSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const hopUrl = Deno.env.get('HOP_SUPABASE_URL')
    const hopKey = Deno.env.get('HOP_SUPABASE_SERVICE_KEY')

    if (!hopUrl || !hopKey) {
      return new Response(JSON.stringify({ 
        error: 'HOP_SUPABASE_URL and HOP_SUPABASE_SERVICE_KEY must be configured' 
      }), { status: 500, headers: corsHeaders })
    }

    const hopSupabase = createClient(hopUrl, hopKey)

    const body = await req.json().catch(() => ({}))
    const mode = body.mode ?? 'poll'

    if (mode === 'webhook') {
      // Direct webhook from HOP when agenda status changes
      const { agenda_id, status, confirmed_by_name } = body
      if (!agenda_id || !status) {
        return new Response(JSON.stringify({ error: 'agenda_id and status required' }), {
          status: 400, headers: corsHeaders
        })
      }

      const { error } = await localSupabase
        .from('agenda_comunicacoes')
        .update({
          status,
          confirmed_at: status === 'confirmada' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agenda_id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true, agenda_id, status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Poll mode: fetch agenda changes from HOP
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: hopAgendas, error: hopError } = await hopSupabase
      .from('agenda_comunicacoes')
      .select('id, status, confirmed_by, confirmed_at, data_agenda, medico_nome')
      .gte('data_agenda', thirtyDaysAgo.toISOString().split('T')[0])
      .in('status', ['confirmada', 'rejeitada'])

    if (hopError) {
      console.error('Error fetching from HOP:', hopError)
      throw hopError
    }

    let synced = 0
    for (const agenda of hopAgendas ?? []) {
      // Try to find matching local record by id
      const { data: local } = await localSupabase
        .from('agenda_comunicacoes')
        .select('id, status')
        .eq('id', agenda.id)
        .maybeSingle()

      if (local && local.status !== agenda.status) {
        await localSupabase
          .from('agenda_comunicacoes')
          .update({
            status: agenda.status,
            confirmed_at: agenda.confirmed_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', agenda.id)
        synced++
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced, total_checked: hopAgendas?.length ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('sync-hop-agendas error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})
