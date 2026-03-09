import { useState, useCallback } from 'react';
import { AlertTriangle, Brain, Copy, CheckCircle, Loader2, TestTube, Sparkles, History, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useMagiaHistory, DiagnosisResult, MagiaHistoryItem } from '@/hooks/useMagiaHistory';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { InputModeSelector, InputMode } from './InputModeSelector';
import { AudioInputPanel } from './AudioInputPanel';
import { TextInputPanel } from './TextInputPanel';
import { StructuredInputPanel } from './StructuredInputPanel';

const AREAS = [
  { value: 'abdome', label: 'Abdome' },
  { value: 'gineco_obst', label: 'Ginecologia e Obstetrícia' },
  { value: 'mamas', label: 'Mamas' },
  { value: 'msk', label: 'MSK' },
  { value: 'tireoide', label: 'Tireoide' },
  { value: 'doppler', label: 'Doppler Vascular' },
  { value: 'outro', label: 'Outro' },
];

const TEST_CASE = 'Mulher 34 anos, dor pélvica crônica há 6 meses. US TV: cisto simples de 3,2 cm em ovário direito, parede fina, sem septos/vegetações, Doppler sem hipervascularização.';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

type AIModel = 'gpt' | 'claude';

const AI_MODELS: { value: AIModel; label: string; description: string }[] = [
  { value: 'gpt', label: 'GPT-4o mini', description: 'OpenAI — rápido e eficiente' },
  { value: 'claude', label: 'Claude Sonnet', description: 'Anthropic — raciocínio avançado' },
];

export default function MagiaHDPanel() {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { toast } = useToast();
  const { history, addToHistory } = useMagiaHistory();

  const [confirmedAnonymized, setConfirmedAnonymized] = useState(false);
  const [area, setArea] = useState('outro');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [caseText, setCaseText] = useState('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [aiModel, setAiModel] = useState<AIModel>('gpt');
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
    }
    setRequestStatus('loading'); setErrorMessage(''); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dx', { body: { case_text: textToSend, area: testMode ? 'gineco_obst' : area, doctor_id: user?.id, model: aiModel } });
      if (error) {
        if (error.message?.includes('401') || error.message?.includes('403')) setErrorMessage('Falha de autenticação (401). Verifique se a Edge Function está ativa.');
        else if (error.message?.includes('500') || error.message?.includes('502')) setErrorMessage('Falha no backend/IA. Verifique Logs do Supabase Edge Function.');
        else setErrorMessage(error.message || 'Não foi possível gerar a análise.');
        setRequestStatus('error'); return;
      }
      if (data?.error) { setErrorMessage(data.error); setRequestStatus('error'); return; }
      setResult(data as DiagnosisResult); setRequestStatus('success');
      if (!testMode) addToHistory(textToSend, area, data as DiagnosisResult);
      toast({ title: 'Análise gerada com sucesso', description: 'As hipóteses diagnósticas foram geradas.' });
    } catch { setErrorMessage('Não foi possível gerar a análise. Tente novamente.'); setRequestStatus('error'); }
  };

  const handleCopyResult = () => {
    if (!result) return;
    const text = `RESUMO: ${result.summary}\n\nHIPÓTESES:\n${result.hypotheses.map(h => `${h.rank}. ${h.diagnosis}\n   ${h.justification}`).join('\n')}\n\nRED FLAGS:\n${result.red_flags.map(r => `• ${r}`).join('\n')}\n\nPRÓXIMOS PASSOS:\n${result.next_steps.map(s => `• ${s}`).join('\n')}\n\nConfiança: ${result.confidence}\n\n${result.disclaimer}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Resultado copiado para a área de transferência.' });
  };

  const loadFromHistory = (item: MagiaHistoryItem) => {
    setCaseText(item.case_text); setArea(item.area); setResult(item.result);
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
                    <Badge variant="outline" className="ml-2 shrink-0 text-xs">{AREAS.find(a => a.value === item.area)?.label || item.area}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Alert variant="default" className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
          <strong>Ferramenta de apoio à discussão diagnóstica em ultrassonografia.</strong> Não substitui julgamento médico. Não inclua identificadores do paciente.
        </AlertDescription>
      </Alert>

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

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area" className="text-sm font-medium">Área / Subgrupo</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger id="area" className="rounded-xl"><SelectValue placeholder="Selecione a área" /></SelectTrigger>
              <SelectContent>{AREAS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
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
            {inputMode === 'structured' && <StructuredInputPanel area={area} onChange={handleStructuredChange} />}
          </div>

          {inputMode === 'structured' && caseText && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Texto gerado (prévia):</Label>
              <div className="p-3 bg-muted/30 rounded-xl text-sm">{caseText}</div>
              <p className="text-xs text-muted-foreground">Caracteres: {caseText.length} {caseText.length < 20 && '(mínimo 20)'}</p>
            </div>
          )}

          {/* Generate */}
          <div className="space-y-2">
            <Button onClick={() => handleGenerate(false)} disabled={isGenerateDisabled} className="w-full rounded-xl" size="lg">
              {requestStatus === 'loading' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando hipóteses...</> : <><Sparkles className="h-4 w-4 mr-2" />Gerar hipóteses diagnósticas</>}
            </Button>
            {isGenerateDisabled && requestStatus !== 'loading' && (
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
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </div>

            {/* Hypotheses */}
            <div className="space-y-3">
              <h3 className="font-semibold">Hipóteses Principais</h3>
              {result.hypotheses.map(h => (
                <Card key={h.rank} className="border-l-4 border-l-primary rounded-xl">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="shrink-0 rounded-lg">#{h.rank}</Badge>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold">{h.diagnosis}</h4>
                        <div className="space-y-1.5 text-sm">
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
                  {result.red_flags.map((flag, i) => <p key={i} className="flex items-center gap-2 text-sm text-destructive"><span className="w-1.5 h-1.5 rounded-full bg-destructive" />{flag}</p>)}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {result.next_steps.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Próximos Passos Sugeridos</h3>
                <div className="rounded-xl bg-muted/30 p-4 space-y-1.5">
                  {result.next_steps.map((step, i) => <p key={i} className="flex items-center gap-2 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{step}</p>)}
                </div>
              </div>
            )}

            <Alert variant="default" className="bg-muted rounded-xl">
              <AlertDescription className="text-xs text-muted-foreground italic">{result.disclaimer}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
