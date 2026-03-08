import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Baby, Copy, RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import {
  calcBiometry, calcEFW, calcEFWCentile, getClinicalAlerts,
  type BiometryResult, type EFWResult
} from '@/lib/fetalGrowthCalc';

export default function FetalGrowthCalculatorPage() {
  const navigate = useNavigate();
  const { logUsage } = useToolUsageLog();

  const [weeks, setWeeks] = useState('');
  const [days, setDays] = useState('');
  const [hc, setHc] = useState('');
  const [ac, setAc] = useState('');
  const [fl, setFl] = useState('');
  const [calculated, setCalculated] = useState(false);

  const gaDecimal = useMemo(() => {
    const w = parseInt(weeks);
    const d = parseInt(days) || 0;
    if (isNaN(w) || w < 14 || w > 42) return null;
    return w + d / 7;
  }, [weeks, days]);

  const canCalculate = gaDecimal !== null && (hc || ac || fl);

  const [hcResult, setHcResult] = useState<BiometryResult | undefined>();
  const [acResult, setAcResult] = useState<BiometryResult | undefined>();
  const [flResult, setFlResult] = useState<BiometryResult | undefined>();
  const [efwResult, setEfwResult] = useState<EFWResult | undefined>();

  function handleCalculate() {
    if (!gaDecimal) return;
    const ga = gaDecimal;

    const hcR = hc ? calcBiometry('HC', parseFloat(hc), ga) : undefined;
    const acR = ac ? calcBiometry('AC', parseFloat(ac), ga) : undefined;
    const flR = fl ? calcBiometry('FL', parseFloat(fl), ga) : undefined;

    setHcResult(hcR);
    setAcResult(acR);
    setFlResult(flR);

    if (hc && ac && fl && ga >= 22) {
      const efw = calcEFW(parseFloat(hc), parseFloat(ac), parseFloat(fl));
      setEfwResult(calcEFWCentile(efw, ga));
    } else {
      setEfwResult(undefined);
    }

    setCalculated(true);
    logUsage('fetal-growth', { weeks, days, hc, ac, fl });
  }

  function handleClear() {
    setWeeks(''); setDays(''); setHc(''); setAc(''); setFl('');
    setHcResult(undefined); setAcResult(undefined); setFlResult(undefined); setEfwResult(undefined);
    setCalculated(false);
  }

  const alerts = useMemo(() => {
    if (!calculated) return [];
    return getClinicalAlerts(hcResult, acResult, flResult, efwResult, hc ? parseFloat(hc) : undefined, ac ? parseFloat(ac) : undefined);
  }, [calculated, hcResult, acResult, flResult, efwResult, hc, ac]);

  const reportText = useMemo(() => {
    if (!calculated || !gaDecimal) return '';
    const lines: string[] = [];
    const igStr = `${parseInt(weeks)}s${parseInt(days) || 0}d`;
    lines.push(`Crescimento Fetal — IG ${igStr}`);
    lines.push('');

    const addParam = (r: BiometryResult | undefined, label: string) => {
      if (!r) return;
      lines.push(`${label}: ${r.value_mm} mm — z=${r.z.toFixed(2)}, centil ${r.centile} (${r.classification})`);
      lines.push(`  Ref: P5=${r.p5} mm | P50=${r.p50} mm | P95=${r.p95} mm`);
    };
    addParam(hcResult, 'HC');
    addParam(acResult, 'AC');
    addParam(flResult, 'FL');

    if (efwResult) {
      lines.push('');
      lines.push(`EFW (Hadlock): ${efwResult.efw_g} g — z=${efwResult.z.toFixed(3)}, centil ${efwResult.centile} (${efwResult.classification})`);
      if (efwResult.ref) {
        const r = efwResult.ref;
        lines.push(`  Ref: P3=${r.p3} | P5=${r.p5} | P10=${r.p10} | P25=${r.p25} | P50=${r.p50} | P75=${r.p75} | P90=${r.p90} | P95=${r.p95} | P97=${r.p97}`);
      }
    }

    if (alerts.length > 0) {
      lines.push('');
      lines.push('Alertas:');
      alerts.forEach(a => lines.push(`  ⚠ ${a.text}`));
    }

    lines.push('');
    lines.push('Ref: Snijders & Nicolaides 1994; Hadlock 1985; Nicolaides et al. 2018');
    return lines.join('\n');
  }, [calculated, gaDecimal, weeks, days, hcResult, acResult, flResult, efwResult, alerts]);

  function handleCopy() {
    navigator.clipboard.writeText(reportText);
    toast.success('Texto copiado!');
  }

  const classColorMap = {
    destructive: 'bg-destructive/10 text-destructive border-destructive/30',
    warning: 'bg-warning/10 text-warning border-warning/30',
    success: 'bg-success/10 text-success border-success/30',
  };

  function renderBiometryCard(result: BiometryResult | undefined, label: string) {
    if (!result) return null;
    return (
      <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-foreground">{label}</span>
          <Badge variant="outline" className={classColorMap[result.classColor]}>
            {result.classification}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><span className="text-muted-foreground">Medido:</span> <span className="font-medium">{result.value_mm} mm</span></div>
          <div><span className="text-muted-foreground">Z-score:</span> <span className="font-medium">{result.z.toFixed(2)}</span></div>
          <div><span className="text-muted-foreground">Centil:</span> <span className="font-medium">{result.centile}</span></div>
        </div>
        <div className="text-xs text-muted-foreground">
          Ref: P5={result.p5} mm | P50={result.p50} mm | P95={result.p95} mm
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas-ia')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Baby className="h-6 w-6 text-primary" />
            Crescimento Fetal
          </h1>
          <p className="text-sm text-muted-foreground">Biometria e peso fetal estimado com percentis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Idade Gestacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Semanas</Label>
                <Input type="number" min={14} max={42} value={weeks} onChange={e => { setWeeks(e.target.value); setCalculated(false); }} placeholder="14–42" />
              </div>
              <div>
                <Label>Dias</Label>
                <Input type="number" min={0} max={6} value={days} onChange={e => { setDays(e.target.value); setCalculated(false); }} placeholder="0–6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Biometria (mm)</CardTitle>
            <CardDescription>Preencha os parâmetros disponíveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Circunferência Cefálica (HC)</Label>
              <Input type="number" step="0.1" value={hc} onChange={e => { setHc(e.target.value); setCalculated(false); }} placeholder="mm" />
            </div>
            <div>
              <Label>Circunferência Abdominal (AC)</Label>
              <Input type="number" step="0.1" value={ac} onChange={e => { setAc(e.target.value); setCalculated(false); }} placeholder="mm" />
            </div>
            <div>
              <Label>Comprimento do Fêmur (FL)</Label>
              <Input type="number" step="0.1" value={fl} onChange={e => { setFl(e.target.value); setCalculated(false); }} placeholder="mm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" disabled={!canCalculate} onClick={handleCalculate}>
              Calcular
            </Button>
            <Button variant="outline" className="w-full" onClick={handleClear}>
              <RotateCcw className="h-4 w-4 mr-2" /> Limpar
            </Button>
            {calculated && reportText && (
              <Button variant="secondary" className="w-full" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" /> Copiar texto
              </Button>
            )}
            {hc && ac && fl && gaDecimal && gaDecimal < 22 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>EFW disponível a partir de 22 semanas.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {calculated && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {/* Alerts */}
          {alerts.length > 0 && (
            <Card className="border-warning/40">
              <CardContent className="pt-4 space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${a.severity === 'destructive' ? 'text-destructive' : 'text-warning'}`}>
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {a.text}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {alerts.length === 0 && (hcResult || acResult || flResult) && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Todos os parâmetros dentro da normalidade.
            </div>
          )}

          {/* Biometry Results */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Biometria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderBiometryCard(hcResult, 'HC — Circunferência Cefálica')}
              {renderBiometryCard(acResult, 'AC — Circunferência Abdominal')}
              {renderBiometryCard(flResult, 'FL — Comprimento do Fêmur')}
              {!hcResult && !acResult && !flResult && (
                <p className="text-sm text-muted-foreground">Nenhum parâmetro biométrico preenchido.</p>
              )}
            </CardContent>
          </Card>

          {/* EFW */}
          {efwResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Peso Fetal Estimado (EFW — Hadlock 1985)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-foreground text-lg">{efwResult.efw_g} g</span>
                    <Badge variant="outline" className={classColorMap[efwResult.classColor]}>
                      {efwResult.classification}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Z-score:</span> <span className="font-medium">{efwResult.z.toFixed(3)}</span></div>
                    <div><span className="text-muted-foreground">Centil:</span> <span className="font-medium">{efwResult.centile}</span></div>
                  </div>
                  {efwResult.ref && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
                      {(['p3','p5','p10','p25','p50','p75','p90','p95','p97'] as const).map(k => (
                        <div key={k} className="text-center">
                          <div className="font-medium text-foreground">{efwResult.ref![k]}</div>
                          <div>{k.toUpperCase()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* References */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border/40">
        <p><strong>Referências:</strong></p>
        <p>1. Snijders RJM & Nicolaides KH. <em>Ultrasound Obstet Gynecol</em> 1994; 4:34–48</p>
        <p>2. Hadlock FP et al. <em>AJR</em> 1985; 151:333–337</p>
        <p>3. Nicolaides KH et al. <em>Ultrasound Obstet Gynecol</em> 2018; doi:10.1002/uog.19073</p>
        <p className="pt-2 italic">Ferramenta de apoio. Não substitui avaliação clínica.</p>
      </div>
    </div>
  );
}
