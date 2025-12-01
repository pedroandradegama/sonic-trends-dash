import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, FileText, TrendingUp } from 'lucide-react';

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

export function DiagnosticosPanel() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<DiagnosticoDetalhado[] | null>(null);
  const [summary, setSummary] = useState<Record<string, MedicoSummary> | null>(null);

  const handleProcess = async () => {
    setIsProcessing(true);
    setResults(null);
    setSummary(null);

    try {
      // Buscar o perfil do usuário logado para filtrar por médico
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('medico_nome')
        .eq('user_id', user.id)
        .single();

      if (!profile?.medico_nome) {
        throw new Error('Perfil do médico não encontrado');
      }

      const { data, error } = await supabase.functions.invoke('process-diagnosticos', {
        body: { medicoNome: profile.medico_nome }
      });

      if (error) throw error;

      if (data?.success) {
        setResults(data.results);
        setSummary(data.summary);
        toast({
          title: 'Processamento concluído',
          description: `${data.processedCount} laudos processados com sucesso`,
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao processar diagnósticos:', error);
      toast({
        title: 'Erro no processamento',
        description: error.message || 'Não foi possível processar os diagnósticos',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de controle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Diagnósticos Histopatológicos
          </CardTitle>
          <CardDescription>
            Extração de diagnósticos de punções e biópsias do Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este processo irá:
            </p>
            <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
              <li>Ler PDFs da pasta do Google Drive configurada</li>
              <li>Extrair nome do paciente e diagnóstico</li>
              <li>Fazer match com o médico executante</li>
              <li>Gravar resultados no Google Sheets</li>
            </ul>
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Processar Diagnósticos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sumário por médico */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sumário por Médico Executante
            </CardTitle>
            <CardDescription>
              Distribuição de laudos por médico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary).map(([medico, stats]) => {
                const topDiags = Object.entries(stats.topDiagnosticos)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3);

                return (
                  <div
                    key={medico}
                    className="border rounded-lg p-4 space-y-2 bg-card"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{medico}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-medical-blue">
                          {stats.qtdLaudos}
                        </div>
                        <div className="text-xs text-muted-foreground">laudos</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Top diagnósticos:</div>
                      {topDiags.map(([diag, count]) => (
                        <div key={diag} className="text-sm text-muted-foreground flex justify-between">
                          <span className="truncate max-w-[70%]">{diag}</span>
                          <span className="font-medium">({count})</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Sem alterações: </span>
                        <span className="font-medium text-medical-success">
                          {stats.percentualSemAlteracoes.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela detalhada */}
      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento dos Laudos</CardTitle>
            <CardDescription>
              {results.length} laudos processados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Paciente</th>
                    <th className="text-left p-2">Diagnóstico</th>
                    <th className="text-left p-2">Médico</th>
                    <th className="text-left p-2">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="font-medium">{r.pacienteOriginal}</div>
                        <div className="text-xs text-muted-foreground">{r.arquivo}</div>
                      </td>
                      <td className="p-2 max-w-xs">
                        <div className="truncate" title={r.diagnosticoOriginal}>
                          {r.diagnosticoOriginal}
                        </div>
                      </td>
                      <td className="p-2">{r.medicoExecutante}</td>
                      <td className="p-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            r.matchTipo === 'exato'
                              ? 'bg-medical-success/20 text-medical-success'
                              : r.matchTipo === 'fuzzy'
                              ? 'bg-yellow-500/20 text-yellow-600'
                              : 'bg-destructive/20 text-destructive'
                          }`}
                        >
                          {r.matchTipo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
