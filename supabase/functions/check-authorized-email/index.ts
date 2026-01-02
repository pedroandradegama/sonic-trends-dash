import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o email está autorizado
    const { data, error } = await supabase
      .from('authorized_doctors')
      .select('id, email, nome, is_active, registered_at')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ authorized: false, message: 'Email não cadastrado pelo administrador' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.is_active) {
      return new Response(
        JSON.stringify({ authorized: false, message: 'Acesso desativado. Contate o administrador.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.registered_at) {
      return new Response(
        JSON.stringify({ authorized: false, message: 'Este email já possui uma conta. Use "Já tenho conta" para entrar.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        authorized: true, 
        nome: data.nome,
        message: 'Email autorizado. Você pode criar sua senha.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
