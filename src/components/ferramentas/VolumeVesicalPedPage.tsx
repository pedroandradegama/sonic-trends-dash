import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function VolumeVesicalPedPage() {
  const [ageUnit, setAgeUnit] = useState<'months' | 'years'>('years');
  const [ageValue, setAgeValue] = useState('');
  const [measuredL, setMeasuredL] = useState('');
  const [measuredW, setMeasuredW] = useState('');
  const [measuredH, setMeasuredH] = useState('');

  const calc = useMemo(() => {
    const age = parseFloat(ageValue);
    if (isNaN(age) || age < 0) return null;

    const ageMonths = ageUnit === 'years' ? age * 12 : age;
    const ageYears = ageUnit === 'years' ? age : age / 12;

    let expectedCapacity: number;
    let formula: string;
    let reference: string;

    if (ageMonths < 12) {
      // Holmdahl et al., 1996
      expectedCapacity = 2.5 * ageMonths + 38;
      formula = `(2,5 × ${Math.round(ageMonths)} meses) + 38`;
      reference = 'Holmdahl et al., J Urol 1996';
    } else {
      // Koff, 1983
      expectedCapacity = (ageYears + 2) * 30;
      formula = `(${ageYears.toFixed(1)} + 2) × 30`;
      reference = 'Koff, J Urol 1983';
    }

    expectedCapacity = Math.round(expectedCapacity);

    // Measured volume
    let measuredVolume: number | null = null;
    const mL = parseFloat(measuredL), mW = parseFloat(measuredW), mH = parseFloat(measuredH);
    if (mL > 0 && mW > 0 && mH > 0) {
      measuredVolume = Math.round(mL * mW * mH * 0.52 * 10) / 10;
    }

    let comparison: string | null = null;
    let compColor = '';
    if (measuredVolume !== null) {
      const ratio = measuredVolume / expectedCapacity;
      if (ratio > 1.5) { comparison = 'Acima do esperado (> 150%)'; compColor = 'text-[hsl(var(--warning))]'; }
      else if (ratio >= 0.5) { comparison = 'Dentro da faixa esperada'; compColor = 'text-[hsl(var(--success))]'; }
      else { comparison = 'Abaixo do esperado (< 50%)'; compColor = 'text-[hsl(var(--warning))]'; }
    }

    return { expectedCapacity, formula, reference, measuredVolume, comparison, compColor, ageMonths };
  }, [ageValue, ageUnit, measuredL, measuredW, measuredH]);

  const reportText = useMemo(() => {
    if (!calc) return '';
    const parts: string[] = [];
    parts.push(`Capacidade vesical esperada para a idade: ${calc.expectedCapacity} mL (${calc.reference}).`);
    if (calc.measuredVolume !== null) {
      parts.push(`Volume vesical medido (US): ${calc.measuredVolume} mL (fórmula elipsoide). ${calc.comparison}.`);
    }
    return parts.join(' ');
  }, [calc]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    toast.success('Texto copiado.');
    logToolUsage('volume-vesical-ped', { expectedCapacity: calc?.expectedCapacity, measuredVolume: calc?.measuredVolume });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Volume Vesical Esperado — Pediatria</h1>
        <p className="text-muted-foreground mt-1">
          Capacidade vesical esperada por idade (Koff 1983 / Holmdahl 1996)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Idade do Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Idade</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={ageValue}
                onChange={e => setAgeValue(e.target.value)}
                className="w-[120px]"
              />
            </div>
            <Select value={ageUnit} onValueChange={v => setAgeUnit(v as 'months' | 'years')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="years">Anos</SelectItem>
                <SelectItem value="months">Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volume Medido (opcional)</CardTitle>
          <CardDescription>Insira as dimensões da bexiga em cm para comparar com o esperado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Comprimento (cm)</Label>
              <Input type="number" step="0.1" min="0" value={measuredL} onChange={e => setMeasuredL(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Largura (cm)</Label>
              <Input type="number" step="0.1" min="0" value={measuredW} onChange={e => setMeasuredW(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              <Input type="number" step="0.1" min="0" value={measuredH} onChange={e => setMeasuredH(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {calc && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Capacidade vesical esperada</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl font-bold text-foreground">{calc.expectedCapacity} mL</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fórmula: {calc.formula}
              </p>
            </div>

            {calc.measuredVolume !== null && (
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">Volume medido</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-xl font-bold text-foreground">{calc.measuredVolume} mL</span>
                  <Badge variant="outline" className={calc.compColor}>{calc.comparison}</Badge>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
              <p><strong>Referências:</strong></p>
              <p>• &lt;1 ano: Capacidade (mL) = (2,5 × idade em meses) + 38 — Holmdahl et al., J Urol 1996</p>
              <p>• ≥1 ano: Capacidade (mL) = (idade em anos + 2) × 30 — Koff, J Urol 1983</p>
              <div className="flex gap-3 pt-1">
                <a href="https://pubmed.ncbi.nlm.nih.gov/8648872/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Holmdahl 1996
                </a>
                <a href="https://pubmed.ncbi.nlm.nih.gov/6834244/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Koff 1983
                </a>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">{reportText}</div>
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
