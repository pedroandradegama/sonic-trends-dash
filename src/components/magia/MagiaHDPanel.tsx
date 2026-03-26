import { useState, useCallback } from 'react';
import { AlertTriangle, Brain, Copy, CheckCircle, Loader2, TestTube, Sparkles, History, ShieldCheck, Users, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useMagiaHistory, DiagnosisResult, MagiaHistoryItem } from '@/hooks/useMagiaHistory';
import { useMagiaUsage, ConsultMode } from '@/hooks/useMagiaUsage';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { InputModeSelector, InputMode } from './InputModeSelector';
import { AudioInputPanel } from './AudioInputPanel';
import { TextInputPanel } from './TextInputPanel';
import { StructuredInputPanel } from './StructuredInputPanel';

const TEST_CASE = 'Mulher 34 anos, dor pélvica crônica há 6 meses. US TV: cisto simples de 3,2 cm em ovário direito, parede fina, sem septos/vegetações, Doppler sem hipervascularização.';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export default function MagiaHDPanel() {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { toast } = useToast();
  const { history, addToHistory } = useMagiaHistory();
  const usage = useMagiaUsage();

  const [confirmedAnonymized, setConfirmedAnonymized] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [caseText, setCaseText] = useState('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [consultMode, setConsultMode] = useState<ConsultMode>('individual');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleStructuredChange = useCallback((text: string) => {
    setCaseText(text);
  }, []);

  const handleGenerate = async (testMode = false) => {
    const textToSend = testMode ? TEST_CASE : caseText;
    if (!testMode) {
      if (!confirmedAnonymized) { setErrorMessage('Marque a confirmação de anonimização antes de enviar.'); setRequestStatus('error'); return; }
      if (textToSend.length < 20) { setErrorMessage('Descreva o caso com mais detalhes (mínimo 20 caracteres).'); setRequestStatus('error'); return; }
      if (!usage.canUse(consultMode)) {
        setErrorMessage(`Você atingiu o limite mensal de consultas ${consultMode === 'board' ? 'Board' : 'Individual'}.`);
        setRequestStatus('error');
        return;
      }
    }
    setRequestStatus('loading'); setErrorMessage(''); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dx', {
        body: {
          case_text: textToSend,
          area: 'outro',
          doctor_id: user?.id,
          mode: 'dx',
          consult_mode: testMode ? 'individual' : consultMode,
        }
      });
      if (error) {
        if (error.message?.includes('401') || error.message?.includes('403')) setErrorMessage('Falha de autenticação (401). Verifique se a Edge Function está ativa.');
        else if (error.message?.includes('500') || error.message?.includes('502')) setErrorMessage('Falha no backend/IA. Verifique Logs do Supabase Edge Function.');
        else setErrorMessage(error.message || 'Não foi possível gerar a análise.');
        setRequestStatus('error'); return;
      }
      if (data?.error) { setErrorMessage(data.error); setRequestStatus('error'); return; }
      setResult(data as DiagnosisResult); setRequestStatus('success');
      if (!testMode) {
        addToHistory(textToSend, 'outro', data as DiagnosisResult);
        await logToolUsage('magia_hd', { consult_mode: consultMode });
        usage.refetch();
      }
      toast({ title: 'Análise gerada com sucesso', description: consultMode === 'board' ? 'Consenso entre os 3 modelos gerado.' : 'Hipóteses diagnósticas geradas.' });
    } catch { setErrorMessage('Não foi possível gerar a análise. Tente novamente.'); setRequestStatus('error'); }
  };

  const handleCopyResult = () => {
    if (!result) return;
    const text = `RESUMO: ${result.summary}\n\nHIPÓTESES:\n${result.hypotheses.map(h => `${h.rank}. ${h.diagnosis}\n   ${h.justification}`).join('\n')}\n\nRED FLAGS:\n${result.red_flags.map(r => `• ${r}`).join('\n')}\n\nPRÓXIMOS PASSOS:\n${result.next_steps.map(s => `• ${s}`).join('\n')}\n\nConfiança: ${result.confidence}\n\n${result.disclaimer}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Resultado copiado para a área de transferência.' });
  };

  const loadFromHistory = (item: MagiaHistoryItem) => {
    setCaseText(item.case_text); setResult(item.result);
    setRequestStatus(item.result ? 'success' : 'idle'); setShowHistory(false); setInputMode('text');
  };

  const isGenerateDisabled = !confirmedAnonymized || caseText.length < 20 || requestStatus === 'loading';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">Discussão de HD</h2>
            <p className="text-sm text-muted-foreground">Hipóteses diagnósticas assistidas por IA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Histórico</span> ({history.length})
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => handleGenerate(true)} disabled={requestStatus === 'loading'}>
              <TestTube className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Testar IA</span>
            </Button>
          )}
        </div>
      </div>

      {/* History */}
      {showHistory && history.length > 0 && (
        <Card className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <CardHeader className="pb-2"><CardTitle className="text-base">Histórico de Análises</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
              {history.map((item) => (
                <div key={item.id} className="p-3 border rounded-xl hover:bg-accent/50 cursor-pointer transition-all duration-200" onClick={() => loadFromHistory(item)}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm line-clamp-2">{item.case_text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Card */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6 space-y-5">
          {/* Anonymization */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <Checkbox id="confirm" checked={confirmedAnonymized} onCheckedChange={(checked) => setConfirmedAnonymized(checked === true)} />
            <Label htmlFor="confirm" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Confirmo que removi identificadores do paciente.
            </Label>
          </div>

          {/* Consult Mode: Individual vs Board */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Consulta</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Individual */}
              <button
                onClick={() => setConsultMode('individual')}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  consultMode === 'individual'
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Opinião Individual</p>
                </div>
                <p className="text-xs text-muted-foreground">Análise rápida por 1 modelo de IA</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge
                    variant={usage.remaining('individual') > 5 ? 'secondary' : 'destructive'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {usage.remaining('individual')}/{usage.limits.individual} restantes
                  </Badge>
                </div>
              </button>

              {/* Board — petrol blue style */}
              <button
                onClick={() => setConsultMode('board')}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden",
                  consultMode === 'board'
                    ? "border-[hsl(195,50%,25%)] bg-[hsl(195,50%,16%)] text-white shadow-md"
                    : "border-border hover:border-primary/40"
                )}
              >
                {/* Decorative gradient orbs when selected */}
                {consultMode === 'board' && (
                  <>
                    <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[radial-gradient(circle,hsl(193,44%,42%,0.3)_0%,transparent_70%)] pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[radial-gradient(circle,hsl(195,47%,34%,0.25)_0%,transparent_70%)] pointer-events-none" />
                  </>
                )}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className={cn("h-4 w-4", consultMode === 'board' ? "text-[hsl(190,60%,70%)]" : "text-primary")} />
                    <p className="text-sm font-semibold">Opinião Board</p>
                  </div>
                  <p className={cn("text-xs", consultMode === 'board' ? "text-white/60" : "text-muted-foreground")}>Consenso entre 3 modelos de IA</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge
                      variant={usage.remaining('board') > 3 ? 'secondary' : 'destructive'}
                      className={cn("text-[10px] px-1.5 py-0", consultMode === 'board' && "bg-white/15 text-white border-white/20")}
                    >
                      {usage.remaining('board')}/{usage.limits.board} restantes
                    </Badge>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Input Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Método de entrada</Label>
            <InputModeSelector mode={inputMode} onModeChange={setInputMode} />
          </div>

          {/* Input Panel */}
          <div className="border rounded-xl p-4 bg-muted/20">
            {inputMode === 'audio' && <AudioInputPanel value={caseText} onChange={setCaseText} />}
            {inputMode === 'text' && <TextInputPanel value={caseText} onChange={setCaseText} />}
            {inputMode === 'structured' && <StructuredInputPanel area="outro" onChange={handleStructuredChange} />}
          </div>

          {inputMode === 'structured' && caseText && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Texto gerado (prévia):</Label>
              <div className="p-3 bg-muted/30 rounded-xl text-sm font-body">{caseText}</div>
              <p className="text-xs text-muted-foreground">Caracteres: {caseText.length} {caseText.length < 20 && '(mínimo 20)'}</p>
            </div>
          )}

          {/* Generate */}
          <div className="space-y-2">
            <Button onClick={() => handleGenerate(false)} disabled={isGenerateDisabled || !usage.canUse(consultMode)} className="w-full rounded-xl" size="lg">
              {requestStatus === 'loading' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{consultMode === 'board' ? 'Consultando 3 modelos...' : 'Gerando hipóteses...'}</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />{consultMode === 'board' ? 'Gerar consenso Board' : 'Gerar hipóteses diagnósticas'}</>
              )}
            </Button>
            {!usage.canUse(consultMode) && (
              <p className="text-xs text-destructive text-center font-medium">
                Limite mensal de consultas {consultMode === 'board' ? 'Board' : 'Individual'} atingido.
              </p>
            )}
            {isGenerateDisabled && usage.canUse(consultMode) && requestStatus === 'idle' && (
              <p className="text-xs text-muted-foreground text-center">
                {!confirmedAnonymized && 'Marque a confirmação de anonimização. '}
                {caseText.length < 20 && `Texto insuficiente (${caseText.length}/20 caracteres).`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {requestStatus === 'error' && errorMessage && (
        <Alert variant="destructive" className="rounded-xl"><AlertTriangle className="h-4 w-4" /><AlertDescription>{errorMessage}</AlertDescription></Alert>
      )}
      {requestStatus === 'success' && (
        <Alert className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20 rounded-xl">
          <CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800 dark:text-green-200">Análise gerada com sucesso.</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Resultado da Análise
              {consultMode === 'board' && <Badge variant="outline" className="ml-1 text-xs">Board</Badge>}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={result.confidence === 'alta' ? 'default' : result.confidence === 'média' ? 'secondary' : 'outline'}>
                Confiança: {result.confidence}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleCopyResult} className="rounded-lg">
                <Copy className="h-4 w-4 mr-1.5" />Copiar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
              <h3 className="font-semibold text-sm text-primary mb-1">Resumo do Caso</h3>
              <p className="text-sm text-muted-foreground font-body">{result.summary}</p>
            </div>

            {/* Hypotheses */}
            <div className="space-y-3">
              <h3 className="font-semibold">{consultMode === 'board' ? 'Hipóteses Consensuais' : 'Hipóteses Principais'}</h3>
              {result.hypotheses.map(h => (
                <Card key={h.rank} className="border-l-4 border-l-primary rounded-xl">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="shrink-0 rounded-lg">#{h.rank}</Badge>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold">{h.diagnosis}</h4>
                        <div className="space-y-1.5 text-sm font-body">
                          <div><span className="font-medium text-muted-foreground">Justificativa:</span> {h.justification}</div>
                          <div><span className="font-medium text-muted-foreground">Contra-argumentos:</span> {h.arguments_against}</div>
                          {h.confirmation_questions.length > 0 && (
                            <div>
                              <span className="font-medium text-muted-foreground">Perguntas para confirmar:</span>
                              <ul className="list-disc list-inside mt-1 space-y-0.5">{h.confirmation_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Red Flags */}
            {result.red_flags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Red Flags</h3>
                <div className="rounded-xl bg-destructive/5 p-4 border border-destructive/10 space-y-1.5">
                  {result.red_flags.map((flag, i) => <p key={i} className="flex items-center gap-2 text-sm font-body text-destructive"><span className="w-1.5 h-1.5 rounded-full bg-destructive" />{flag}</p>)}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {result.next_steps.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Próximos Passos Sugeridos</h3>
                <div className="rounded-xl bg-muted/30 p-4 space-y-1.5">
                  {result.next_steps.map((step, i) => <p key={i} className="flex items-center gap-2 text-sm font-body"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{step}</p>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer disclaimer — discrete */}
      <p className="text-xs text-muted-foreground/60 text-center pt-2 border-t border-border/30">
        Ferramenta de apoio à discussão diagnóstica em ultrassonografia. Não substitui julgamento médico. Não inclua identificadores do paciente.
      </p>
    </div>
  );
}
