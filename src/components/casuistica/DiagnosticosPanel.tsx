import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, FileText, TrendingUp, Image, FileImage } from 'lucide-react';

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
  imagemUrl?: string;
  imagemFileId?: string;
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
              <li>Vincular imagens correspondentes de cada paciente</li>
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

      {/* Relatório com Diagnósticos e Imagens */}
      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              Relatório de Diagnósticos
            </CardTitle>
            <CardDescription>
              {results.length} laudos processados • {results.filter(r => r.imagemUrl).length} com imagem vinculada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {results.map((r, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Imagem do paciente */}
                    <div className="lg:w-1/3 p-4 bg-muted/30 flex items-center justify-center min-h-[200px]">
                      {r.imagemUrl ? (
                        <a 
                          href={r.imagemUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full"
                        >
                          <img
                            src={r.imagemUrl}
                            alt={`Imagem de ${r.pacienteOriginal}`}
                            className="w-full h-auto max-h-[300px] object-contain rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden flex-col items-center justify-center text-muted-foreground p-4">
                            <Image className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-sm">Imagem indisponível</span>
                          </div>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-4">
                          <Image className="w-12 h-12 mb-2 opacity-30" />
                          <span className="text-sm">Sem imagem vinculada</span>
                        </div>
                      )}
                    </div>

                    {/* Informações do diagnóstico */}
                    <div className="lg:w-2/3 p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{r.pacienteOriginal}</h3>
                          <p className="text-xs text-muted-foreground">{r.arquivo}</p>
                        </div>
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
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Diagnóstico
                        </label>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          {r.diagnosticoOriginal}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm pt-2 border-t">
                        <div>
                          <span className="text-muted-foreground">Médico: </span>
                          <span className="font-medium">{r.medicoExecutante}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Data: </span>
                          <span className="font-medium">
                            {r.dataModificacao ? new Date(r.dataModificacao).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
