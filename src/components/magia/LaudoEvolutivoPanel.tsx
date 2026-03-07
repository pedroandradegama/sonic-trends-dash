import { useState, useMemo } from 'react';
import { Activity, AlertTriangle, Loader2, Sparkles, TrendingUp, TrendingDown, Minus, Stethoscope, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ── Types ──
type ExamType = 'tireoide' | 'mama' | null;

interface ExamData {
  location: string;
  dimensions: string;
  date: string;
  // Mama fields
  shape?: string;
  margins?: string;
  orientation?: string;
  echogenicity?: string;
  posteriorFeatures?: string;
  calcifications?: string;
  // Tireoide fields
  composition?: string;
  tForm?: string;
  tMargins?: string;
  echogenicFoci?: string;
}

interface AnalysisResult {
  matchScore: number;
  confidence: 'alta' | 'moderada' | 'baixa';
  dimensionalChange: { status: 'aumento' | 'reducao' | 'estavel'; percentage: number; significant: boolean; prevMax: number; currMax: number };
  prevCategory: { name: string; level: number; color: string };
  currCategory: { name: string; level: number; color: string };
  alerts: string[];
  recommendation: string;
}

// ── Constants ──
const MAMA_SHAPES = ['Oval', 'Redonda', 'Irregular'];
const MAMA_MARGINS = ['Circunscritas', 'Obscurecidas', 'Microlobuladas', 'Indistintas', 'Espiculadas'];
const MAMA_ORIENTATION = ['Paralela', 'Não paralela'];
const MAMA_ECHO = ['Anecóica', 'Hiperecoica', 'Isoecoica', 'Hipoecoica', 'Complexa'];
const MAMA_POSTERIOR = ['Sem alteração', 'Reforço', 'Sombra', 'Padrão combinado'];
const MAMA_CALC = ['Ausentes', 'Dentro da massa', 'Fora da massa', 'Intraductais'];

const TIRADS_COMP = ['Cística', 'Predominantemente cística', 'Esponjiforme', 'Predominantemente sólida', 'Sólida'];
const TIRADS_ECHO = ['Anecoica', 'Hiperecoica/Isoecoica', 'Hipoecoica', 'Muito hipoecoica'];
const TIRADS_FORM = ['Mais largo que alto', 'Mais alto que largo'];
const TIRADS_MARGINS = ['Lisas', 'Mal definidas', 'Lobuladas/Irregulares', 'Extensão extratireoidiana'];
const TIRADS_FOCI = ['Nenhum', 'Macrocalcificações', 'Calcificações periféricas', 'Focos ecogênicos punctiformes'];

const TIRADS_CATEGORIES: Record<number, { name: string; risk: string; recommendation: string; color: string }> = {
  1: { name: 'TR1 - Benigno', risk: '< 2%', recommendation: 'Sem necessidade de PAAF', color: '#10b981' },
  2: { name: 'TR2 - Não suspeito', risk: '< 2%', recommendation: 'Sem necessidade de PAAF', color: '#10b981' },
  3: { name: 'TR3 - Levemente suspeito', risk: '5%', recommendation: 'PAAF se ≥ 2,5cm; Seguimento se ≥ 1,5cm', color: '#f59e0b' },
  4: { name: 'TR4 - Moderadamente suspeito', risk: '5-20%', recommendation: 'PAAF se ≥ 1,5cm; Seguimento se ≥ 1,0cm', color: '#f97316' },
  5: { name: 'TR5 - Altamente suspeito', risk: '> 20%', recommendation: 'PAAF se ≥ 1,0cm; Seguimento se ≥ 0,5cm', color: '#ef4444' },
};

const BIRADS_CATEGORIES: Record<number, { name: string; desc: string; recommendation: string; color: string }> = {
  2: { name: 'BI-RADS 2', desc: 'Achado benigno', recommendation: 'Rotina de rastreamento', color: '#10b981' },
  3: { name: 'BI-RADS 3', desc: 'Provavelmente benigno', recommendation: 'Controle em 6 meses', color: '#f59e0b' },
  4: { name: 'BI-RADS 4', desc: 'Achado suspeito', recommendation: 'Biópsia recomendada', color: '#f97316' },
  5: { name: 'BI-RADS 5', desc: 'Altamente sugestivo', recommendation: 'Biópsia necessária', color: '#ef4444' },
};

// ── Pill Selector ──
function PillSelector({ options, value, onChange, label }: { options: string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
              value === opt
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Scoring Logic ──
function parseDimensions(dim: string): number[] {
  return dim.split(/[x×,\s]+/).map(Number).filter(n => !isNaN(n) && n > 0);
}

function getMaxDimension(dim: string): number {
  const dims = parseDimensions(dim);
  return dims.length > 0 ? Math.max(...dims) : 0;
}

function calcTiradsScore(data: ExamData): number {
  let pts = 0;
  const compMap: Record<string, number> = { 'Cística': 0, 'Predominantemente cística': 0, 'Esponjiforme': 0, 'Predominantemente sólida': 1, 'Sólida': 2 };
  const echoMap: Record<string, number> = { 'Anecoica': 0, 'Hiperecoica/Isoecoica': 1, 'Hipoecoica': 2, 'Muito hipoecoica': 3 };
  const formMap: Record<string, number> = { 'Mais largo que alto': 0, 'Mais alto que largo': 3 };
  const marginMap: Record<string, number> = { 'Lisas': 0, 'Mal definidas': 0, 'Lobuladas/Irregulares': 2, 'Extensão extratireoidiana': 3 };
  const fociMap: Record<string, number> = { 'Nenhum': 0, 'Macrocalcificações': 1, 'Calcificações periféricas': 2, 'Focos ecogênicos punctiformes': 3 };

  pts += compMap[data.composition || ''] ?? 0;
  pts += echoMap[data.echogenicity || ''] ?? 0;
  pts += formMap[data.tForm || ''] ?? 0;
  pts += marginMap[data.tMargins || ''] ?? 0;
  pts += fociMap[data.echogenicFoci || ''] ?? 0;
  return pts;
}

function tiradsCategory(score: number): number {
  if (score === 0) return 1;
  if (score <= 2) return 2;
  if (score === 3) return 3;
  if (score <= 6) return 4;
  return 5;
}

function calcBiradsCategory(data: ExamData): number {
  const strongSuspicious = [
    data.shape === 'Irregular',
    data.margins === 'Espiculadas',
    ['Dentro da massa', 'Intraductais'].includes(data.calcifications || ''),
  ].filter(Boolean).length;

  const moderateSuspicious = [
    ['Indistintas', 'Microlobuladas'].includes(data.margins || ''),
    data.orientation === 'Não paralela',
    data.echogenicity === 'Hipoecoica',
    data.posteriorFeatures === 'Sombra',
  ].filter(Boolean).length;

  const benign = [
    data.shape === 'Oval',
    data.margins === 'Circunscritas',
    data.echogenicity === 'Anecóica',
  ].filter(Boolean).length;

  if (strongSuspicious >= 2) return 5;
  if (strongSuspicious >= 1) return 4;
  if (moderateSuspicious >= 3) return 4;
  if (moderateSuspicious >= 1) return 4;
  if (benign >= 2) return 3;
  return 2;
}

function calcMatchScore(prev: ExamData, curr: ExamData, type: ExamType): number {
  let score = 0;
  // Location (30%)
  if (prev.location && curr.location) {
    score += prev.location.toLowerCase() === curr.location.toLowerCase() ? 30 : (prev.location.toLowerCase().includes(curr.location.toLowerCase().slice(0, 3)) ? 20 : 5);
  }
  // Dimensions (25%)
  const prevMax = getMaxDimension(prev.dimensions);
  const currMax = getMaxDimension(curr.dimensions);
  if (prevMax > 0 && currMax > 0) {
    const ratio = Math.min(prevMax, currMax) / Math.max(prevMax, currMax);
    score += Math.round(ratio * 25);
  }
  // Morphology (45%)
  if (type === 'tireoide') {
    if (prev.composition === curr.composition) score += 15; else if (prev.composition && curr.composition) score += 5;
    if (prev.echogenicity === curr.echogenicity) score += 15; else if (prev.echogenicity && curr.echogenicity) score += 5;
    if (prev.tForm === curr.tForm) score += 15; else if (prev.tForm && curr.tForm) score += 5;
  } else {
    if (prev.shape === curr.shape) score += 15; else if (prev.shape && curr.shape) score += 5;
    if (prev.echogenicity === curr.echogenicity) score += 15; else if (prev.echogenicity && curr.echogenicity) score += 5;
    if (prev.margins === curr.margins) score += 15; else if (prev.margins && curr.margins) score += 5;
  }
  return Math.min(100, score);
}

// ── Component ──
const emptyExam = (): ExamData => ({ location: '', dimensions: '', date: '', shape: '', margins: '', orientation: '', echogenicity: '', posteriorFeatures: '', calcifications: '', composition: '', tForm: '', tMargins: '', echogenicFoci: '' });

export default function LaudoEvolutivoPanel() {
  const [examType, setExamType] = useState<ExamType>(null);
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [prevExam, setPrevExam] = useState<ExamData>(emptyExam());
  const [currExam, setCurrExam] = useState<ExamData>(emptyExam());
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const canAnalyze = examType && prevExam.dimensions && currExam.dimensions;

  const handleAnalyze = () => {
    if (!examType) return;
    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      const matchScore = calcMatchScore(prevExam, currExam, examType);
      const prevMax = getMaxDimension(prevExam.dimensions);
      const currMax = getMaxDimension(currExam.dimensions);
      const pctChange = prevMax > 0 ? ((currMax - prevMax) / prevMax) * 100 : 0;
      const dimStatus = pctChange >= 20 ? 'aumento' : pctChange <= -30 ? 'reducao' : 'estavel';
      const significant = Math.abs(pctChange) >= 20;

      let prevCat: { name: string; level: number; color: string };
      let currCat: { name: string; level: number; color: string };
      const alerts: string[] = [];

      if (examType === 'tireoide') {
        const prevScore = calcTiradsScore(prevExam);
        const currScore = calcTiradsScore(currExam);
        const prevLvl = tiradsCategory(prevScore);
        const currLvl = tiradsCategory(currScore);
        const prevInfo = TIRADS_CATEGORIES[prevLvl];
        const currInfo = TIRADS_CATEGORIES[currLvl];
        prevCat = { name: prevInfo.name, level: prevLvl, color: prevInfo.color };
        currCat = { name: currInfo.name, level: currLvl, color: currInfo.color };

        if (significant && dimStatus === 'aumento') {
          alerts.push('Crescimento significativo detectado (≥20%). Segundo Tuttle et al. (2018), nódulos com crescimento > 20% devem ser reavaliados quanto à indicação de PAAF, independentemente da categoria TI-RADS inicial.');
        }
        if (dimStatus === 'estavel') {
          alerts.push('Estabilidade dimensional mantida. Nódulos tireoidianos estáveis por ≥ 5 anos raramente são malignos (< 1% segundo Durante et al., 2015).');
        }
      } else {
        const prevLvl = calcBiradsCategory(prevExam);
        const currLvl = calcBiradsCategory(currExam);
        const prevInfo = BIRADS_CATEGORIES[prevLvl] || BIRADS_CATEGORIES[2];
        const currInfo = BIRADS_CATEGORIES[currLvl] || BIRADS_CATEGORIES[2];
        prevCat = { name: prevInfo.name, level: prevLvl, color: prevInfo.color };
        currCat = { name: currInfo.name, level: currLvl, color: currInfo.color };

        if (significant && dimStatus === 'aumento') {
          alerts.push('Aumento dimensional significativo. Conforme BI-RADS 5ª edição, lesões previamente categorizadas como BI-RADS 3 que apresentam crescimento devem ser reclassificadas para BI-RADS 4A, com indicação de biópsia.');
        }
        if (dimStatus === 'estavel') {
          alerts.push('Estabilidade dimensional. Segundo BI-RADS, lesões BI-RADS 3 estáveis por 2-3 anos podem ser reclassificadas para BI-RADS 2 (achado benigno).');
        }
      }

      if (matchScore < 60) {
        alerts.push('Baixa correspondência entre os achados (< 60%). Verificar se trata-se da mesma lesão ou se há nova lesão a ser categorizada separadamente.');
      }

      const confidence = matchScore >= 80 ? 'alta' : matchScore >= 60 ? 'moderada' : 'baixa';
      const recommendation = examType === 'tireoide'
        ? TIRADS_CATEGORIES[currCat.level]?.recommendation || ''
        : BIRADS_CATEGORIES[currCat.level]?.recommendation || '';

      setResult({
        matchScore,
        confidence,
        dimensionalChange: { status: dimStatus, percentage: Math.round(pctChange), significant, prevMax, currMax },
        prevCategory: prevCat,
        currCategory: currCat,
        alerts,
        recommendation,
      });
      setAnalyzing(false);
    }, 800);
  };

  const updatePrev = (field: keyof ExamData, value: string) => setPrevExam(p => ({ ...p, [field]: value }));
  const updateCurr = (field: keyof ExamData, value: string) => setCurrExam(p => ({ ...p, [field]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold font-display">Laudo Evolutivo</h2>
          <p className="text-sm text-muted-foreground">Comparação de achados e análise de evolução</p>
        </div>
      </div>

      {/* Exam Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => { setExamType('tireoide'); setResult(null); setPrevExam(emptyExam()); setCurrExam(emptyExam()); }}
          className={cn(
            "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group",
            examType === 'tireoide'
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/40 hover:shadow-md"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-2xl", examType === 'tireoide' ? "bg-primary/10" : "bg-muted")}>🦋</div>
            <div>
              <h3 className="font-semibold text-lg">Tireoide</h3>
              <p className="text-sm text-muted-foreground">ACR TI-RADS</p>
            </div>
          </div>
          {examType === 'tireoide' && <div className="absolute top-3 right-3"><CheckCircle className="h-5 w-5 text-primary" /></div>}
        </button>

        <button
          onClick={() => { setExamType('mama'); setResult(null); setPrevExam(emptyExam()); setCurrExam(emptyExam()); }}
          className={cn(
            "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group",
            examType === 'mama'
              ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20 shadow-lg"
              : "border-border hover:border-pink-400/40 hover:shadow-md"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-2xl", examType === 'mama' ? "bg-pink-100 dark:bg-pink-900/30" : "bg-muted")}>⭕</div>
            <div>
              <h3 className="font-semibold text-lg">Mama</h3>
              <p className="text-sm text-muted-foreground">ACR BI-RADS</p>
            </div>
          </div>
          {examType === 'mama' && <div className="absolute top-3 right-3"><CheckCircle className="h-5 w-5 text-pink-500" /></div>}
        </button>
      </div>

      {examType && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Clinical History */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-medium">História Clínica (opcional)</Label>
              <Textarea
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
                placeholder="Informações clínicas relevantes: idade, sintomas, antecedentes, indicação do exame..."
                className="mt-2 min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Exam Forms Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExamForm title="Exame Anterior" data={prevExam} onChange={updatePrev} examType={examType} accentColor="text-muted-foreground" />
            <ExamForm title="Exame Atual" data={currExam} onChange={updateCurr} examType={examType} accentColor="text-primary" />
          </div>

          {/* Analyze Button */}
          <Button onClick={handleAnalyze} disabled={!canAnalyze || analyzing} className="w-full" size="lg">
            {analyzing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando evolução...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Analisar Evolução</>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Match Score */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Correspondência dos Achados</CardTitle>
                    <Badge variant={result.confidence === 'alta' ? 'default' : result.confidence === 'moderada' ? 'secondary' : 'outline'}>
                      Confiança: {result.confidence}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold" style={{ color: result.matchScore >= 80 ? '#10b981' : result.matchScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                      {result.matchScore}%
                    </span>
                    <div className="flex-1">
                      <Progress value={result.matchScore} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dimensional Analysis */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {result.dimensionalChange.status === 'aumento' && <TrendingUp className="h-5 w-5 text-destructive" />}
                    {result.dimensionalChange.status === 'reducao' && <TrendingDown className="h-5 w-5 text-success" />}
                    {result.dimensionalChange.status === 'estavel' && <Minus className="h-5 w-5 text-warning" />}
                    Análise Dimensional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">
                    {result.dimensionalChange.prevMax}mm → {result.dimensionalChange.currMax}mm{' '}
                    <span className={cn(
                      "font-bold",
                      result.dimensionalChange.status === 'aumento' ? 'text-destructive' : result.dimensionalChange.status === 'reducao' ? 'text-success' : 'text-warning'
                    )}>
                      ({result.dimensionalChange.percentage > 0 ? '+' : ''}{result.dimensionalChange.percentage}%)
                    </span>
                  </p>
                  {result.dimensionalChange.significant && (
                    <Badge variant="destructive" className="mt-2">Variação significativa (≥20%)</Badge>
                  )}
                </CardContent>
              </Card>

              {/* Category Comparison & Alerts */}
              <Card>
                <CardHeader className="pb-3 bg-foreground/5 rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Análise Evolutiva & Recomendação
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="text-sm py-1 px-3" style={{ backgroundColor: result.prevCategory.color, color: '#fff' }}>
                      {result.prevCategory.name}
                    </Badge>
                    <span className="text-muted-foreground font-bold">→</span>
                    <Badge className="text-sm py-1 px-3" style={{ backgroundColor: result.currCategory.color, color: '#fff' }}>
                      {result.currCategory.name}
                    </Badge>
                  </div>

                  {result.alerts.map((alert, i) => (
                    <Alert key={i} className="border-primary/30 bg-primary/5">
                      <Info className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm">{alert}</AlertDescription>
                    </Alert>
                  ))}

                  <Separator />

                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm font-medium mb-1">Recomendação</p>
                    <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                  </div>

                  <Alert variant="default" className="bg-muted">
                    <AlertDescription className="text-xs text-muted-foreground italic">
                      Esta análise é baseada nas diretrizes ACR {examType === 'tireoide' ? 'TI-RADS' : 'BI-RADS'} e literatura científica atual. A decisão final deve considerar o contexto clínico completo e julgamento do médico assistente.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Exam Form Sub-component ──
function ExamForm({ title, data, onChange, examType, accentColor }: {
  title: string;
  data: ExamData;
  onChange: (field: keyof ExamData, value: string) => void;
  examType: ExamType;
  accentColor: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-base", accentColor)}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Localização</Label>
          <Input
            value={data.location}
            onChange={(e) => onChange('location', e.target.value)}
            placeholder={examType === 'tireoide' ? 'Ex: Lobo direito, terço médio' : 'Ex: QSE, 10h, 3cm da papila'}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Dimensões (mm)</Label>
          <Input
            value={data.dimensions}
            onChange={(e) => onChange('dimensions', e.target.value)}
            placeholder="Ex: 15 x 12 x 10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Data do exame</Label>
          <Input type="date" value={data.date} onChange={(e) => onChange('date', e.target.value)} />
        </div>

        <Separator />

        {examType === 'mama' ? (
          <>
            <PillSelector options={MAMA_SHAPES} value={data.shape || ''} onChange={(v) => onChange('shape', v)} label="Forma" />
            <PillSelector options={MAMA_MARGINS} value={data.margins || ''} onChange={(v) => onChange('margins', v)} label="Margens" />
            <PillSelector options={MAMA_ORIENTATION} value={data.orientation || ''} onChange={(v) => onChange('orientation', v)} label="Orientação" />
            <PillSelector options={MAMA_ECHO} value={data.echogenicity || ''} onChange={(v) => onChange('echogenicity', v)} label="Ecogenicidade" />
            <PillSelector options={MAMA_POSTERIOR} value={data.posteriorFeatures || ''} onChange={(v) => onChange('posteriorFeatures', v)} label="Características Posteriores" />
            <PillSelector options={MAMA_CALC} value={data.calcifications || ''} onChange={(v) => onChange('calcifications', v)} label="Calcificações" />
          </>
        ) : (
          <>
            <PillSelector options={TIRADS_COMP} value={data.composition || ''} onChange={(v) => onChange('composition', v)} label="Composição" />
            <PillSelector options={TIRADS_ECHO} value={data.echogenicity || ''} onChange={(v) => onChange('echogenicity', v)} label="Ecogenicidade" />
            <PillSelector options={TIRADS_FORM} value={data.tForm || ''} onChange={(v) => onChange('tForm', v)} label="Forma" />
            <PillSelector options={TIRADS_MARGINS} value={data.tMargins || ''} onChange={(v) => onChange('tMargins', v)} label="Margens" />
            <PillSelector options={TIRADS_FOCI} value={data.echogenicFoci || ''} onChange={(v) => onChange('echogenicFoci', v)} label="Focos Ecogênicos" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
