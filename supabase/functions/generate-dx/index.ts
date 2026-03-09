import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT_DX = `Você é um assistente de radiologia especializado em ultrassonografia, atuando como ferramenta de apoio à discussão diagnóstica para médicos. Seu papel é analisar história clínica e achados ultrassonográficos fornecidos e sugerir hipóteses diagnósticas relevantes.

IMPORTANTE:
- Esta ferramenta é APENAS para apoio à discussão diagnóstica
- NÃO substitui o julgamento médico
- O médico é sempre o responsável final pelo diagnóstico e conduta
- Responda sempre em português do Brasil

Ao receber um caso, você deve retornar um JSON estruturado com:

1. "summary": Resumo conciso do caso (2-3 frases)

2. "hypotheses": Array de até 5 hipóteses diagnósticas principais, cada uma contendo:
   - "rank": Posição no ranking (1 a 5)
   - "diagnosis": Nome do diagnóstico
   - "justification": Justificativa baseada nos achados
   - "arguments_against": Argumentos contra essa hipótese
   - "confirmation_questions": Array de perguntas para confirmar/descartar
   
3. "red_flags": Array de sinais de alerta que requerem atenção imediata

4. "next_steps": Array de próximos passos sugeridos (exames, encaminhamentos)

5. "confidence": Nível de confiança na análise ("alta", "média", "baixa")

6. "disclaimer": Sempre incluir: "Esta análise é uma ferramenta de apoio e não substitui o julgamento clínico do médico responsável."

Responda APENAS com o JSON válido, sem texto adicional antes ou depois.`;

const SYSTEM_PROMPT_REVIEW = `Você é um revisor de laudos radiológicos especializado em ultrassonografia. Seu papel é revisar e aprimorar laudos médicos com base nas melhores práticas da literatura (ACR, RSNA Radiographics, Radiology Assistant, OpenEvidence, PubMed, NEJM, JAMA).

DIRETRIZES:
- Use APENAS terminologia técnica padronizada (ACR, BI-RADS, TI-RADS, O-RADS, LI-RADS, PI-RADS quando aplicável)
- Mantenha a estrutura do laudo original, aprimorando apenas a qualidade descritiva
- Adicione medidas de referência quando pertinente
- Corrija imprecisões terminológicas
- Sugira descrições mais completas quando houver achados subdescritos
- Não altere conclusões diagnósticas do médico — apenas sugira aprimoramentos descritivos
- NÃO invente achados que não estejam no texto original
- Responda sempre em português do Brasil

Retorne um JSON com:
1. "revised_report": O texto do laudo revisado e aprimorado
2. "changes_summary": Array de strings descrevendo cada alteração feita
3. "terminology_notes": Array de notas sobre terminologia padronizada aplicada
4. "references": Array de referências bibliográficas consultadas (formato curto: "Autor/Guideline, Ano")
5. "disclaimer": "Revisão assistida por IA. O médico é responsável pela validação final do laudo. Baseado em diretrizes ACR, RSNA e literatura indexada."

Responda APENAS com o JSON válido.`;

// ── Provider helpers ──

async function callOpenAI(apiKey: string, systemPrompt: string, userMessage: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    if (response.status === 401) throw new Error('Falha de autenticação com OpenAI. Verifique a API key.');
    throw new Error('Erro ao processar a análise via OpenAI.');
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

async function callClaude(apiKey: string, systemPrompt: string, userMessage: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', response.status, errorText);
    if (response.status === 401) throw new Error('Falha de autenticação com Claude. Verifique a API key.');
    throw new Error('Erro ao processar a análise via Claude.');
  }
  const data = await response.json();
  return data.content?.[0]?.text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { case_text, area, doctor_id, mode, model } = await req.json();

    if (!case_text || case_text.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Texto muito curto. Forneça mais detalhes.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isReview = mode === 'review';
    const systemPrompt = isReview ? SYSTEM_PROMPT_REVIEW : SYSTEM_PROMPT_DX;
    const useClaude = model === 'claude';

    const userMessage = isReview
      ? `Área: ${area || 'Não especificada'}\n\nTexto do laudo para revisão:\n${case_text}\n\nRevise e aprimore este laudo conforme as diretrizes.`
      : `Área de especialidade: ${area || 'Não especificada'}\n\nCaso clínico:\n${case_text}\n\nAnalise o caso e forneça as hipóteses diagnósticas estruturadas conforme o formato JSON especificado.`;

    console.log(`Processing ${isReview ? 'review' : 'dx'} via ${useClaude ? 'Claude' : 'GPT-4o-mini'} for doctor: ${doctor_id}, area: ${area}`);

    let content: string | undefined;

    if (useClaude) {
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      if (!ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada. Contate o administrador.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      content = await callClaude(ANTHROPIC_API_KEY, systemPrompt, userMessage);
    } else {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'OPENAI_API_KEY não configurada. Contate o administrador.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      content = await callOpenAI(OPENAI_API_KEY, systemPrompt, userMessage);
    }

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Resposta vazia da IA. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedResponse;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse response:', content);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar resposta da IA.', raw_content: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno. Tente novamente mais tarde.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
