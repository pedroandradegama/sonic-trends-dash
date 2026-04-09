import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Called by THIS project when a doctor creates/deletes an agenda.
 * Forwards the data to HOP IMAG's webhook endpoint.
 *
 * Body: { action: 'created' | 'deleted', agenda: {...} }
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Validate user auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { action, agenda } = body

    if (!action || !agenda) {
      return new Response(JSON.stringify({ error: 'action and agenda required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const hopWebhookUrl = Deno.env.get('HOP_WEBHOOK_URL')
    const webhookSecret = Deno.env.get('WEBHOOK_SHARED_SECRET')

    if (!hopWebhookUrl || !webhookSecret) {
      // If HOP webhook not configured yet, just log and succeed silently
      console.log('HOP_WEBHOOK_URL not configured, skipping notification')
      return new Response(
        JSON.stringify({ success: true, forwarded: false, reason: 'HOP_WEBHOOK_URL not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hopResponse = await fetch(hopWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret,
      },
      body: JSON.stringify({ action, agenda }),
    })

    const hopResult = await hopResponse.json().catch(() => ({}))

    console.log(`Notified HOP: action=${action}, status=${hopResponse.status}`)

    return new Response(
      JSON.stringify({ success: true, forwarded: true, hop_status: hopResponse.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('notify-hop-agenda error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
