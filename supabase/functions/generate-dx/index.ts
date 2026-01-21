import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é um assistente de radiologia especializado em ultrassonografia, atuando como ferramenta de apoio à discussão diagnóstica para médicos. Seu papel é analisar história clínica e achados ultrassonográficos fornecidos e sugerir hipóteses diagnósticas relevantes.

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key não configurada. Contate o administrador.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { case_text, area, doctor_id } = await req.json();

    if (!case_text || case_text.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Texto do caso muito curto. Forneça mais detalhes.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing case for doctor: ${doctor_id}, area: ${area}`);

    const userMessage = `Área de especialidade: ${area || 'Não especificada'}

Caso clínico:
${case_text}

Analise o caso e forneça as hipóteses diagnósticas estruturadas conforme o formato JSON especificado.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Falha de autenticação com OpenAI. Verifique a API key.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao processar a análise. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty response from OpenAI');
      return new Response(
        JSON.stringify({ error: 'Resposta vazia da IA. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar resposta da IA.',
          raw_content: content 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated diagnosis hypotheses');

    return new Response(
      JSON.stringify(parsedResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno. Tente novamente mais tarde.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
