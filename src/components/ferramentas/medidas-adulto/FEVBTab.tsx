import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function FEVBTab() {
  const [basalL, setBasalL] = useState('');
  const [basalW, setBasalW] = useState('');
  const [basalH, setBasalH] = useState('');
  const [postL, setPostL] = useState('');
  const [postW, setPostW] = useState('');
  const [postH, setPostH] = useState('');
  const [stimulus, setStimulus] = useState('nao_informado');

  const calc = useMemo(() => {
    const bL = parseFloat(basalL), bW = parseFloat(basalW), bH = parseFloat(basalH);
    const pL = parseFloat(postL), pW = parseFloat(postW), pH = parseFloat(postH);
    if (!bL || !bW || !bH || !pL || !pW || !pH || bL <= 0 || bW <= 0 || bH <= 0 || pL <= 0 || pW <= 0 || pH <= 0) return null;

    const v0 = bL * bW * bH * 0.52;
    const vt = pL * pW * pH * 0.52;
    if (v0 <= 0) return null;
    const fevb = ((v0 - vt) / v0) * 100;

    let classification: string;
    let color: string;
    if (fevb >= 40) { classification = 'Preservada'; color = 'text-[hsl(var(--success))]'; }
    else if (fevb >= 35) { classification = 'Limítrofe'; color = 'text-[hsl(var(--warning))]'; }
    else { classification = 'Reduzida'; color = 'text-destructive'; }

    return {
      v0: Math.round(v0 * 10) / 10,
      vt: Math.round(vt * 10) / 10,
      fevb: Math.round(fevb * 10) / 10,
      classification,
      color,
    };
  }, [basalL, basalW, basalH, postL, postW, postH]);

  const stimulusLabel = stimulus === 'refeicao' ? 'Refeição gordurosa' : stimulus === 'cck' ? 'CCK' : 'Não informado';

  const reportText = useMemo(() => {
    if (!calc) return '';
    return `Vesícula biliar (US seriado): volume basal ${calc.v0} mL e volume pós-estímulo ${calc.vt} mL (fórmula elipsoide). Fração de ejeção vesicular: ${calc.fevb}%. ${calc.classification}. Estímulo: ${stimulusLabel}.`;
  }, [calc, stimulusLabel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    toast.success('Texto copiado.');
    logToolUsage('fevb', { v0: calc?.v0, vt: calc?.vt, fevb: calc?.fevb });
  };

  const DimensionInputs = ({ prefix, l, w, h, setL, setW, setH }: {
    prefix: string; l: string; w: string; h: string;
    setL: (v: string) => void; setW: (v: string) => void; setH: (v: string) => void;
  }) => (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Comprimento (cm)</Label>
        <Input type="number" step="0.1" min="0" value={l} onChange={e => setL(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Largura (cm)</Label>
        <Input type="number" step="0.1" min="0" value={w} onChange={e => setW(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Altura (cm)</Label>
        <Input type="number" step="0.1" min="0" value={h} onChange={e => setH(e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volumes da Vesícula Biliar</CardTitle>
          <CardDescription>Insira as dimensões em cm</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Volume Basal (jejum)</p>
            <DimensionInputs prefix="basal" l={basalL} w={basalW} h={basalH} setL={setBasalL} setW={setBasalW} setH={setBasalH} />
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Volume Pós-estímulo</p>
            <DimensionInputs prefix="post" l={postL} w={postW} h={postH} setL={setPostL} setW={setPostW} setH={setPostH} />
          </div>
          <div className="space-y-2">
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

      {calc && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interpretação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p className="text-muted-foreground">V0 (basal): <strong className="text-foreground">{calc.v0} mL</strong></p>
              <p className="text-muted-foreground">Vt (pós): <strong className="text-foreground">{calc.vt} mL</strong></p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-foreground">{calc.fevb}%</span>
              <Badge variant="outline" className={calc.color}>{calc.classification}</Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>≥40% → preservada</p>
              <p>35–39% → limítrofe</p>
              <p>&lt;35% → reduzida</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">{reportText}</div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
              <Copy className="h-3 w-3" /> Copiar texto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
