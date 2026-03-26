import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Copy, Save, Info, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  MenopausalStatus,
  LesionInput,
  LesionType,
  ClassicBenignType,
  LesionSide,
  WallSurface,
  ColorScore,
  ORADSResult,
  classifyExam,
  generateReportText,
} from './oradsClassifier';

const MENO_OPTIONS: { value: MenopausalStatus; label: string }[] = [
  { value: 'premenopausal', label: 'Pré-menopausa' },
  { value: 'postmeno_early', label: 'Pós-menopausa precoce (<5 anos)' },
  { value: 'postmeno_late', label: 'Pós-menopausa tardia (≥5 anos)' },
  { value: 'uncertain', label: 'Incerto' },
];

const LESION_TYPES: { value: LesionType; label: string }[] = [
  { value: 'simple_cyst', label: 'Cisto simples' },
  { value: 'bilocular_cyst', label: 'Cisto bilocular' },
  { value: 'unilocular_not_simple', label: 'Cisto unilocular NÃO simples (ecos internos / septações incompletas)' },
  { value: 'multilocular_cyst', label: 'Cisto multilocular' },
  { value: 'cyst_with_solid', label: 'Cisto com componente sólido' },
  { value: 'solid', label: 'Lesão sólida' },
  { value: 'classic_benign', label: 'Lesão extraovariana/ovariana típica (clássica benigna)' },
  { value: 'normal', label: 'Sem lesão / ovário normal' },
  { value: 'incomplete', label: 'Exame incompleto / não caracterizável' },
];

const CLASSIC_BENIGN_OPTIONS: { value: ClassicBenignType; label: string }[] = [
  { value: 'hemorrhagic', label: 'Hemorrágico típico' },
  { value: 'dermoid', label: 'Dermoide típico' },
  { value: 'endometrioma', label: 'Endometrioma típico' },
  { value: 'paraovarian', label: 'Cisto paraovariano típico' },
  { value: 'peritoneal_inclusion', label: 'Cisto de inclusão peritoneal típico' },
  { value: 'hydrosalpinx', label: 'Hidrossalpinge típica' },
];

const needsDescriptors = (t: LesionType) =>
  !['simple_cyst', 'classic_benign', 'normal', 'incomplete'].includes(t);

const needsSolidFields = (t: LesionType) =>
  ['cyst_with_solid', 'solid'].includes(t);

function createEmptyLesion(): LesionInput {
  return {
    id: crypto.randomUUID(),
    side: 'right',
    maxDiameter: 0,
    type: 'simple_cyst',
    wallSurface: 'smooth',
    papillaeCount: '0',
    hasSolidComponent: false,
    solidIsPapilla: false,
    solidContour: 'smooth',
    hasShadowing: false,
    colorScore: 1,
    hasAscitesOrPeritonealNodules: false,
    hasFocalPlaque: false,
  };
}

