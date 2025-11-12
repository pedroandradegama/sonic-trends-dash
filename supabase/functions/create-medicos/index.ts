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
      { nome: 'MARIAH AUGUSTA DIAS VIANA', email: 'mariahadiasv@gmail.com' },
      { nome: 'PEDRO ANDRADE GAMA DE OLIVEIRA', email: 'pedro.andrade@imagdiagnostico.com.br' },
      { nome: 'FILIPE DE AZEVEDO CABRAL BELEM RODRIGUES', email: 'filipe_belem@hotmail.com' },
      { nome: 'BELISA BARRETO GOMES DA SILVA', email: 'belisa_barreto@hotmail.com' },
      { nome: 'BEATRIZ ALMEIDA BARP SANTOS', email: 'barpbeatriz@gmail.com' },
      { nome: 'PRISCILLA CARDOSO LAMEIRA ANDRADE', email: 'cardoso.priscilla@hotmail.com' },
      { nome: 'AMANDA SOUZA AVILA PESSOA', email: 'amandaavilapessoa@gmail.com' },
      { nome: 'AFONSO ALVES DA SILVA NETO', email: 'afonsoneto741@gmail.com' },
      { nome: 'THAIS MARTINS NAZARETH MACHADO', email: 'thaismachado.saude@gmail.com' },
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
