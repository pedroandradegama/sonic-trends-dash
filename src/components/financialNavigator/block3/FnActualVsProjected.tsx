import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFnConfig } from '@/hooks/useFnConfig';
import { useFnProjection } from '@/hooks/useFnProjection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Upload, PenLine, Check, X, Loader2, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const BRL = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

interface ActualRecord {
  id: string;
  service_id: string;
  production_month: string;
  amount: number;
  source: string;
  notes?: string;
}

export function FnActualVsProjected() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id ?? '';
  const { services } = useFnConfig();
  const { projectionPoints } = useFnProjection();
  const qc = useQueryClient();

  const [showManual, setShowManual] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [manualForm, setManualForm] = useState({ service_id: '', amount: '', month: '', year: '' });
  const [pdfService, setPdfService] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfResult, setPdfResult] = useState<{ amount: number; month: string; notes: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const { data: actuals = [] } = useQuery({
    queryKey: ['fn_actual_production', uid],
    enabled: !!uid,
    queryFn: async (): Promise<ActualRecord[]> => {
      const { data } = await (supabase as any)
        .from('fn_actual_production')
        .select('*')
        .eq('user_id', uid)
        .order('production_month', { ascending: false });
      return (data ?? []) as ActualRecord[];
    },
  });

  const saveActual = useMutation({
    mutationFn: async (record: Omit<ActualRecord, 'id'>) => {
      const { error } = await (supabase as any)
        .from('fn_actual_production')
        .upsert(
          { ...record, user_id: uid, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,service_id,production_month' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fn_actual_production', uid] });
      toast({ title: 'Produção registrada!' });
    },
  });

  const handleManualSave = async () => {
    if (!manualForm.service_id || !manualForm.amount || !manualForm.month || !manualForm.year) return;
    setSaving(true);
    const monthIdx = MONTHS.indexOf(manualForm.month);
    const productionMonth = `${manualForm.year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
    await saveActual.mutateAsync({
      service_id: manualForm.service_id,
      production_month: productionMonth,
      amount: Number(manualForm.amount),
      source: 'manual',
    } as any);
    setSaving(false);
    setShowManual(false);
    setManualForm({ service_id: '', amount: '', month: '', year: '' });
  };

  const handlePdfUpload = async () => {
    if (!pdfFile || !pdfService) return;
    setPdfParsing(true);
    try {
      const base64 = await fileToBase64(pdfFile);
      const { data, error } = await supabase.functions.invoke('fn-parse-production-pdf', {
        body: { pdf_base64: base64, service_names: services.map(s => s.name) },
      });
      if (error) throw error;
      setPdfResult({
        amount: data.amount ?? 0,
        month: data.month ?? '',
        notes: data.raw_text?.substring(0, 200) ?? '',
      });
    } catch (err: any) {
      toast({ title: 'Erro ao processar PDF', description: err.message, variant: 'destructive' });
    } finally {
      setPdfParsing(false);
    }
  };

  const handlePdfConfirm = async () => {
    if (!pdfResult || !pdfService) return;
    setSaving(true);
    await saveActual.mutateAsync({
      service_id: pdfService,
      production_month: pdfResult.month,
      amount: pdfResult.amount,
      source: 'pdf',
      notes: pdfResult.notes,
    } as any);
    setSaving(false);
    setShowPdf(false);
    setPdfResult(null);
    setPdfFile(null);
    setPdfService('');
  };

  // Build comparison data
  const comparisonData = useMemo(() => {
    return projectionPoints.map(pt => {
      const monthKey = `${pt.year}-${String(pt.month + 1).padStart(2, '0')}-01`;
      const byService: { svcName: string; color: string; projected: number; actual: number | null }[] = [];
      services.forEach(svc => {
        const projected = pt.grossByService[svc.id] ?? 0;
        const actualRec = actuals.find(a => a.service_id === svc.id && a.production_month === monthKey);
        if (projected > 0 || actualRec) {
          byService.push({
            svcName: svc.name,
            color: svc.color,
            projected,
            actual: actualRec ? actualRec.amount : null,
          });
        }
      });
      return { label: pt.label, monthKey, byService, totalProjected: pt.totalGross };
    }).filter(d => d.byService.length > 0);
  }, [projectionPoints, actuals, services]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground font-display flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-primary" />
          Projetado vs Realizado
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowManual(true)}>
            <PenLine className="h-3.5 w-3.5" />
            Manual
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowPdf(true)}>
            <Upload className="h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </div>

      {comparisonData.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Adicione dados realizados para comparar com a projeção.
        </p>
      ) : (
        <div className="space-y-3">
          {comparisonData.map(month => (
            <div key={month.monthKey} className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase">{month.label}</p>
              {month.byService.map((svc, idx) => {
                const diff = svc.actual !== null ? svc.actual - svc.projected : null;
                const pctDiff = svc.projected > 0 && diff !== null ? (diff / svc.projected) * 100 : null;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: svc.color }} />
                    <span className="flex-1 truncate text-muted-foreground">{svc.svcName}</span>
                    <span className="text-foreground font-medium w-24 text-right">{BRL(svc.projected)}</span>
                    <span className="text-muted-foreground">→</span>
                    {svc.actual !== null ? (
                      <>
                        <span className="text-foreground font-medium w-24 text-right">{BRL(svc.actual)}</span>
                        <span className={cn(
                          'flex items-center gap-0.5 w-16 text-right font-medium',
                          diff! > 0 ? 'text-emerald-600' : diff! < 0 ? 'text-red-500' : 'text-muted-foreground'
                        )}>
                          {diff! > 0 ? <TrendingUp className="h-3 w-3" /> :
                           diff! < 0 ? <TrendingDown className="h-3 w-3" /> :
                           <Minus className="h-3 w-3" />}
                          {pctDiff !== null ? `${pctDiff > 0 ? '+' : ''}${pctDiff.toFixed(0)}%` : '—'}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/50 w-24 text-right italic">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Manual Dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Registrar produção realizada</DialogTitle>
            <DialogDescription>Informe os valores recebidos por clínica e mês.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Clínica</Label>
              <Select value={manualForm.service_id} onValueChange={v => setManualForm(f => ({ ...f, service_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Mês de Produção</Label>
                <Select value={manualForm.month} onValueChange={v => setManualForm(f => ({ ...f, month: v }))}>
                  <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ano</Label>
                <Select value={manualForm.year} onValueChange={v => setManualForm(f => ({ ...f, year: v }))}>
                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor realizado (R$)</Label>
              <Input
                type="number"
                value={manualForm.amount}
                onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Ex: 15000"
              />
            </div>
            <Button className="w-full" onClick={handleManualSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Dialog */}
      <Dialog open={showPdf} onOpenChange={v => { setShowPdf(v); if (!v) { setPdfResult(null); setPdfFile(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Importar PDF de produção</DialogTitle>
            <DialogDescription>Envie o PDF e a IA identificará os valores automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Clínica</Label>
              <Select value={pdfService} onValueChange={setPdfService}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Arquivo PDF</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {!pdfResult && (
              <Button
                className="w-full"
                onClick={handlePdfUpload}
                disabled={pdfParsing || !pdfFile || !pdfService}
              >
                {pdfParsing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processando...</>
                ) : (
                  'Enviar para análise'
                )}
              </Button>
            )}

            {pdfResult && (
              <div className="space-y-3 p-3 rounded-xl border border-border bg-muted/30">
                <p className="text-xs font-semibold text-foreground">Resultado da IA — confirme os dados:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Valor</p>
                    <Input
                      type="number"
                      value={pdfResult.amount}
                      onChange={e => setPdfResult(r => r ? { ...r, amount: Number(e.target.value) } : r)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mês de produção</p>
                    <Input
                      value={pdfResult.month}
                      onChange={e => setPdfResult(r => r ? { ...r, month: e.target.value } : r)}
                      className="h-8 text-xs mt-1"
                      placeholder="YYYY-MM-01"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-1" size="sm" onClick={handlePdfConfirm} disabled={saving}>
                    <Check className="h-3.5 w-3.5" />
                    Confirmar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPdfResult(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