function scoreBadgeColor(score: number) {
  if (score <= 1) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (score === 2) return 'bg-sky-100 text-sky-800 border-sky-300';
  if (score === 3) return 'bg-amber-100 text-amber-800 border-amber-300';
  if (score === 4) return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

export default function ORADSCalculatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meno, setMeno] = useState<MenopausalStatus | ''>('');
  const [lesions, setLesions] = useState<LesionInput[]>([createEmptyLesion()]);
  const [result, setResult] = useState<ORADSResult | null>(null);
  const [saving, setSaving] = useState(false);

  const updateLesion = (idx: number, patch: Partial<LesionInput>) => {
    setLesions(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };

  const addLesion = () => setLesions(prev => [...prev, createEmptyLesion()]);
  const removeLesion = (idx: number) => {
    if (lesions.length <= 1) return;
    setLesions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCalculate = () => {
    if (!meno) {
      toast({ title: 'Status menopausal obrigatório', variant: 'destructive' });
      return;
    }
    for (const l of lesions) {
      if (l.type !== 'normal' && l.type !== 'incomplete' && (!l.maxDiameter || l.maxDiameter <= 0)) {
        toast({ title: 'Diâmetro obrigatório para cada lesão', variant: 'destructive' });
        return;
      }
    }
    const res = classifyExam(lesions, meno as MenopausalStatus);
    setResult(res);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = generateReportText(result);
    navigator.clipboard.writeText(text);
    toast({ title: 'Texto copiado para a área de transferência' });
  };

  const handleSave = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('orads_us_lesions').insert({
        user_id: user.id,
        menopausal_status: meno,
        payload: lesions as any,
        result: result as any,
      });
      if (error) throw error;
      toast({ title: 'Salvo no histórico com sucesso' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calculadora O-RADS US (v2022)</h1>
            <p className="text-muted-foreground text-sm">
              Classificação O-RADS 0–5 com recomendação de conduta — ACR v2022
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Recomendações servem como guia e podem ser modificadas por risco individual e fatores clínicos.</span>
        </div>

        {/* Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Dados do paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Label>Status menopausal *</Label>
              <Select value={meno} onValueChange={(v) => setMeno(v as MenopausalStatus)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {MENO_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lesions */}
        {lesions.map((lesion, idx) => (
          <Card key={lesion.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Lesão {idx + 1}</CardTitle>
                {lesions.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeLesion(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Lado</Label>
                  <Select value={lesion.side} onValueChange={(v) => updateLesion(idx, { side: v as LesionSide })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right">Direita</SelectItem>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="indeterminate">Indeterminado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Maior diâmetro (cm) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={lesion.maxDiameter || ''}
                    onChange={(e) => updateLesion(idx, { maxDiameter: parseFloat(e.target.value) || 0 })}
                    disabled={lesion.type === 'normal' || lesion.type === 'incomplete'}
                  />
                </div>
                <div>
                  <Label>Tipo principal *</Label>
                  <Select value={lesion.type} onValueChange={(v) => updateLesion(idx, { type: v as LesionType, classicBenignType: undefined })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LESION_TYPES.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Classic benign sub-type */}
              {lesion.type === 'classic_benign' && (
                <div className="max-w-xs">
                  <Label>Tipo clássico</Label>
                  <Select value={lesion.classicBenignType || ''} onValueChange={(v) => updateLesion(idx, { classicBenignType: v as ClassicBenignType })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {CLASSIC_BENIGN_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Descriptors for non-classic, non-simple */}
              {needsDescriptors(lesion.type) && (
                <>
                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Descritores morfológicos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Parede / Septos</Label>
                      <Select value={lesion.wallSurface || 'smooth'} onValueChange={(v) => updateLesion(idx, { wallSurface: v as WallSurface })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smooth">Liso</SelectItem>
                          <SelectItem value="irregular">Irregular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Color Score (Doppler)</Label>
                      <Select
                        value={String(lesion.colorScore ?? 1)}
                        onValueChange={(v) => updateLesion(idx, { colorScore: Number(v) as ColorScore })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">CS 1 — Sem fluxo</SelectItem>
                          <SelectItem value="2">CS 2 — Mínimo</SelectItem>
                          <SelectItem value="3">CS 3 — Moderado</SelectItem>
                          <SelectItem value="4">CS 4 — Muito intenso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {needsSolidFields(lesion.type) && (
                      <>
                        <div>
                          <Label>Papilas (projeções papilares)</Label>
                          <Select value={lesion.papillaeCount ?? '0'} onValueChange={(v) => updateLesion(idx, { papillaeCount: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Nenhuma</SelectItem>
                              <SelectItem value="1-3">1–3</SelectItem>
                              <SelectItem value=">=4">≥4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Contorno do sólido</Label>
                          <Select value={lesion.solidContour ?? 'smooth'} onValueChange={(v) => updateLesion(idx, { solidContour: v as WallSurface })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="smooth">Liso</SelectItem>
                              <SelectItem value="irregular">Irregular</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {lesion.type === 'solid' && (
                      <div>
                        <Label>Contorno do sólido</Label>
                        <Select value={lesion.solidContour ?? 'smooth'} onValueChange={(v) => updateLesion(idx, { solidContour: v as WallSurface })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="smooth">Liso</SelectItem>
                            <SelectItem value="irregular">Irregular</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-6">
                    {(lesion.type === 'solid' || needsSolidFields(lesion.type)) && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`shadow-${idx}`}
                          checked={lesion.hasShadowing ?? false}
                          onCheckedChange={(v) => updateLesion(idx, { hasShadowing: !!v })}
                        />
                        <Label htmlFor={`shadow-${idx}`}>Shadowing difuso/amplo</Label>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`ascites-${idx}`}
                        checked={lesion.hasAscitesOrPeritonealNodules ?? false}
                        onCheckedChange={(v) => updateLesion(idx, { hasAscitesOrPeritonealNodules: !!v })}
                      />
                      <Label htmlFor={`ascites-${idx}`}>Ascite e/ou nódulos peritoneais</Label>
                    </div>
                  </div>
                </>
              )}

              {/* Ascites for simple cyst too */}
              {lesion.type === 'simple_cyst' && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`ascites-s-${idx}`}
                    checked={lesion.hasAscitesOrPeritonealNodules ?? false}
                    onCheckedChange={(v) => updateLesion(idx, { hasAscitesOrPeritonealNodules: !!v })}
                  />
                  <Label htmlFor={`ascites-s-${idx}`}>Ascite e/ou nódulos peritoneais</Label>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3">
          <Button variant="outline" onClick={addLesion}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar lesão
          </Button>
          <Button onClick={handleCalculate}>Calcular O-RADS</Button>
        </div>

        {/* Results */}
        {result && (
          <Card className="border-2 border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Resultado O-RADS US (v2022)</CardTitle>
              <CardDescription>Classificação e conduta sugerida</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Per-lesion table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3">Lesão</th>
                      <th className="py-2 pr-3">Lado</th>
                      <th className="py-2 pr-3">Tam.</th>
                      <th className="py-2 pr-3">O-RADS</th>
                      <th className="py-2 pr-3">Risco</th>
                      <th className="py-2">Conduta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lesions.map((l, i) => (
                      <tr key={l.lesionId} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{i + 1}</td>
                        <td className="py-2 pr-3">{l.side === 'right' ? 'D' : l.side === 'left' ? 'E' : 'Ind.'}</td>
                        <td className="py-2 pr-3">{l.maxDiameter} cm</td>
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreBadgeColor(l.oradsScore)}`}>
                            O-RADS {l.oradsScore}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-xs">{l.riskBucket}</td>
                        <td className="py-2 text-xs">{l.managementImaging}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator />

              {/* Final */}
              <div className="flex items-center gap-3">
                <span className="font-semibold">Resultado final:</span>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${scoreBadgeColor(result.finalScore)}`}>
                  O-RADS {result.finalScore}
                </span>
                <span className="text-sm text-muted-foreground">{result.finalRiskBucket}</span>
              </div>

              <div className="text-sm space-y-1">
                <p><strong>Conduta de imagem:</strong> {result.finalManagementImaging}</p>
                <p><strong>Conduta clínica:</strong> {result.finalManagementClinical}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar texto para laudo
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar no histórico'}
                </Button>
              </div>

              {/* About section */}
              <Separator />
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer flex items-center gap-1 font-medium">
                  <Info className="h-3 w-3" /> Sobre / Referências
                </summary>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li>O-RADS US Risk Stratification and Management System — Radiology 2020.</li>
                  <li>O-RADS US v2022 Update — Radiology 2023.</li>
                  <li>O-RADS US v2022 Assessment Categories + Classic Benign Lesions — ACR Release Nov 2022.</li>
                  <li>O-RADS: A User's Guide — AJR 2021.</li>
                </ul>
              </details>
            </CardContent>
          </Card>
        )}
      </div>
    
  );
}
