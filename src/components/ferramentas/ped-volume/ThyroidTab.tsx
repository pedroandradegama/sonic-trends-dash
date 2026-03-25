import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, RotateCcw, ClipboardCheck, Ruler } from 'lucide-react';
import { toast } from 'sonner';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { calculateThyroidPercentile, PercentileResult } from './percentileData';

const LS_KEY = 'ped-volume-thyroid-last';

export function ThyroidTab() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
  const [volume, setVolume] = useState('');
  const [result, setResult] = useState<PercentileResult | null>(null);

  const ageVal = parseFloat(age) || 0;
  const needsSex = ageVal > 5;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const { age: a, sex: s, volume: v } = JSON.parse(saved);
        if (a) setAge(a);
        if (s) setSex(s);
        if (v) setVolume(v);
      }
    } catch {}
  }, []);

  function handleCalculate() {
    const a = parseFloat(age);
    const v = parseFloat(volume);
    if (isNaN(a) || isNaN(v) || a < 0 || v <= 0) return;
    if (needsSex && !sex) {
      toast.error('Selecione o sexo para idade ≥ 6 anos.');
      return;
    }

    const r = calculateThyroidPercentile(a, v, sex as 'M' | 'F' | undefined);
    if (!r) {
      toast.error('Idade fora da faixa disponível (0–12 anos).');
      return;
    }
    setResult(r);
    localStorage.setItem(LS_KEY, JSON.stringify({ age, sex, volume }));
    logToolUsage('ped-volume-thyroid', { age: a, sex, volume: v });
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.laudoText);
    toast.success('Texto copiado para a área de transferência');
  }

  function handleClear() {
    setAge('');
    setSex('');
    setVolume('');
    setResult(null);
  }

  const canCalculate = age && volume && parseFloat(volume) > 0 && (!needsSex || sex);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            Dados do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="thy-age" className="text-xs text-muted-foreground">Idade (anos)</Label>
            <Input
              id="thy-age"
              type="number"
              step="0.5"
              min={0}
              max={12}
              placeholder="Ex: 7"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Faixa: 0 a 12 anos</p>
          </div>

          {needsSex && (
            <div>
              <Label className="text-xs text-muted-foreground">Sexo</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as 'M' | 'F')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Necessário para idade ≥ 6 anos</p>
            </div>
          )}

          <div>
            <Label htmlFor="thy-vol" className="text-xs text-muted-foreground">Volume (mL)</Label>
            <Input
              id="thy-vol"
              type="number"
              step="0.1"
              min={0}
              placeholder="Ex: 3.5"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
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
    case 'above':
      return <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm px-3 py-1">Acima do P97</Badge>;
    default:
      return null;
  }
}
