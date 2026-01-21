import { useState } from 'react';
import { AlertTriangle, Brain, Copy, CheckCircle, Loader2, TestTube, Sparkles, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useMagiaHistory, DiagnosisResult, MagiaHistoryItem } from '@/hooks/useMagiaHistory';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function MagiaPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { toast } = useToast();
  const { history, addToHistory } = useMagiaHistory();

  const [confirmedAnonymized, setConfirmedAnonymized] = useState(false);
  const [area, setArea] = useState('outro');
  const [caseText, setCaseText] = useState('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerate = async (testMode = false) => {
    const textToSend = testMode ? TEST_CASE : caseText;

    // Validations (skip for test mode)
    if (!testMode) {
      if (!confirmedAnonymized) {
        setErrorMessage('Marque a confirmação de anonimização antes de enviar.');
        setRequestStatus('error');
        return;
      }

      if (textToSend.length < 20) {
        setErrorMessage('Descreva o caso com mais detalhes (mínimo 20 caracteres).');
        setRequestStatus('error');
        return;
      }
    }

    setRequestStatus('loading');
    setErrorMessage('');
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-dx', {
        body: {
          case_text: textToSend,
          area: testMode ? 'gineco_obst' : area,
          doctor_id: user?.id,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        
        if (error.message?.includes('401') || error.message?.includes('403')) {
          setErrorMessage('Falha de autenticação (401). Verifique se a Edge Function está ativa no Supabase.');
        } else if (error.message?.includes('500') || error.message?.includes('502')) {
          setErrorMessage('Falha no backend/IA. Verifique Logs do Supabase Edge Function e confirme OPENAI_API_KEY configurada como secret.');
        } else {
          setErrorMessage(error.message || 'Não foi possível gerar a análise. Tente novamente.');
        }
        setRequestStatus('error');
        return;
      }

      if (data?.error) {
        setErrorMessage(data.error);
        setRequestStatus('error');
        return;
      }

      setResult(data as DiagnosisResult);
      setRequestStatus('success');
      
      // Save to history (only for real cases, not tests)
      if (!testMode) {
        addToHistory(textToSend, area, data as DiagnosisResult);
      }

      toast({
        title: 'Análise gerada com sucesso',
        description: 'As hipóteses diagnósticas foram geradas.',
      });
    } catch (err: any) {
      console.error('Request error:', err);
      setErrorMessage('Não foi possível gerar a análise. Tente novamente. Se persistir, contate o administrador.');
      setRequestStatus('error');
    }
  };

  const handleCopyResult = () => {
    if (!result) return;

    const humanReadable = `
RESUMO DO CASO:
${result.summary}

HIPÓTESES DIAGNÓSTICAS:
${result.hypotheses.map(h => `
${h.rank}. ${h.diagnosis}
   Justificativa: ${h.justification}
   Contra-argumentos: ${h.arguments_against}
   Perguntas para confirmar: ${h.confirmation_questions.join(', ')}
`).join('\n')}

RED FLAGS:
${result.red_flags.map(r => `• ${r}`).join('\n')}

PRÓXIMOS PASSOS:
${result.next_steps.map(s => `• ${s}`).join('\n')}

Confiança: ${result.confidence}

${result.disclaimer}
`.trim();

    navigator.clipboard.writeText(humanReadable);
    toast({
      title: 'Copiado!',
      description: 'Resultado copiado para a área de transferência.',
    });
  };

  const loadFromHistory = (item: MagiaHistoryItem) => {
    setCaseText(item.case_text);
    setArea(item.area);
    setResult(item.result);
    setRequestStatus(item.result ? 'success' : 'idle');
    setShowHistory(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">MagIA – Hipóteses Diagnósticas (US)</h2>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico ({history.length})
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate(true)}
              disabled={requestStatus === 'loading'}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Testar conexão com IA
            </Button>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Análises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => loadFromHistory(item)}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm line-clamp-2">{item.case_text}</p>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {AREAS.find(a => a.value === item.area)?.label || item.area}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Banner */}
      <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>Ferramenta de apoio à discussão diagnóstica em ultrassonografia.</strong>
          <br />
          Não substitui julgamento médico.
          <br />
          Não inclua identificadores do paciente (nome, CPF, telefone, endereço).
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmedAnonymized}
              onCheckedChange={(checked) => setConfirmedAnonymized(checked === true)}
            />
            <Label htmlFor="confirm" className="text-sm font-medium cursor-pointer">
              Confirmo que removi identificadores do paciente.
            </Label>
          </div>

          {/* Area Select */}
          <div className="space-y-2">
            <Label htmlFor="area">Área / Subgrupo</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger id="area">
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Case Text */}
          <div className="space-y-2">
            <Label htmlFor="case">História clínica + achados ultrassonográficos</Label>
            <Textarea
              id="case"
              value={caseText}
              onChange={(e) => setCaseText(e.target.value)}
              placeholder="Exemplo: Mulher 34 anos, dor pélvica crônica há 6 meses. US TV: cisto simples de 3,2 cm em ovário direito, parede fina, sem septos/vegetações..."
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 20 caracteres. Atual: {caseText.length}
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => handleGenerate(false)}
            disabled={!confirmedAnonymized || caseText.length < 20 || requestStatus === 'loading'}
            className="w-full"
            size="lg"
          >
            {requestStatus === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando hipóteses...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar hipóteses diagnósticas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {requestStatus === 'error' && errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {requestStatus === 'success' && (
        <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Análise gerada com sucesso.
          </AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Resultado da Análise
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={
                result.confidence === 'alta' ? 'default' :
                result.confidence === 'média' ? 'secondary' : 'outline'
              }>
                Confiança: {result.confidence}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleCopyResult}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar resultado
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Resumo do Caso</h3>
              <p className="text-muted-foreground">{result.summary}</p>
            </div>

            {/* Hypotheses */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Hipóteses Principais</h3>
              <div className="grid gap-4">
                {result.hypotheses.map((h) => (
                  <Card key={h.rank} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="default" className="shrink-0">
                          #{h.rank}
                        </Badge>
                        <div className="space-y-3 flex-1">
                          <h4 className="font-semibold">{h.diagnosis}</h4>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Justificativa:</p>
                              <p className="text-sm">{h.justification}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Argumentos contra:</p>
                              <p className="text-sm">{h.arguments_against}</p>
                            </div>
                            
                            {h.confirmation_questions.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Perguntas para confirmar:</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {h.confirmation_questions.map((q, i) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Red Flags */}
            {result.red_flags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Red Flags
                </h3>
                <ul className="space-y-1">
                  {result.red_flags.map((flag, i) => (
                    <li key={i} className="flex items-center gap-2 text-destructive">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {result.next_steps.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Próximos Passos Sugeridos</h3>
                <ul className="space-y-1">
                  {result.next_steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <Alert variant="default" className="bg-muted">
              <AlertDescription className="text-xs text-muted-foreground italic">
                {result.disclaimer}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
