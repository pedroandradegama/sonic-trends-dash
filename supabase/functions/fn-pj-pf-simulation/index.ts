import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { annual_gross, service_count, primary_regime } = await req.json()

    function calcSimplesNacional(annualRevenue: number): number {
      if (annualRevenue <= 180000) return annualRevenue * 0.06
      if (annualRevenue <= 360000) return annualRevenue * 0.112 - 9360
      if (annualRevenue <= 720000) return annualRevenue * 0.135 - 17640
      if (annualRevenue <= 1800000) return annualRevenue * 0.16 - 35640
      if (annualRevenue <= 3600000) return annualRevenue * 0.21 - 125640
      if (annualRevenue <= 4800000) return annualRevenue * 0.33 - 648000
      return annualRevenue * 0.33 - 648000
    }

    function calcLucroPresumido(annualRevenue: number): number {
      const baseIRPJ = annualRevenue * 0.32
      const irpj = baseIRPJ * 0.15
      const adicional = Math.max(0, baseIRPJ - 240000) * 0.1
      const csll = annualRevenue * 0.32 * 0.09
      const iss = annualRevenue * 0.05
      const pisCofins = annualRevenue * (0.0065 + 0.03)
      return irpj + adicional + csll + iss + pisCofins
    }

    function calcPF(annualGross: number): number {
      const monthly = annualGross / 12
      const inssMonthly = Math.min(monthly * 0.14, 908.86)
      const baseIR = monthly - inssMonthly
      let irMonthly = 0
      if (baseIR <= 2259.20) irMonthly = 0
      else if (baseIR <= 2826.65) irMonthly = baseIR * 0.075 - 169.44
      else if (baseIR <= 3751.05) irMonthly = baseIR * 0.15 - 381.44
      else if (baseIR <= 4664.68) irMonthly = baseIR * 0.225 - 662.77
      else irMonthly = baseIR * 0.275 - 896.00
      return (inssMonthly + Math.max(0, irMonthly)) * 12
    }

    const simplesTotal = calcSimplesNacional(annual_gross)
    const lpTotal = calcLucroPresumido(annual_gross)
    const pfTotal = calcPF(annual_gross)

    const simplesRate = (simplesTotal / annual_gross) * 100
    const lpRate = (lpTotal / annual_gross) * 100
    const pfRate = (pfTotal / annual_gross) * 100

    const simplesEligible = annual_gross <= 4800000

    const prompt = `Você é um consultor tributário especialista em médicos PJ brasileiros.
Com base nesses dados, dê uma análise concisa (máx. 4 parágrafos) sobre o melhor regime:

- Faturamento anual bruto: R$ ${annual_gross.toLocaleString('pt-BR')}
- Número de fontes pagadoras (serviços): ${service_count}
- Regime atual principal: ${primary_regime}
- Simples Nacional elegível: ${simplesEligible ? 'Sim' : 'Não (acima do teto)'}
- Alíquota efetiva estimada Simples: ${simplesRate.toFixed(1)}%
- Alíquota efetiva estimada Lucro Presumido: ${lpRate.toFixed(1)}%
- Alíquota efetiva estimada PF (carnê-leão): ${pfRate.toFixed(1)}%

Conclua com uma recomendação clara. Mencione que esta análise é educativa e não substitui assessoria contábil.
Escreva em português brasileiro, tom profissional mas direto.`

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const gptData = await gptRes.json()
    const suggestion = gptData.choices?.[0]?.message?.content ?? ''

    return new Response(
      JSON.stringify({
        annual_gross,
        simples: { total: Math.round(simplesTotal), rate: simplesRate, eligible: simplesEligible },
        lucro_presumido: { total: Math.round(lpTotal), rate: lpRate },
        pf: { total: Math.round(pfTotal), rate: pfRate },
        suggestion,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})
