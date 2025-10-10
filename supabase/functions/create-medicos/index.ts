import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const medicos = [
      { nome: 'MARIAH AUGUSTA DIAS VIANA', email: 'mariah@teste.com' },
      { nome: 'PEDRO ANDRADE GAMA DE OLIVEIRA', email: 'pedro@teste.com' },
      { nome: 'FILIPE DE AZEVEDO CABRAL BELEM RODRIGUES', email: 'filipe@teste.com' },
      { nome: 'BELISA BARRETO GOMES DA SILVA', email: 'belisa@teste.com' },
      { nome: 'BEATRIZ ALMEIDA BARP SANTOS', email: 'beatriz@teste.com' },
      { nome: 'PRISCILLA CARDOSO LAMEIRA ANDRADE', email: 'priscilla@teste.com' },
    ];

    const results = [];

    for (const medico of medicos) {
      // Criar usuário no Auth
      const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: medico.email,
        password: '123456',
        email_confirm: true,
      });

      if (authError) {
        console.error(`Erro ao criar usuário ${medico.email}:`, authError);
        results.push({ medico: medico.nome, success: false, error: authError.message });
        continue;
      }

      // Criar perfil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userData.user.id,
          email: medico.email,
          medico_nome: medico.nome,
        });

      if (profileError) {
        console.error(`Erro ao criar perfil ${medico.email}:`, profileError);
        results.push({ medico: medico.nome, success: false, error: profileError.message });
      } else {
        results.push({ medico: medico.nome, success: true });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
