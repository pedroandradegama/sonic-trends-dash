import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

/**
 * Webhook receiver: HOP IMAG calls this when an agenda is confirmed/rejected.
 * Auth: x-webhook-secret header must match WEBHOOK_SHARED_SECRET.
 *
 * Body: { agenda_id, status, confirmed_by? }
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Validate shared secret
    const secret = req.headers.get('x-webhook-secret')
    const expectedSecret = Deno.env.get('WEBHOOK_SHARED_SECRET')
    if (!expectedSecret || secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { agenda_id, status, confirmed_by } = body

    if (!agenda_id || !status) {
      return new Response(JSON.stringify({ error: 'agenda_id and status are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['confirmada', 'rejeitada', 'pendente'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'confirmada') {
      updatePayload.confirmed_at = new Date().toISOString()
      if (confirmed_by) updatePayload.confirmed_by = confirmed_by
    }

    const { error } = await supabase
      .from('agenda_comunicacoes')
      .update(updatePayload)
      .eq('id', agenda_id)

    if (error) {
      console.error('Error updating agenda:', error)
      throw error
    }

    console.log(`Agenda ${agenda_id} updated to ${status}`)

    return new Response(
      JSON.stringify({ success: true, agenda_id, status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('sync-hop-agendas error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
