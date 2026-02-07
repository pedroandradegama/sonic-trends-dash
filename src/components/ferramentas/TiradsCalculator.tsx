import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useTiradsRules, useTiradsThresholds, TiradsRule, TiradsThreshold } from '@/hooks/useTiradsData';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { Copy, RotateCcw, ArrowLeft, Stethoscope, Calculator, ClipboardCheck, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CATEGORY_ORDER = ['composition', 'echogenicity', 'shape', 'margin', 'echogenic_foci'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  composition: 'Composição',
  echogenicity: 'Ecogenicidade',
  shape: 'Forma',
  margin: 'Margens',
  echogenic_foci: 'Focos Ecogênicos',
};

function getTrLevel(points: number): string {
  if (points === 0) return 'TR1';
  if (points === 2) return 'TR2';
  if (points === 3) return 'TR3';
  if (points >= 4 && points <= 6) return 'TR4';
  if (points >= 7) return 'TR5';
  return 'TR1'; // 1 point maps to TR1 per ACR
}

function getTrBadge(tr: string) {
  switch (tr) {
    case 'TR1':
      return <Badge className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white text-sm px-3 py-1">TR1 — Benigno</Badge>;
    case 'TR2':
      return <Badge className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white text-sm px-3 py-1">TR2 — Não suspeito</Badge>;
    case 'TR3':
      return <Badge className="bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90 text-white text-sm px-3 py-1">TR3 — Levemente suspeito</Badge>;
    case 'TR4':
      return <Badge className="bg-destructive/80 hover:bg-destructive/70 text-destructive-foreground text-sm px-3 py-1">TR4 — Moderadamente suspeito</Badge>;
    case 'TR5':
      return <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm px-3 py-1">TR5 — Altamente suspeito</Badge>;
    default:
      return null;
  }
}

export function TiradsCalculator() {
  const navigate = useNavigate();
  const { data: rules, isLoading: rulesLoading } = useTiradsRules();
  const { data: thresholds, isLoading: thresholdsLoading } = useTiradsThresholds();

  const [sizeCm, setSizeCm] = useState('');
  const [multipleNodules, setMultipleNodules] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [fociSelections, setFociSelections] = useState<Record<string, boolean>>({});

  const rulesByCategory = useMemo(() => {
    const map: Record<string, TiradsRule[]> = {};
    for (const rule of rules) {
      if (!map[rule.category_group]) map[rule.category_group] = [];
      map[rule.category_group].push(rule);
    }
    return map;
  }, [rules]);

  const totalPoints = useMemo(() => {
    let pts = 0;
    // Radio categories
    for (const cat of ['composition', 'echogenicity', 'shape', 'margin']) {
      const selectedKey = selections[cat];
      if (selectedKey) {
        const rule = rules.find(r => r.category_group === cat && r.option_key === selectedKey);
        if (rule) pts += rule.points;
      }
    }
    // Checkbox foci
    for (const [key, checked] of Object.entries(fociSelections)) {
      if (checked) {
        const rule = rules.find(r => r.category_group === 'echogenic_foci' && r.option_key === key);
        if (rule) pts += rule.points;
      }
    }
    return pts;
  }, [selections, fociSelections, rules]);

  const isComplete = useMemo(() => {
    return ['composition', 'echogenicity', 'shape', 'margin'].every(cat => !!selections[cat]);
  }, [selections]);

  const trLevel = useMemo(() => isComplete ? getTrLevel(totalPoints) : null, [isComplete, totalPoints]);

  const threshold = useMemo<TiradsThreshold | null>(() => {
    if (!trLevel) return null;
    return thresholds.find(t => t.tr_level === trLevel) || null;
  }, [trLevel, thresholds]);

  const conduct = useMemo(() => {
    if (!trLevel || !threshold) return null;
    const size = parseFloat(sizeCm);
    const hasSize = !isNaN(size) && size > 0;

    if (trLevel === 'TR1' || trLevel === 'TR2') {
      return 'Sem PAAF. Sem follow-up de rotina.';
    }

    if (!hasSize) {
      return 'Informe o tamanho para a recomendação de conduta.';
    }

    if (threshold.fna_min_cm !== null && size >= threshold.fna_min_cm) {
      return `Recomendar PAAF (≥ ${threshold.fna_min_cm} cm).`;
    }

    if (threshold.follow_up_min_cm !== null && size >= threshold.follow_up_min_cm) {
      return `Recomendar follow-up por US (≥ ${threshold.follow_up_min_cm} cm): ${threshold.follow_up_schedule || ''}.`;
    }

    return 'Sem PAAF e sem follow-up de rotina (abaixo do limiar por tamanho).';
  }, [trLevel, threshold, sizeCm]);

  const getSelectedLabels = () => {
    const labels: Record<string, string> = {};
    for (const cat of ['composition', 'echogenicity', 'shape', 'margin']) {
      const key = selections[cat];
      if (key) {
        const rule = rules.find(r => r.category_group === cat && r.option_key === key);
        labels[cat] = rule?.option_label || key;
      }
    }
    const fociLabels = Object.entries(fociSelections)
      .filter(([, checked]) => checked)
      .map(([key]) => {
        const rule = rules.find(r => r.category_group === 'echogenic_foci' && r.option_key === key);
        return rule?.option_label || key;
      });
    labels['echogenic_foci'] = fociLabels.length > 0 ? fociLabels.join(', ') : 'Nenhum';
    return labels;
  };

  const laudoText = useMemo(() => {
    if (!isComplete || !trLevel) return '';
    const labels = getSelectedLabels();
    const size = parseFloat(sizeCm);
    const sizeText = !isNaN(size) && size > 0 ? `${size}` : 'não informado';
    return `ACR TI-RADS: ${trLevel} (${totalPoints} pontos). Características: composição=${labels.composition || ''}; ecogenicidade=${labels.echogenicity || ''}; forma=${labels.shape || ''}; margens=${labels.margin || ''}; focos ecogênicos=${labels.echogenic_foci || ''}. Maior diâmetro: ${sizeText} cm. Conduta sugerida (ACR TI-RADS 2017): ${conduct || ''}.`;
  }, [isComplete, trLevel, totalPoints, sizeCm, conduct, selections, fociSelections, rules]);

  function handleCopy() {
    if (!laudoText) return;
    navigator.clipboard.writeText(laudoText);
    toast.success('Texto copiado para a área de transferência');
    logToolUsage('ti-rads', { tr: trLevel, points: totalPoints, size_cm: parseFloat(sizeCm) || null });
  }

  function handleClear() {
    setSizeCm('');
    setMultipleNodules(false);
    setSelections({});
    setFociSelections({});
  }

  function handleRadioSelect(category: string, optionKey: string) {
    setSelections(prev => ({ ...prev, [category]: optionKey }));
  }

  function handleFociToggle(optionKey: string) {
    setFociSelections(prev => {
      const next = { ...prev };
      // If selecting 'none_or_comet', clear others
      if (optionKey === 'none_or_comet') {
        return { none_or_comet: !prev.none_or_comet };
      }
      // If selecting something else, clear 'none_or_comet'
      delete next.none_or_comet;
      next[optionKey] = !prev[optionKey];
      return next;
    });
  }

  const getCategoryPoints = (cat: string): number => {
    if (cat === 'echogenic_foci') {
      let pts = 0;
      for (const [key, checked] of Object.entries(fociSelections)) {
        if (checked) {
          const rule = rules.find(r => r.category_group === 'echogenic_foci' && r.option_key === key);
          if (rule) pts += rule.points;
        }
      }
      return pts;
    }
    const selectedKey = selections[cat];
    if (!selectedKey) return 0;
    const rule = rules.find(r => r.category_group === cat && r.option_key === selectedKey);
    return rule?.points || 0;
  };

  if (rulesLoading || thresholdsLoading) {
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
          <h1 className="text-2xl font-bold text-foreground">US — Calculadora ACR TI-RADS (2017)</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Pontuação e categoria TI-RADS (TR1–TR5) com recomendação de conduta
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* CARD 1 — Dados do nódulo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Dados do Nódulo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="size-cm" className="text-xs text-muted-foreground">Maior diâmetro (cm)</Label>
              <Input
                id="size-cm"
                type="number"
                step={0.1}
                min={0}
                placeholder="0.0"
                value={sizeCm}
                onChange={(e) => setSizeCm(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={multipleNodules} onCheckedChange={setMultipleNodules} id="multiple" />
              <Label htmlFor="multiple" className="text-sm cursor-pointer">Múltiplos nódulos?</Label>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2 — Pontuação por características */}
        <Card className="xl:row-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Pontuação ACR TI-RADS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {CATEGORY_ORDER.map((cat) => {
              const catRules = rulesByCategory[cat] || [];
              const isMultiSelect = cat === 'echogenic_foci';
              const catPoints = getCategoryPoints(cat);

              return (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[cat]}</Label>
                    {(selections[cat] || Object.values(fociSelections).some(Boolean)) && cat !== 'echogenic_foci' ? (
                      <span className="text-xs text-muted-foreground">{catPoints} pt{catPoints !== 1 ? 's' : ''}</span>
                    ) : cat === 'echogenic_foci' && Object.values(fociSelections).some(Boolean) ? (
                      <span className="text-xs text-muted-foreground">{catPoints} pt{catPoints !== 1 ? 's' : ''}</span>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    {catRules.map((rule) => {
                      if (isMultiSelect) {
                        const isChecked = !!fociSelections[rule.option_key];
                        return (
                          <label
                            key={rule.option_key}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleFociToggle(rule.option_key)}
                            />
                            <span className="text-sm flex-1">{rule.option_label}</span>
                            <span className="text-xs text-muted-foreground font-mono">{rule.points} pt{rule.points !== 1 ? 's' : ''}</span>
                          </label>
                        );
                      }

                      const isSelected = selections[cat] === rule.option_key;
                      return (
                        <button
                          key={rule.option_key}
                          type="button"
                          onClick={() => handleRadioSelect(cat, rule.option_key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors text-left ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:bg-accent/50'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-primary' : 'border-muted-foreground/40'
                          }`}>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <span className="text-sm flex-1">{rule.option_label}</span>
                          <span className="text-xs text-muted-foreground font-mono">{rule.points} pt{rule.points !== 1 ? 's' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">{totalPoints} pontos</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClear} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CARD 3 — Resultado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isComplete && trLevel ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {getTrBadge(trLevel)}
                  <span className="text-sm text-muted-foreground">({totalPoints} pontos)</span>
                </div>
                {threshold?.note && (
                  <p className="text-sm text-muted-foreground">{threshold.note}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Selecione todas as categorias para ver o resultado.
              </p>
            )}
          </CardContent>
        </Card>

        {/* CARD 4 — Conduta */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Conduta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isComplete && trLevel && threshold ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {conduct}
                  </p>
                </div>

                {(trLevel !== 'TR1' && trLevel !== 'TR2') && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {threshold.follow_up_min_cm !== null && (
                      <p>Limiar de follow-up: <span className="font-medium text-foreground">{threshold.follow_up_min_cm} cm</span></p>
                    )}
                    {threshold.fna_min_cm !== null && (
                      <p>Limiar de PAAF: <span className="font-medium text-foreground">{threshold.fna_min_cm} cm</span></p>
                    )}
                    {threshold.follow_up_schedule && (
                      <p>Follow-up: <span className="font-medium text-foreground">{threshold.follow_up_schedule}</span></p>
                    )}
                  </div>
                )}

                {/* Report text */}
                {laudoText && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm text-foreground leading-relaxed">{laudoText}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar texto do laudo
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Complete a pontuação para ver a conduta recomendada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Fonte:</strong> ACR TI-RADS (Tessler et al., JACR 2017).</p>
            <p>Esta ferramenta é suporte à decisão e não substitui julgamento clínico.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
