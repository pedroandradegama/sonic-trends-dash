import { useState } from 'react';
import { FileText, Copy, Loader2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AREAS = [
  { value: 'abdome', label: 'Abdome' },
  { value: 'gineco_obst', label: 'Ginecologia e Obstetrícia' },
  { value: 'mamas', label: 'Mamas' },
  { value: 'msk', label: 'MSK' },
  { value: 'tireoide', label: 'Tireoide' },
  { value: 'doppler', label: 'Doppler Vascular' },
  { value: 'outro', label: 'Outro' },
];

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

interface ReviewResult {
  revised_report: string;
  changes_summary: string[];
  terminology_notes: string[];
  references: string[];
  disclaimer: string;
}

export default function ReportReviewPanel() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [confirmedAnonymized, setConfirmedAnonymized] = useState(false);
  const [area, setArea] = useState('outro');
  const [reportText, setReportText] = useState('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);

  const handleReview = async () => {
    if (!confirmedAnonymized) {
      setErrorMessage('Marque a confirmação de anonimização antes de enviar.');
      setRequestStatus('error');
      return;
    }
    if (reportText.length < 30) {
      setErrorMessage('Cole o texto do laudo com mais detalhes (mínimo 30 caracteres).');
      setRequestStatus('error');
      return;
    }

    setRequestStatus('loading');
    setErrorMessage('');
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-dx', {
        body: {
          case_text: reportText,
          area,
          doctor_id: user?.id,
          mode: 'review',
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Falha ao processar. Tente novamente.');
        setRequestStatus('error');
        return;
      }

      if (data?.error) {
        setErrorMessage(data.error);
        setRequestStatus('error');
        return;
      }

      setResult(data as ReviewResult);
      setRequestStatus('success');
      toast({ title: 'Revisão concluída', description: 'O laudo foi revisado com sucesso.' });
    } catch (err: any) {
      setErrorMessage('Erro inesperado. Tente novamente.');
      setRequestStatus('error');
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.revised_report);
    toast({ title: 'Copiado!', description: 'Laudo revisado copiado para a área de transferência.' });
  };

  const isDisabled = !confirmedAnonymized || reportText.length < 30 || requestStatus === 'loading';

  return (
    <div className="space-y-6">
      <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>Revisão de laudo assistida por IA.</strong>
          <br />
          Cole o texto do laudo para receber sugestões de aprimoramento terminológico e completude descritiva. Fontes: ACR, RSNA Radiographics, Radiology Assistant, PubMed.
          <br />
          Não inclua identificadores do paciente.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-review"
              checked={confirmedAnonymized}
              onCheckedChange={(checked) => setConfirmedAnonymized(checked === true)}
            />
            <Label htmlFor="confirm-review" className="text-sm font-medium cursor-pointer">
              Confirmo que removi identificadores do paciente.
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Área / Subgrupo</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
              <SelectContent>
                {AREAS.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Texto do Laudo</Label>
            <Textarea
              placeholder="Cole aqui o texto do laudo para revisão..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Caracteres: {reportText.length} {reportText.length < 30 && '(mínimo 30)'}
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleReview} disabled={isDisabled} className="w-full" size="lg">
              {requestStatus === 'loading' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Revisando laudo...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Revisar laudo</>
              )}
            </Button>
            {isDisabled && requestStatus !== 'loading' && (
              <p className="text-xs text-muted-foreground text-center">
                {!confirmedAnonymized && 'Marque a confirmação de anonimização. '}
                {reportText.length < 30 && `Texto insuficiente (${reportText.length}/30 caracteres).`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {requestStatus === 'error' && errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {requestStatus === 'success' && (
        <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">Revisão concluída.</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Laudo Revisado
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleCopyResult}>
              <Copy className="h-4 w-4 mr-2" /> Copiar laudo revisado
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm font-mono">{result.revised_report}</pre>
            </div>

            {result.changes_summary?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Alterações realizadas</h3>
                <ul className="space-y-1">
                  {result.changes_summary.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.terminology_notes?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Notas terminológicas</h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.terminology_notes.map((n, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                  ))}
                </div>
              </div>
            )}

            {result.references?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Referências consultadas</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {result.references.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            )}

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
