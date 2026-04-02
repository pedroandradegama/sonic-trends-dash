import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLUGGY_API = 'https://api.pluggy.ai'

async function getPluggyApiKey(): Promise<string> {
  const res = await fetch(`${PLUGGY_API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: Deno.env.get('PLUGGY_CLIENT_ID'),
      clientSecret: Deno.env.get('PLUGGY_CLIENT_SECRET'),
    }),
  })
  const data = await res.json()
  if (!data.apiKey) throw new Error(`Pluggy auth failed: ${JSON.stringify(data)}`)
  return data.apiKey
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const { itemId } = await req.json().catch(() => ({}))

    const apiKey = await getPluggyApiKey()

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/fn-pluggy-webhook`

    const body: Record<string, any> = {
      clientUserId: user.id,
      webhookUrl,
      avoidDuplicates: true,
    }
    if (itemId) body.itemId = itemId

    const res = await fetch(`${PLUGGY_API}/connect_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!data.accessToken) throw new Error(`Connect token failed: ${JSON.stringify(data)}`)

    return new Response(
      JSON.stringify({ accessToken: data.accessToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('fn-pluggy-connect-token error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})
