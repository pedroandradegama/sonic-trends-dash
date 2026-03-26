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
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verificar se o email está autorizado e ainda não registrado
    const { data: doctorData, error: doctorError } = await supabase
      .from('authorized_doctors')
      .select('id, email, nome, is_active, registered_at')
      .eq('email', email.toLowerCase())
      .single();

    if (doctorError || !doctorData) {
      console.error('Email não encontrado:', email);
      return new Response(
        JSON.stringify({ error: 'Email não cadastrado pelo administrador' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!doctorData.is_active) {
      return new Response(
        JSON.stringify({ error: 'Acesso desativado. Contate o administrador.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (doctorData.registered_at) {
      return new Response(
        JSON.stringify({ error: 'Este email já possui uma conta.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tentar criar usuário no Auth
    let userId: string;
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
    });

    if (authError) {
      // Se o usuário já existe no Auth, buscar o ID e atualizar a senha
      if (authError.message?.includes('already been registered')) {
        console.log('Usuário já existe no Auth, atualizando senha...');
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!existingUser || listError) {
          return new Response(
            JSON.stringify({ error: 'Erro ao localizar usuário existente.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        userId = existingUser.id;
        // Atualizar senha
        await supabase.auth.admin.updateUserById(userId, { password });
      } else {
        console.error('Erro ao criar usuário:', authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      userId = userData.user.id;
    }

    // Criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userData.user.id,
        email: email.toLowerCase(),
        medico_nome: doctorData.nome,
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Tentar deletar o usuário criado se o perfil falhar
      await supabase.auth.admin.deleteUser(userData.user.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar perfil. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Adicionar role de médico
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'medico',
      });

    if (roleError) {
      console.error('Erro ao adicionar role:', roleError);
    }

    // Marcar como registrado
    const { error: updateError } = await supabase
      .from('authorized_doctors')
      .update({ registered_at: new Date().toISOString() })
      .eq('id', doctorData.id);

    if (updateError) {
      console.error('Erro ao atualizar registro:', updateError);
    }

    console.log('Médico registrado com sucesso:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta criada com sucesso! Você já pode fazer login.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
