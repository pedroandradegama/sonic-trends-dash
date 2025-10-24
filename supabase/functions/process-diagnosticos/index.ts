import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessResult {
  success: boolean;
  processedCount: number;
  results?: DiagnosticoDetalhado[];
  summary?: Record<string, MedicoSummary>;
  error?: string;
}

interface DiagnosticoDetalhado {
  arquivo: string;
  fileId: string;
  dataModificacao: string;
  pacienteOriginal: string;
  pacienteNormalizado: string;
  diagnosticoOriginal: string;
  diagnosticoNormalizado: string;
  medicoExecutante: string;
  matchTipo: 'exato' | 'fuzzy' | 'nao_encontrado';
  status: string;
}

interface MedicoSummary {
  qtdLaudos: number;
  topDiagnosticos: Record<string, number>;
  percentualSemAlteracoes: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada');
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
      
      // Validar campos obrigatórios
      if (!credentials.client_email || !credentials.private_key) {
        throw new Error('Service account JSON inválido: faltam campos obrigatórios (client_email, private_key)');
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse do GOOGLE_SERVICE_ACCOUNT_KEY:', parseError);
      throw new Error(
        'GOOGLE_SERVICE_ACCOUNT_KEY deve ser um JSON válido do Google Service Account. ' +
        'Baixe o arquivo JSON completo do Google Cloud Console e cole todo o conteúdo.'
      );
    }
    
    // Configurações
    const DRIVE_FOLDER_ID = "1b-RPK9Vc3fyv8Oa3yBceqaXhRLDJS4y1";
    const SHEETS_SPREADSHEET_ID = "1ALRU24yTcS3QxOPNiMKPOdx8gNzExR6n";
    const SHEETS_TAB_MAPEAMENTO = "teste";
    const SHEETS_TAB_SAIDA = "Diagnósticos por Médico";
    const LIMIAR_FUZZY = 0.92;

    // Obter token de acesso
    const accessToken = await getAccessToken(credentials);

    // 1. Listar PDFs da pasta do Drive
    console.log('Listando PDFs do Drive...');
    const files = await listDriveFiles(DRIVE_FOLDER_ID, accessToken);
    console.log(`Encontrados ${files.length} arquivos`);

    // 2. Obter mapeamento do Sheets
    console.log('Obtendo mapeamento do Sheets...');
    const mapeamento = await getMapeamentoFromSheets(
      SHEETS_SPREADSHEET_ID,
      SHEETS_TAB_MAPEAMENTO,
      accessToken
    );
    console.log(`Carregados ${mapeamento.size} mapeamentos`);

    // 3. Processar cada PDF
    const resultados: DiagnosticoDetalhado[] = [];
    
    for (const file of files.slice(0, 10)) { // Limitar a 10 primeiros para teste
      try {
        console.log(`Processando: ${file.name}`);
        
        // Baixar e extrair texto do PDF
        const pdfText = await extractTextFromPDF(file.id, accessToken);
        
        // Extrair nome do paciente
        const paciente = extractPaciente(pdfText);
        if (!paciente) {
          console.log(`Paciente não encontrado em ${file.name}`);
          continue;
        }

        // Extrair diagnóstico
        const diagnostico = extractDiagnostico(pdfText);
        if (!diagnostico) {
          console.log(`Diagnóstico não encontrado em ${file.name}`);
          continue;
        }

        // Fazer match com médico executante
        const pacienteNorm = normalizarTexto(paciente);
        const { medico, tipo } = findMedicoExecutante(pacienteNorm, mapeamento, LIMIAR_FUZZY);

        resultados.push({
          arquivo: file.name,
          fileId: file.id,
          dataModificacao: file.modifiedTime,
          pacienteOriginal: paciente,
          pacienteNormalizado: pacienteNorm,
          diagnosticoOriginal: diagnostico,
          diagnosticoNormalizado: normalizarTexto(diagnostico),
          medicoExecutante: medico,
          matchTipo: tipo,
          status: medico ? 'processado' : 'pendente'
        });
      } catch (err) {
        console.error(`Erro ao processar ${file.name}:`, err);
      }
    }

    // 4. Gerar sumário por médico
    const summary = generateSummary(resultados);

    // 5. Gravar no Sheets
    await writeToSheets(
      SHEETS_SPREADSHEET_ID,
      SHEETS_TAB_SAIDA,
      resultados,
      summary,
      accessToken
    );

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: resultados.length,
        results: resultados,
        summary
      } as ProcessResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        processedCount: 0,
        error: error.message
      } as ProcessResult),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getAccessToken(credentials: any): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  
  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  
  const jwtClaimSetEncoded = btoa(JSON.stringify(jwtClaimSet));
  
  // Para simplificar, vamos usar a biblioteca de crypto do Deno
  const privateKey = credentials.private_key;
  
  // Importar a chave privada
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
  
  const dataToSign = `${jwtHeader}.${jwtClaimSetEncoded}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(dataToSign)
  );
  
  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const jwt = `${dataToSign}.${signatureEncoded}`;
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function listDriveFiles(folderId: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/pdf'&fields=files(id,name,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  const data = await response.json();
  return data.files || [];
}

async function extractTextFromPDF(fileId: string, accessToken: string): Promise<string> {
  // Exportar PDF como texto usando Google Drive API
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  return await response.text();
}

async function getMapeamentoFromSheets(
  spreadsheetId: string,
  tabName: string,
  accessToken: string
): Promise<Map<string, string>> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A:B`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  const data = await response.json();
  const mapeamento = new Map<string, string>();
  
  if (data.values && data.values.length > 1) {
    // Pular header (primeira linha)
    for (let i = 1; i < data.values.length; i++) {
      const [paciente, medico] = data.values[i];
      if (paciente && medico) {
        mapeamento.set(normalizarTexto(paciente), medico);
      }
    }
  }
  
  return mapeamento;
}

