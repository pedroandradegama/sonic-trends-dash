import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, RotateCcw, ClipboardCheck, Ruler } from 'lucide-react';
import { toast } from 'sonner';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { calculateTesticularPercentile, PercentileResult } from './percentileData';

const LS_KEY = 'ped-volume-testicular-last';

export function TesticularTab() {
  const [age, setAge] = useState('');
  const [volume, setVolume] = useState('');
  const [result, setResult] = useState<PercentileResult | null>(null);

  // Load last values from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const { age: a, volume: v } = JSON.parse(saved);
        if (a) setAge(a);
        if (v) setVolume(v);
      }
    } catch {}
  }, []);

  function handleCalculate() {
    const ageVal = parseFloat(age);
    const volVal = parseFloat(volume);
    if (isNaN(ageVal) || isNaN(volVal) || ageVal <= 0 || volVal <= 0) return;

    const r = calculateTesticularPercentile(ageVal, volVal);
    if (!r) {
      toast.error('Idade fora da faixa disponível (0,5–10 anos).');
      return;
    }
    setResult(r);
    localStorage.setItem(LS_KEY, JSON.stringify({ age, volume }));
    logToolUsage('ped-volume-testicular', { age: ageVal, volume: volVal });
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.laudoText);
    toast.success('Texto copiado para a área de transferência');
  }

  function handleClear() {
    setAge('');
    setVolume('');
    setResult(null);
  }

  const canCalculate = age && volume && parseFloat(age) > 0 && parseFloat(volume) > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            Dados do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="test-age" className="text-xs text-muted-foreground">Idade (anos)</Label>
            <Input
              id="test-age"
              type="number"
              step="0.5"
              min={0}
              max={10}
              placeholder="Ex: 5"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Faixa: 0,5 a 10 anos</p>
          </div>
          <div>
            <Label htmlFor="test-vol" className="text-xs text-muted-foreground">Volume (mL)</Label>
            <Input
              id="test-vol"
              type="number"
              step="0.1"
              min={0}
              placeholder="Ex: 0.8"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Preparado para bilateralidade futura (D/E)</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleCalculate} disabled={!canCalculate} className="flex-1">
              Calcular
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
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
                <ClassificationBadge classification={result.classification} />
                <Badge variant="outline" className="text-sm">
                  ~p{result.estimatedPercentile}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                {result.p3 != null && <p>P3: <span className="font-medium text-foreground">{result.p3} mL</span></p>}
                <p>P50: <span className="font-medium text-foreground">{result.p50} mL</span></p>
                <p>P97: <span className="font-medium text-foreground">{result.p97} mL</span></p>
                <p>Faixa etária: <span className="font-medium text-foreground">{result.ageRange}</span></p>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-foreground leading-relaxed">{result.laudoText}</p>
              </div>

              <Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copiar texto do laudo
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <p>Preencha os dados e clique em <strong>Calcular</strong>.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClassificationBadge({ classification }: { classification: string }) {
  switch (classification) {
    case 'normal':
      return <Badge className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white text-sm px-3 py-1">Normal</Badge>;
    case 'below':
      return <Badge className="bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90 text-white text-sm px-3 py-1">Abaixo do P3</Badge>;
    case 'above':
      return <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm px-3 py-1">Acima do P97</Badge>;
    default:
      return null;
  }
}
