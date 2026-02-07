import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePedsOrganNorms, OrganNorm } from '@/hooks/usePedsOrganNorms';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { Copy, RotateCcw, ArrowLeft, Baby, Ruler, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ORGAN_LABELS: Record<string, string> = {
  liver_right_lobe: 'Fígado (lobo direito)',
  spleen: 'Baço',
  kidney_right: 'Rim direito',
  kidney_left: 'Rim esquerdo',
};

const ORGAN_LAUDO_LABELS: Record<string, string> = {
  liver_right_lobe: 'fígado (lobo direito)',
  spleen: 'baço',
  kidney_right: 'rim direito',
  kidney_left: 'rim esquerdo',
};

type Classification = 'normal' | 'below' | 'above' | null;

interface Result {
  classification: Classification;
  norm: OrganNorm;
  measureMm: number;
  laudoText: string;
}

export function PercentisCalculator() {
  const navigate = useNavigate();
  const { data: norms, isLoading } = usePedsOrganNorms();

  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [organ, setOrgan] = useState('');
  const [measure, setMeasure] = useState('');
  const [unit, setUnit] = useState<'mm' | 'cm'>('mm');
  const [result, setResult] = useState<Result | null>(null);

  const totalMonths = useMemo(() => {
    const y = parseInt(ageYears) || 0;
    const m = parseInt(ageMonths) || 0;
    return y * 12 + m;
  }, [ageYears, ageMonths]);

  const matchingNorm = useMemo(() => {
    if (!norms || !organ || totalMonths <= 0) return null;
    return norms.find(
      (n) => n.organ_key === organ && totalMonths >= n.age_min_mo && totalMonths <= n.age_max_mo
    ) || null;
  }, [norms, organ, totalMonths]);

  function classify() {
    if (!matchingNorm || !measure) return;

    const measureVal = parseFloat(measure);
    if (isNaN(measureVal)) return;

    const measureMm = unit === 'cm' ? measureVal * 10 : measureVal;

    let classification: Classification;
    let laudoText: string;
    const organLabel = ORGAN_LAUDO_LABELS[organ] || organ;

    if (measureMm < matchingNorm.p5_mm) {
      classification = 'below';
      laudoText = `Medida do ${organLabel} abaixo do esperado para a faixa etária (<P5). Correlacionar clinicamente. Referência: Konus AJR 1998.`;
    } else if (measureMm > matchingNorm.p95_mm) {
      classification = 'above';
      laudoText = `Medida do ${organLabel} acima do esperado para a faixa etária (>P95). Correlacionar clinicamente. Referência: Konus AJR 1998.`;
    } else {
      classification = 'normal';
      laudoText = `Medida do ${organLabel} compatível com a faixa etária (entre P5–P95). Referência: Konus AJR 1998.`;
    }

    setResult({ classification, norm: matchingNorm, measureMm, laudoText });

    // Log usage
    logToolUsage('percentis-us', { organ_key: organ, unidade: unit });
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.laudoText);
    toast.success('Texto copiado para a área de transferência');
  }

  function handleClear() {
    setAgeYears('');
    setAgeMonths('');
    setOrgan('');
    setMeasure('');
    setUnit('mm');
    setResult(null);
  }

  const canCalculate = organ && totalMonths > 0 && measure && matchingNorm;

  const classificationBadge = (c: Classification) => {
    switch (c) {
      case 'normal':
        return <Badge className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white text-sm px-3 py-1">Entre P5–P95</Badge>;
      case 'below':
        return <Badge className="bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90 text-white text-sm px-3 py-1">Abaixo do P5</Badge>;
      case 'above':
        return <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm px-3 py-1">Acima do P95</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">US Pediátrico — Percentis de Órgãos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Normalidade por idade (P5–P95) para fígado, baço e rins
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Age Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Baby className="h-4 w-4 text-primary" />
              Idade do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="age-years" className="text-xs text-muted-foreground">Anos</Label>
                <Input
                  id="age-years"
                  type="number"
                  min={0}
                  max={16}
                  placeholder="0"
                  value={ageYears}
                  onChange={(e) => setAgeYears(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="age-months" className="text-xs text-muted-foreground">Meses</Label>
                <Input
                  id="age-months"
                  type="number"
                  min={0}
                  max={11}
                  placeholder="0"
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(e.target.value)}
                />
              </div>
            </div>
            {totalMonths > 0 && (
              <p className="text-xs text-muted-foreground">
                Total: {totalMonths} {totalMonths === 1 ? 'mês' : 'meses'}
              </p>
            )}
            {totalMonths > 0 && !matchingNorm && organ && (
              <p className="text-xs text-destructive">
                Faixa etária fora do intervalo disponível (1–200 meses).
              </p>
            )}
          </CardContent>
        </Card>

        {/* Organ + Measure Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary" />
              Órgão e Medida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Órgão</Label>
              <Select value={organ} onValueChange={setOrgan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o órgão" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORGAN_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="measure" className="text-xs text-muted-foreground">Medida</Label>
                <Input
                  id="measure"
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder="0"
                  value={measure}
                  onChange={(e) => setMeasure(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Unidade</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as 'mm' | 'cm')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={classify} disabled={!canCalculate} className="flex-1">
                Avaliar
              </Button>
              <Button variant="outline" onClick={handleClear}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {classificationBadge(result.classification)}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Medida: <span className="font-medium text-foreground">{result.measureMm} mm</span></p>
                  <p>P5: <span className="font-medium text-foreground">{result.norm.p5_mm} mm</span></p>
                  <p>P95: <span className="font-medium text-foreground">{result.norm.p95_mm} mm</span></p>
                  <p>Faixa etária: <span className="font-medium text-foreground">{result.norm.age_min_mo}–{result.norm.age_max_mo} meses</span></p>
                </div>

                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.laudoText}
                  </p>
                </div>

                <Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar texto do laudo
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>Preencha os dados e clique em <strong>Avaliar</strong> para ver o resultado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Fonte:</strong> Konus AJR 1998 (Tabelas 4–7).</p>
            <p>Altura é melhor correlato no artigo; idade usada por viabilidade prática.</p>
            <p>Ferramenta de suporte — não substitui julgamento clínico.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
