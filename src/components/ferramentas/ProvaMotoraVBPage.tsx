import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { Copy, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TimePoint {
  id: string;
  label: string;
  inputMode: 'dimensions' | 'volume';
  l: string;
  w: string;
  h: string;
  directVolume: string;
}

const TIME_LABELS = [
  'Jejum (basal)',
  '15 min',
  '30 min',
  '45 min',
  '60 min',
  '90 min',
  '120 min',
  'Outro',
];

function computeVolume(tp: TimePoint): number | null {
  if (tp.inputMode === 'volume') {
    const v = parseFloat(tp.directVolume);
    return v > 0 ? v : null;
  }
  const l = parseFloat(tp.l), w = parseFloat(tp.w), h = parseFloat(tp.h);
  if (l > 0 && w > 0 && h > 0) return Math.round(l * w * h * 0.52 * 10) / 10;
  return null;
}

function createTimePoint(label: string): TimePoint {
  return { id: crypto.randomUUID(), label, inputMode: 'dimensions', l: '', w: '', h: '', directVolume: '' };
}

export function ProvaMotoraVBPage() {
  const [stimulus, setStimulus] = useState('nao_informado');
  const [timePoints, setTimePoints] = useState<TimePoint[]>([
    createTimePoint('Jejum (basal)'),
    createTimePoint('30 min'),
  ]);

  const updateTP = (id: string, patch: Partial<TimePoint>) => {
    setTimePoints(prev => prev.map(tp => tp.id === id ? { ...tp, ...patch } : tp));
  };

  const addTimePoint = () => {
    const used = new Set(timePoints.map(tp => tp.label));
    const next = TIME_LABELS.find(l => !used.has(l)) || 'Outro';
    setTimePoints(prev => [...prev, createTimePoint(next)]);
  };

  const removeTimePoint = (id: string) => {
    if (timePoints.length <= 2) return;
    setTimePoints(prev => prev.filter(tp => tp.id !== id));
  };

  const volumes = useMemo(() => {
    return timePoints.map(tp => ({ id: tp.id, label: tp.label, volume: computeVolume(tp) }));
  }, [timePoints]);

  const basalVolume = volumes[0]?.volume;

  const fractions = useMemo(() => {
    if (!basalVolume || basalVolume <= 0) return [];
    return volumes.slice(1).map(v => {
      if (v.volume === null) return { ...v, fevb: null, classification: '', color: '' };
      const fevb = Math.round(((basalVolume - v.volume) / basalVolume) * 100 * 10) / 10;
      let classification: string, color: string;
      if (fevb >= 40) { classification = 'Preservada'; color = 'text-[hsl(var(--success))]'; }
      else if (fevb >= 35) { classification = 'Limítrofe'; color = 'text-[hsl(var(--warning))]'; }
      else { classification = 'Reduzida'; color = 'text-destructive'; }
      return { ...v, fevb, classification, color };
    });
  }, [basalVolume, volumes]);

  const stimulusLabel = stimulus === 'refeicao' ? 'Refeição gordurosa' : stimulus === 'cck' ? 'CCK' : 'Não informado';

  const reportText = useMemo(() => {
    if (!basalVolume) return '';
    const lines: string[] = [];
    lines.push(`Vesícula biliar (US seriado — Prova Motora):`);
    lines.push(`Volume basal (jejum): ${basalVolume} mL.`);
    fractions.forEach(f => {
      if (f.volume !== null && f.fevb !== null) {
        lines.push(`${f.label}: ${f.volume} mL → FE = ${f.fevb}% (${f.classification}).`);
      }
    });
    lines.push(`Estímulo: ${stimulusLabel}.`);
    lines.push(`Fórmula: elipsoide (L × W × H × 0,52).`);
    return lines.join('\n');
  }, [basalVolume, fractions, stimulusLabel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    toast.success('Texto copiado.');
    logToolUsage('prova-motora-vb', { basalVolume, fractions: fractions.map(f => ({ label: f.label, volume: f.volume, fevb: f.fevb })) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas-ia')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prova Motora da Vesícula Biliar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Fração de ejeção vesicular com múltiplos pontos de medida
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medidas da Vesícula</CardTitle>
          <CardDescription>Insira dimensões (cm) ou volume direto (mL) para cada momento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {timePoints.map((tp, idx) => (
            <div key={tp.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Select value={tp.label} onValueChange={v => updateTP(tp.id, { label: v })}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_LABELS.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {idx === 0 && <Badge variant="secondary" className="text-xs">Basal</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Vol. direto</Label>
                    <Switch
                      checked={tp.inputMode === 'volume'}
                      onCheckedChange={checked => updateTP(tp.id, { inputMode: checked ? 'volume' : 'dimensions' })}
                    />
                  </div>
                  {timePoints.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTimePoint(tp.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>

              {tp.inputMode === 'dimensions' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Comprimento (cm)</Label>
                    <Input type="number" step="0.1" min="0" value={tp.l} onChange={e => updateTP(tp.id, { l: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Largura (cm)</Label>
                    <Input type="number" step="0.1" min="0" value={tp.w} onChange={e => updateTP(tp.id, { w: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Altura (cm)</Label>
                    <Input type="number" step="0.1" min="0" value={tp.h} onChange={e => updateTP(tp.id, { h: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="max-w-[200px] space-y-1">
                  <Label className="text-xs">Volume (mL)</Label>
                  <Input type="number" step="0.1" min="0" value={tp.directVolume} onChange={e => updateTP(tp.id, { directVolume: e.target.value })} />
                </div>
              )}

              {computeVolume(tp) !== null && (
                <p className="text-sm text-muted-foreground">Volume: <strong className="text-foreground">{computeVolume(tp)} mL</strong></p>
              )}
            </div>
          ))}

          <Button variant="outline" size="sm" className="gap-1.5" onClick={addTimePoint}>
            <Plus className="h-4 w-4" /> Adicionar momento
          </Button>

          <div className="space-y-2 pt-2">
            <Label>Estímulo colerético</Label>
            <Select value={stimulus} onValueChange={setStimulus}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refeicao">Refeição gordurosa</SelectItem>
                <SelectItem value="cck">CCK</SelectItem>
                <SelectItem value="nao_informado">Não informado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {fractions.some(f => f.fevb !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interpretação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {fractions.filter(f => f.fevb !== null).map(f => (
                <div key={f.id} className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-sm text-muted-foreground min-w-[80px]">{f.label}:</span>
                  <span className="text-sm">{f.volume} mL →</span>
                  <span className="text-xl font-bold text-foreground">{f.fevb}%</span>
                  <Badge variant="outline" className={f.color}>{f.classification}</Badge>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>≥40% → preservada</p>
              <p>35–39% → limítrofe</p>
              <p>&lt;35% → reduzida</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-line">{reportText}</div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
              <Copy className="h-3 w-3" /> Copiar texto
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center border-t pt-4">
        Ferramenta de suporte à decisão. Valores variam conforme técnica, biotipo, protocolo e contexto clínico. Não substitui julgamento clínico.
      </p>
    </div>
  );
}
