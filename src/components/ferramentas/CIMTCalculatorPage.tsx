import { useState, useMemo } from 'react';
import { ArrowLeft, Copy, AlertTriangle, Info, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { supabase } from '@/integrations/supabase/client';

interface NormRow {
  source: string;
  segment: string;
  sex: string;
  ethnicity: string;
  age_type: string;
  age_point: number | null;
  age_band_min: number | null;
  age_band_max: number | null;
  p25: number;
  p50: number;
  p75: number;
  p90: number | null;
}

interface Thresholds {
  p25: number;
  p50: number;
  p75: number;
  p90?: number;
}

interface SideResult {
  side: string;
  valueMm: number;
  percentileRange: string;
  isAboveP75: boolean;
  plaqueByThickness: boolean;
  thresholds: Thresholds;
}

interface FinalResult {
  tableUsed: string;
  sides: SideResult[];
  worstSide: SideResult;
  hasPlaque: boolean;
}

const ETHNICITY_OPTIONS = [
  { value: 'BRANCO', label: 'Branco' },
  { value: 'PARDO', label: 'Pardo' },
  { value: 'NEGRO', label: 'Negro' },
  { value: 'CHINES', label: 'Chinês' },
  { value: 'HISPANICO', label: 'Hispânico' },
  { value: 'NA', label: 'Não informado' },
];

const ETHNICITY_MAP_DISPLAY: Record<string, string> = {
  BRANCO: 'Branco', PARDO: 'Pardo', NEGRO: 'Negro',
  CHINES: 'Chinês', HISPANICO: 'Hispânico', NA: 'Não informado',
};

function selectNormativeTable(age: number, ethnicity: string): { source: string; ethnicity: string } | null {
  // ELSA: 40-65, Branco/Pardo/Negro
  if (age >= 40 && age <= 65 && ['BRANCO', 'PARDO', 'NEGRO'].includes(ethnicity)) {
    return { source: 'ELSA', ethnicity };
  }
  // MESA: 45-84, Branco/Negro/Chinês/Hispânico
  if (age >= 45 && age <= 84 && ['BRANCO', 'NEGRO', 'CHINES', 'HISPANICO'].includes(ethnicity)) {
    return { source: 'MESA', ethnicity };
  }
  // CAPS: fallback, 25-85 range, no ethnicity
  if (age >= 25 && age <= 85) {
    return { source: 'CAPS', ethnicity: 'NA' };
  }
  return null;
}

function interpolatePoint(rows: NormRow[], age: number): Thresholds | null {
  if (rows.length === 0) return null;
  const points = rows.filter(r => r.age_point !== null).sort((a, b) => a.age_point! - b.age_point!);
  if (points.length === 0) return null;

  if (age <= points[0].age_point!) return { p25: points[0].p25, p50: points[0].p50, p75: points[0].p75, p90: points[0].p90 ?? undefined };
  if (age >= points[points.length - 1].age_point!) {
    const last = points[points.length - 1];
    return { p25: last.p25, p50: last.p50, p75: last.p75, p90: last.p90 ?? undefined };
  }

  // Find two bracketing points
  let lower = points[0], upper = points[1];
  for (let i = 0; i < points.length - 1; i++) {
    if (age >= points[i].age_point! && age <= points[i + 1].age_point!) {
      lower = points[i]; upper = points[i + 1]; break;
    }
  }

  const t = (age - lower.age_point!) / (upper.age_point! - lower.age_point!);
  const lerp = (a: number, b: number) => a + t * (b - a);

  return {
    p25: lerp(lower.p25, upper.p25),
    p50: lerp(lower.p50, upper.p50),
    p75: lerp(lower.p75, upper.p75),
    p90: (lower.p90 != null && upper.p90 != null) ? lerp(lower.p90, upper.p90) : undefined,
  };
}

function findBand(rows: NormRow[], age: number): Thresholds | null {
  const match = rows.find(r => r.age_band_min !== null && r.age_band_max !== null && age >= r.age_band_min! && age <= r.age_band_max!);
  if (!match) return null;
  return { p25: match.p25, p50: match.p50, p75: match.p75, p90: match.p90 ?? undefined };
}

function estimatePercentile(valueMm: number, t: Thresholds): { range: string; isAboveP75: boolean } {
  if (valueMm < t.p25) return { range: '<P25', isAboveP75: false };
  if (valueMm < t.p50) return { range: 'P25–P50', isAboveP75: false };
  if (valueMm < t.p75) return { range: 'P50–P75', isAboveP75: false };
  if (t.p90 !== undefined) {
    if (valueMm < t.p90) return { range: 'P75–P90', isAboveP75: true };
    return { range: '≥P90', isAboveP75: true };
  }
  return { range: '≥P75', isAboveP75: true };
}

const PERCENTILE_RANK: Record<string, number> = {
  '<P25': 0, 'P25–P50': 1, 'P50–P75': 2, 'P75–P90': 3, '≥P75': 3, '≥P90': 4,
};

export default function CIMTCalculatorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('0');
  const [sex, setSex] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [ccdMm, setCcdMm] = useState('');
  const [cceMm, setCceMm] = useState('');
  const [hasFocalPlaque, setHasFocalPlaque] = useState(false);
  const [includePlaqueInValue, setIncludePlaqueInValue] = useState(false);

  const [result, setResult] = useState<FinalResult | null>(null);
  const [noTable, setNoTable] = useState(false);
  const [loading, setLoading] = useState(false);

  const ageDecimal = useMemo(() => {
    const y = parseFloat(ageYears) || 0;
    const m = parseFloat(ageMonths) || 0;
    return y + m / 12;
  }, [ageYears, ageMonths]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    const ccd = parseFloat(ccdMm);
    const cce = parseFloat(cceMm);
    if (ccd && (ccd < 0.10 || ccd > 3.00)) w.push(`CCD ${ccd} mm fora da faixa plausível (0.10–3.00 mm).`);
    if (cce && (cce < 0.10 || cce > 3.00)) w.push(`CCE ${cce} mm fora da faixa plausível (0.10–3.00 mm).`);
    return w;
  }, [ccdMm, cceMm]);

  const canCalculate = useMemo(() => {
    return sex && ethnicity && ageYears && (ccdMm || cceMm);
  }, [sex, ethnicity, ageYears, ccdMm, cceMm]);

  const handleCalculate = async () => {
    setResult(null);
    setNoTable(false);

    const tableInfo = selectNormativeTable(ageDecimal, ethnicity);
    if (!tableInfo) {
      setNoTable(true);
      // Still check plaque threshold
      const ccd = parseFloat(ccdMm);
      const cce = parseFloat(cceMm);
      if ((ccd && ccd > 1.5) || (cce && cce > 1.5)) {
        toast({
          title: 'Critério de placa',
          description: 'CMI > 1,5 mm detectado — critério de placa por espessura.',
          variant: 'destructive',
        });
      }
      return;
    }

    setLoading(true);
    try {
      const sexKey = sex === 'M' ? 'M' : 'F';
      const segments = ['CCD', 'CCE'];
      const sides: SideResult[] = [];

      for (const seg of segments) {
        const valueMm = parseFloat(seg === 'CCD' ? ccdMm : cceMm);
        if (!valueMm) continue;

        let querySegment = seg;
        let queryEthnicity = tableInfo.ethnicity;

        if (tableInfo.source === 'CAPS') {
          querySegment = 'NA';
          queryEthnicity = 'NA';
        }

        const { data: rows } = await supabase
          .from('cimt_norms')
          .select('*')
          .eq('source', tableInfo.source)
          .eq('segment', querySegment)
          .eq('sex', sexKey)
          .eq('ethnicity', queryEthnicity);

        if (!rows || rows.length === 0) continue;

        let thresholds: Thresholds | null = null;
        if (tableInfo.source === 'MESA') {
          thresholds = findBand(rows as NormRow[], ageDecimal);
        } else {
          thresholds = interpolatePoint(rows as NormRow[], ageDecimal);
        }

        if (!thresholds) continue;

        const { range, isAboveP75 } = estimatePercentile(valueMm, thresholds);
        sides.push({
          side: seg,
          valueMm,
          percentileRange: range,
          isAboveP75,
          plaqueByThickness: valueMm > 1.5,
          thresholds,
        });
      }

      if (sides.length === 0) {
        toast({ title: 'Erro', description: 'Não foi possível calcular. Verifique os dados.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Worst side
      const worst = sides.reduce((a, b) =>
        (PERCENTILE_RANK[a.percentileRange] ?? 0) >= (PERCENTILE_RANK[b.percentileRange] ?? 0) ? a : b
      );

      const hasPlaque = sides.some(s => s.plaqueByThickness);

      const SOURCE_LABELS: Record<string, string> = { ELSA: 'ELSA-Brasil', CAPS: 'CAPS', MESA: 'MESA' };

      setResult({
        tableUsed: SOURCE_LABELS[tableInfo.source] || tableInfo.source,
        sides,
        worstSide: worst,
        hasPlaque,
      });

      logToolUsage('cimt-percentile', {
        age: ageDecimal, sex: sexKey, ethnicity,
        ccd: ccdMm, cce: cceMm, table: tableInfo.source,
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Falha ao buscar dados normativos.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const parts: string[] = [];
    parts.push('Espessura médio-intimal média:');
    result.sides.forEach(s => {
      const status = s.isAboveP75 ? 'acima do P75' : 'abaixo do P75';
      parts.push(`${s.side} = ${s.valueMm.toFixed(2)} mm (faixa ${s.percentileRange}; ${status}).`);
    });
    parts.push(`Percentil final considerado: ${result.worstSide.side} (${result.worstSide.percentileRange}).`);
    parts.push(`Tabela normativa utilizada: ${result.tableUsed}.`);
    if (result.hasPlaque) parts.push('Critério de placa por espessura (CMI > 1,5 mm).');

    navigator.clipboard.writeText(parts.join(' '));
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Percentil do Complexo Médio-Intimal (CMI/IMT)
          </h1>
          <p className="text-sm text-muted-foreground">
            Tabelas ELSA-Brasil, CAPS e MESA — Posicionamento DIC/SBC 2019
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Idade (anos)</Label>
              <Input type="number" min="0" max="120" value={ageYears} onChange={e => setAgeYears(e.target.value)} placeholder="Ex: 55" />
            </div>
            <div className="space-y-2">
              <Label>Meses (0–11)</Label>
              <Input type="number" min="0" max="11" value={ageMonths} onChange={e => setAgeMonths(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etnia</Label>
              <Select value={ethnicity} onValueChange={setEthnicity}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ETHNICITY_OPTIONS.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <CardTitle className="text-base">Medidas do Exame</CardTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IMT/CMI — CCD (mm)</Label>
              <Input type="number" step="0.01" min="0" value={ccdMm} onChange={e => setCcdMm(e.target.value)} placeholder="Ex: 0.65" />
            </div>
            <div className="space-y-2">
              <Label>IMT/CMI — CCE (mm)</Label>
              <Input type="number" step="0.01" min="0" value={cceMm} onChange={e => setCceMm(e.target.value)} placeholder="Ex: 0.72" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="plaque" checked={hasFocalPlaque} onCheckedChange={(c) => setHasFocalPlaque(c === true)} />
              <Label htmlFor="plaque" className="text-sm cursor-pointer">Placa focal no local da medida?</Label>
            </div>
            {hasFocalPlaque && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox id="include-plaque" checked={includePlaqueInValue} onCheckedChange={(c) => setIncludePlaqueInValue(c === true)} />
                <Label htmlFor="include-plaque" className="text-sm cursor-pointer">Incluir placa no valor medido</Label>
              </div>
            )}
          </div>

          {warnings.length > 0 && (
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                {warnings.map((w, i) => <span key={i}>{w} </span>)}
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleCalculate} disabled={!canCalculate || loading} className="w-full" size="lg">
            {loading ? 'Calculando...' : 'Calcular percentil'}
          </Button>
        </CardContent>
      </Card>

      {/* No table fallback */}
      {noTable && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sem tabela normativa aplicável para esta combinação de idade ({ageDecimal.toFixed(1)} anos) / etnia ({ETHNICITY_MAP_DISPLAY[ethnicity] || ethnicity}). Selecione outra etnia ou revise a idade.
          </AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Resultado
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" /> Copiar para laudo
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tabela utilizada:</span>
              <Badge variant="secondary">{result.tableUsed}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.sides.map(s => (
                <div key={s.side} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{s.side}</span>
                    <Badge variant={s.isAboveP75 ? 'destructive' : 'default'}>
                      {s.isAboveP75 ? 'Aumentado' : 'Normal'}
                    </Badge>
                  </div>
                  <p className="text-sm">Valor: <strong>{s.valueMm.toFixed(2)} mm</strong></p>
                  <p className="text-sm">Faixa: <strong>{s.percentileRange}</strong></p>
                  <p className="text-xs text-muted-foreground">
                    P25={s.thresholds.p25.toFixed(2)} | P50={s.thresholds.p50.toFixed(2)} | P75={s.thresholds.p75.toFixed(2)}
                    {s.thresholds.p90 !== undefined && ` | P90=${s.thresholds.p90.toFixed(2)}`}
                  </p>
                  {s.plaqueByThickness && (
                    <Badge variant="destructive" className="text-xs">CMI &gt; 1,5 mm</Badge>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Percentil final (pior lado):</span>
              <Badge variant={result.worstSide.isAboveP75 ? 'destructive' : 'default'}>
                {result.worstSide.side} — {result.worstSide.percentileRange}
                {result.worstSide.isAboveP75 && ' (Aumentado acima do P75)'}
              </Badge>
            </div>

            {result.hasPlaque && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  Critério de placa por espessura (CMI &gt; 1,5 mm) em pelo menos um lado.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* About */}
      <Alert className="bg-muted border-muted">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs text-muted-foreground">
          <strong>Referência:</strong> Posicionamento de Ultrassonografia Vascular do DIC/SBC – 2019. Tabelas ELSA-Brasil (40–65 anos, Branco/Pardo/Negro), CAPS (25–85 anos, sem estratificação por etnia) e MESA (45–84 anos, Branco/Negro/Chinês/Hispânico). Percentil final: maior valor entre os lados. Aumentado: acima do P75 para sexo/idade/etnia. Placa: CMI &gt; 1,5 mm.
        </AlertDescription>
      </Alert>

      <p className="text-xs text-muted-foreground text-center">
        Ferramenta de suporte à decisão. Valores variam conforme técnica, biotipo e contexto clínico. Não substitui julgamento clínico.
      </p>
    </div>
  );
}
