import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { question } = await req.json()
    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'Pergunta obrigatória' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Fetch doctor profile
    const { data: doctorProfile } = await supabase
      .from('fn_doctor_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: services } = await supabase
      .from('fn_services')
      .select('name, regime, fiscal_mode, fiscal_pct_total, fixed_monthly_value, is_taxed, tax_pct, distribution_frequency')
      .eq('user_id', user.id)

    const { data: snapshots } = await supabase
      .from('fn_kpi_snapshots')
      .select('total_gross, total_net, effective_rate')
      .eq('user_id', user.id)
      .order('snapshot_month', { ascending: false })
      .limit(3)

    const avgGross = snapshots?.length
      ? Math.round(snapshots.reduce((a: number, s: any) => a + s.total_gross, 0) / snapshots.length)
      : 0
    const avgNet = snapshots?.length
      ? Math.round(snapshots.reduce((a: number, s: any) => a + s.total_net, 0) / snapshots.length)
      : 0

    // 2. Knowledge base
    const now = new Date()
    const { data: knowledgeDocs } = await supabase
      .from('fn_knowledge_base')
      .select('category, title, content')
      .eq('is_active', true)
      .or(`valid_until.is.null,valid_until.gte.${now.toISOString().split('T')[0]}`)
      .order('category')

    const knowledgeText = (knowledgeDocs ?? [])
      .map((d: any) => `### ${d.title}\n${d.content}`)
      .join('\n\n---\n\n')

    // 3. Doctor context
    const regimeLabels: Record<string, string> = {
      pj_turno: 'PJ por turno',
      pj_producao: 'PJ por produção',
      clt: 'CLT',
      residencia: 'Residência médica',
      fellowship: 'Fellowship',
      pro_labore: 'Pró-labore',
      distribuicao_lucros: 'Distribuição de lucros',
    }

    const fiscalLabels: Record<string, string> = {
      A: 'Simples Nacional / alíquota única',
      B: '% base + despesas fixas',
      C: 'Lucro Presumido itemizado',
    }

    const serviceSummary = (services ?? []).map((s: any) => {
      let desc = `${s.name} (${regimeLabels[s.regime] ?? s.regime}`
      if (s.fiscal_mode) desc += `, ${fiscalLabels[s.fiscal_mode] ?? s.fiscal_mode}`
      if (s.fiscal_pct_total) desc += `, carga fiscal ${s.fiscal_pct_total}%`
      if (s.fixed_monthly_value) desc += `, valor fixo R$ ${s.fixed_monthly_value}/mês`
      if (s.is_taxed && s.tax_pct) desc += `, tributado ${s.tax_pct}%`
      if (s.distribution_frequency) desc += `, frequência: ${s.distribution_frequency}`
      return desc + ')'
    }).join('\n  ')

    const profileSummary = doctorProfile ? `
Regime de trabalho principal: ${regimeLabels[doctorProfile.primary_regime ?? ''] ?? doctorProfile.primary_regime ?? 'não informado'}
Renda bruta média (últimos 3 meses): R$ ${avgGross.toLocaleString('pt-BR')}
Renda líquida média (últimos 3 meses): R$ ${avgNet.toLocaleString('pt-BR')}
Meta líquida mensal: R$ ${(doctorProfile.monthly_net_goal ?? 0).toLocaleString('pt-BR')}
Provisão 13º salário: ${doctorProfile.include_13th ? 'sim' : 'não'}
Provisão férias: ${doctorProfile.include_vacation ? 'sim' : 'não'}
` : 'Perfil financeiro não configurado ainda.'

    // 4. Model selection
    const complexKeywords = ['holding', 'reforma tributária', 'planejamento', 'estrutura', 'otimizar', 'comparar']
    const isComplex = complexKeywords.some(k => question.toLowerCase().includes(k))
    const model = isComplex ? 'gpt-4o' : 'gpt-4o-mini'

    // 5. Call OpenAI
    const systemPrompt = `Você é um especialista em planejamento financeiro e tributário para médicos brasileiros, com foco em profissionais que atuam como pessoa jurídica (PJ), autônomos ou com múltiplos vínculos.

Seu papel é responder perguntas financeiras e tributárias de forma técnica, direta e personalizada para o médico com o perfil abaixo. Use a base de conhecimento fornecida para dar respostas precisas e atualizadas.

PERFIL DO MÉDICO:
${profileSummary}

SERVIÇOS/FONTES DE RECEITA CADASTRADOS:
  ${serviceSummary || 'Nenhum serviço cadastrado ainda.'}

REGRAS PARA SUAS RESPOSTAS:
1. Seja direto e técnico — o médico é inteligente, não precisa de rodeios
2. Use os dados reais do perfil para personalizar a resposta
3. Quando relevante, cite valores específicos baseados na renda dele
4. Se a base de conhecimento tiver a informação, use ela — não invente alíquotas ou regras
5. Ao final de TODA resposta, adicione exatamente esta linha:
   "⚠️ Esta análise é educativa. Para decisões definitivas, consulte seu contador."
6. Formato: use markdown simples (negrito, listas). Máximo 400 palavras.
7. Se não souber a resposta com certeza, diga que não sabe e sugira consultar um contador.

BASE DE CONHECIMENTO TÉCNICA (2025):
${knowledgeText}`

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
      }),
    })

    const gptData = await gptResponse.json()
    const answer = gptData.choices?.[0]?.message?.content ?? 'Não foi possível gerar uma resposta.'
    const tokensUsed = gptData.usage?.total_tokens ?? 0

    // 6. Save to history
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    await supabaseAdmin.from('fn_faq_history').insert({
      user_id: user.id,
      question,
      answer,
      model_used: model,
      tokens_used: tokensUsed,
    })

    return new Response(
      JSON.stringify({ answer, model_used: model }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('fn-financial-faq error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
