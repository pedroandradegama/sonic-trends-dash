import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SLOT_DEPARTURE_HOUR: Record<string, number> = {
  slot1: 6,
  slot2: 12,
  slot3: 18,
  slot4: 0,
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

    const { service_id, slot_type } = await req.json()

    // Check cache (valid for 7 days)
    const { data: cached } = await supabase
      .from('fn_commute_cache')
      .select('*')
      .eq('user_id', user.id)
      .eq('service_id', service_id)
      .eq('slot_type', slot_type)
      .gte('fetched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()

    if (cached) {
      return new Response(
        JSON.stringify({ duration_min: cached.duration_min, distance_km: cached.distance_km, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabase
      .from('fn_doctor_profile')
      .select('home_lat, home_lng')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: service } = await supabase
      .from('fn_services')
      .select('lat, lng')
      .eq('id', service_id)
      .maybeSingle()

    if (!profile?.home_lat || !service?.lat) {
      return new Response(
        JSON.stringify({ error: 'Missing coordinates' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const now = new Date()
    const departureHour = SLOT_DEPARTURE_HOUR[slot_type] ?? 6
    const departure = new Date(now)
    departure.setHours(departureHour, 0, 0, 0)
    if (departure <= now) departure.setDate(departure.getDate() + 1)
    const departureTimestamp = Math.floor(departure.getTime() / 1000)

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')!
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('origins', `${profile.home_lat},${profile.home_lng}`)
    url.searchParams.set('destinations', `${service.lat},${service.lng}`)
    url.searchParams.set('departure_time', String(departureTimestamp))
    url.searchParams.set('traffic_model', 'best_guess')
    url.searchParams.set('language', 'pt-BR')
    url.searchParams.set('key', apiKey)

    const mapsRes = await fetch(url.toString())
    const mapsData = await mapsRes.json()

    const element = mapsData.rows?.[0]?.elements?.[0]
    if (element?.status !== 'OK') {
      return new Response(
        JSON.stringify({ error: 'Maps API error', detail: element?.status }),
        { status: 502, headers: corsHeaders }
      )
    }

    const durationMin = Math.round(
      (element.duration_in_traffic?.value ?? element.duration?.value ?? 0) / 60
    )
    const distanceKm = Math.round((element.distance?.value ?? 0) / 100) / 10

    await supabase.from('fn_commute_cache').upsert({
      user_id: user.id,
      service_id,
      slot_type,
      duration_min: durationMin,
      distance_km: distanceKm,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,service_id,slot_type' })

    return new Response(
      JSON.stringify({ duration_min: durationMin, distance_km: distanceKm, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
