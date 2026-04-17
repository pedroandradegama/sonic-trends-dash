// Geocode any address (free text, CEP-derived, preset) into lat/lng/place_id
// Used to backfill fn_services / fn_preset_clinics when coordinates are missing.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { address } = await req.json();
    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'address required (min 5 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=br&language=pt-BR&key=${apiKey}`;
    const r = await fetch(url);
    const data = await r.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return new Response(JSON.stringify({ error: 'not_found', status: data.status }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const top = data.results[0];
    return new Response(JSON.stringify({
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      place_id: top.place_id,
      formatted_address: top.formatted_address,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
