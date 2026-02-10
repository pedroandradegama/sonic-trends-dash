import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function PVRTab() {
  const [postL, setPostL] = useState('');
  const [postW, setPostW] = useState('');
  const [postH, setPostH] = useState('');
  const [preL, setPreL] = useState('');
  const [preW, setPreW] = useState('');
  const [preH, setPreH] = useState('');

  const calc = useMemo(() => {
    const pL = parseFloat(postL), pW = parseFloat(postW), pH = parseFloat(postH);
    if (!pL || !pW || !pH || pL <= 0 || pW <= 0 || pH <= 0) return null;
    const pvr = pL * pW * pH * 0.52;

    let preVol: number | null = null;
    const preLv = parseFloat(preL), preWv = parseFloat(preW), preHv = parseFloat(preH);
    if (preLv > 0 && preWv > 0 && preHv > 0) {
      preVol = preLv * preWv * preHv * 0.52;
    }

    let classification: string;
    let color: string;
    if (pvr < 50) { classification = 'Adequado'; color = 'text-[hsl(var(--success))]'; }
    else if (pvr < 200) { classification = 'Resíduo aumentado'; color = 'text-[hsl(var(--warning))]'; }
    else { classification = 'Esvaziamento inadequado'; color = 'text-destructive'; }

    return { pvr: Math.round(pvr * 10) / 10, preVol: preVol ? Math.round(preVol * 10) / 10 : null, classification, color };
  }, [postL, postW, postH, preL, preW, preH]);

  const reportText = useMemo(() => {
    if (!calc) return '';
    return `Bexiga (US): resíduo pós-miccional estimado em ${calc.pvr} mL (fórmula elipsoide). ${calc.classification}.`;
  }, [calc]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    toast.success('Texto copiado.');
    logToolUsage('pvr', { pvr_ml: calc?.pvr });
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medidas Pós-miccionais</CardTitle>
          <CardDescription>Insira as dimensões em cm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Comprimento (cm)</Label>
              <Input type="number" step="0.1" min="0" value={postL} onChange={e => setPostL(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Largura (cm)</Label>
              <Input type="number" step="0.1" min="0" value={postW} onChange={e => setPostW(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              <Input type="number" step="0.1" min="0" value={postH} onChange={e => setPostH(e.target.value)} />
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">Medidas Pré-miccionais (opcional)</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Comprimento (cm)</Label>
                <Input type="number" step="0.1" min="0" value={preL} onChange={e => setPreL(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Largura (cm)</Label>
                <Input type="number" step="0.1" min="0" value={preW} onChange={e => setPreW(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Altura (cm)</Label>
                <Input type="number" step="0.1" min="0" value={preH} onChange={e => setPreH(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {calc && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interpretação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {calc.preVol !== null && (
              <p className="text-sm text-muted-foreground">Volume pré-miccional: <strong>{calc.preVol} mL</strong></p>
            )}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-foreground">{calc.pvr} mL</span>
              <Badge variant="outline" className={calc.color}>{calc.classification}</Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>&lt;50 mL → adequado</p>
              <p>50–199 mL → resíduo aumentado</p>
              <p>≥200 mL → esvaziamento inadequado</p>
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