function extractPaciente(text: string): string | null {
  const patterns = [
    /(?:^|\n)Dr(?:\.|a)?\s*.*\n([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ ]{5,80})\n(?:IMAG|.*Procedência)/ms,
    /(?:^|\n)Sr\.\(a\)\s*:\s*\n?([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ ]{5,80})\n/ms
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractDiagnostico(text: string): string | null {
  // Tentar citologia primeiro
  let pattern = /CONCLUS[ÃA]O\s*:\s*(.+?)(?:\n{2,}|\n\s*[A-ZÁÉÍÓÚÇ\/ ]{4,}\s*:|$)/ms;
  let match = text.match(pattern);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Tentar histopatologia
  pattern = /MICROSCOPIA\/CONCLUS[ÃA]O DIAGN[ÓO]STICA\s*\n(.+?)(?:\n{2,}|$)/ms;
  match = text.match(pattern);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return null;
}

function normalizarTexto(texto: string): string {
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similaridade(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function findMedicoExecutante(
  pacienteNorm: string,
  mapeamento: Map<string, string>,
  limiarFuzzy: number
): { medico: string; tipo: 'exato' | 'fuzzy' | 'nao_encontrado' } {
  // Tentar match exato
  if (mapeamento.has(pacienteNorm)) {
    return {
      medico: mapeamento.get(pacienteNorm)!,
      tipo: 'exato'
    };
  }
  
  // Tentar match fuzzy
  let bestMatch = '';
  let bestScore = 0;
  
  for (const [pacienteMap, medico] of mapeamento.entries()) {
    const score = similaridade(pacienteNorm, pacienteMap);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = medico;
    }
  }
  
  if (bestScore >= limiarFuzzy) {
    return { medico: bestMatch, tipo: 'fuzzy' };
  }
  
  return { medico: 'Não encontrado', tipo: 'nao_encontrado' };
}

function generateSummary(resultados: DiagnosticoDetalhado[]): Record<string, MedicoSummary> {
  const summary: Record<string, MedicoSummary> = {};
  
  for (const resultado of resultados) {
    const medico = resultado.medicoExecutante;
    
    if (!summary[medico]) {
      summary[medico] = {
        qtdLaudos: 0,
        topDiagnosticos: {},
        percentualSemAlteracoes: 0
      };
    }
    
    summary[medico].qtdLaudos++;
    
    const diag = resultado.diagnosticoNormalizado;
    summary[medico].topDiagnosticos[diag] = (summary[medico].topDiagnosticos[diag] || 0) + 1;
    
    if (diag.includes('SEM ALTERAC') || diag.includes('NEGATIV')) {
      summary[medico].percentualSemAlteracoes++;
    }
  }
  
  // Calcular percentuais
  for (const medico in summary) {
    const total = summary[medico].qtdLaudos;
    summary[medico].percentualSemAlteracoes = 
      (summary[medico].percentualSemAlteracoes / total) * 100;
  }
  
  return summary;
}

async function writeToSheets(
  spreadsheetId: string,
  tabName: string,
  resultados: DiagnosticoDetalhado[],
  summary: Record<string, MedicoSummary>,
  accessToken: string
) {
  // Preparar dados detalhados
  const detalhado = [
    ['Arquivo', 'File_ID', 'Data_Modificacao', 'Paciente_Original', 'Paciente_Normalizado',
     'Diagnostico_Original', 'Diagnostico_Normalizado', 'Médico_Executante', 'Match_Tipo', 'Status']
  ];
  
  for (const r of resultados) {
    detalhado.push([
      r.arquivo,
      r.fileId,
      r.dataModificacao,
      r.pacienteOriginal,
      r.pacienteNormalizado,
      r.diagnosticoOriginal,
      r.diagnosticoNormalizado,
      r.medicoExecutante,
      r.matchTipo,
      r.status
    ]);
  }
  
  // Preparar sumário
  const sumarioData = [
    ['', ''],
    ['=== SUMÁRIO POR MÉDICO ===', ''],
    ['Médico_Executante', 'Qtd_Laudos', 'Top_Diagnosticos', '% Sem alterações']
  ];
  
  for (const [medico, stats] of Object.entries(summary)) {
    const topDiag = Object.entries(stats.topDiagnosticos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([diag, count]) => `${diag} (${count})`)
      .join('; ');
    
    sumarioData.push([
      medico,
      stats.qtdLaudos.toString(),
      topDiag,
      stats.percentualSemAlteracoes.toFixed(1) + '%'
    ]);
  }
  
  // Combinar tudo
  const allData = [...detalhado, ...sumarioData];
  
  // Escrever no Sheets
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A1:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: allData
      })
    }
  );
}
