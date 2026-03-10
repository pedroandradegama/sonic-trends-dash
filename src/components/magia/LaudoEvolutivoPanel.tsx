import { useState, useRef } from 'react';
import { Activity, AlertTriangle, Loader2, Sparkles, TrendingUp, TrendingDown, Minus, Stethoscope, CheckCircle, Info, Mic, MicOff, FileUp, Grid3X3, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import TypeformExamWizard from './TypeformExamWizard';
import { parseReport, matchNodulesBetweenExams, noduleToExamData, type ParsedNodule } from './laudoEvolutivoParser';

// ── Types ──
type ExamType = 'tireoide' | 'mama' | null;
type InputMode = 'texto' | 'audio-unico' | 'audios-separados' | 'arquivo' | 'estruturado';

interface ExamData {
  location: string;
  dimensions: string;
  date: string;
  shape?: string;
  margins?: string;
  orientation?: string;
  echogenicity?: string;
  posteriorFeatures?: string;
  calcifications?: string;
  composition?: string;
  tForm?: string;
  tMargins?: string;
  echogenicFoci?: string;
}

interface NoduleResult {
  noduleId: string;
  prevNodule: ParsedNodule;
  currNodule: ParsedNodule;
  matchScore: number;
  confidence: 'alta' | 'moderada' | 'baixa';
  dimensionalChange: { status: 'aumento' | 'reducao' | 'estavel'; percentage: number; significant: boolean; prevMax: number; currMax: number };
  prevCategory: { name: string; level: number; color: string };
  currCategory: { name: string; level: number; color: string };
  alerts: string[];
  recommendation: string;
}

// ── Constants ──
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

const INPUT_MODES: { key: InputMode; label: string; icon: typeof Mic }[] = [
  { key: 'texto', label: 'Texto', icon: FileText },
  { key: 'audio-unico', label: 'Áudio Único', icon: Mic },
  { key: 'audios-separados', label: 'Áudios Separados', icon: MicOff },
  { key: 'arquivo', label: 'Arquivo', icon: FileUp },
  { key: 'estruturado', label: 'Estruturado', icon: Grid3X3 },
];

// ── Audio Recorder ──
function AudioRecorder({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribe(blob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setError('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsTranscribing(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const transcribe = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      const { data, error: err } = await supabase.functions.invoke('transcribe-audio', { body: formData });
      if (err) throw err;
      onChange(((value ? value + '\n' : '') + (data?.text || '')).trim());
    } catch {
      setError('Erro na transcrição do áudio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'outline'}
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className="rounded-full h-14 w-14"
        >
          {isTranscribing ? <Loader2 className="h-6 w-6 animate-spin" /> : isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <div className="text-sm text-muted-foreground">
          {isTranscribing ? 'Transcrevendo...' : isRecording ? `Gravando ${formatTime(recordingTime)}` : 'Clique para gravar'}
        </div>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'A transcrição aparecerá aqui...'} className="min-h-[100px]" />
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
  const strong = [data.shape === 'Irregular', data.margins === 'Espiculadas', ['Dentro da massa', 'Intraductais'].includes(data.calcifications || '')].filter(Boolean).length;
  const moderate = [['Indistintas', 'Microlobuladas'].includes(data.margins || ''), data.orientation === 'Não paralela', data.echogenicity === 'Hipoecoica', data.posteriorFeatures === 'Sombra'].filter(Boolean).length;
  const benign = [data.shape === 'Oval', data.margins === 'Circunscritas', data.echogenicity === 'Anecóica'].filter(Boolean).length;
  if (strong >= 2) return 5;
  if (strong >= 1 || moderate >= 1) return 4;
  if (benign >= 2) return 3;
  return 2;
}

function calcMatchScore(prev: ExamData, curr: ExamData, type: ExamType): number {
  let score = 0;
  if (prev.location && curr.location) {
    score += prev.location.toLowerCase() === curr.location.toLowerCase() ? 30 : (prev.location.toLowerCase().includes(curr.location.toLowerCase().slice(0, 3)) ? 20 : 5);
  }
  const prevMax = getMaxDimension(prev.dimensions);
  const currMax = getMaxDimension(curr.dimensions);
  if (prevMax > 0 && currMax > 0) {
    const ratio = Math.min(prevMax, currMax) / Math.max(prevMax, currMax);
    score += Math.round(ratio * 25);
  }
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

function analyzeNodulePair(prevData: ExamData, currData: ExamData, examType: ExamType): Omit<NoduleResult, 'noduleId' | 'prevNodule' | 'currNodule'> {
  const matchScore = calcMatchScore(prevData, currData, examType);
  const prevMax = getMaxDimension(prevData.dimensions);
  const currMax = getMaxDimension(currData.dimensions);
  const pctChange = prevMax > 0 ? ((currMax - prevMax) / prevMax) * 100 : 0;
  const dimStatus = pctChange >= 20 ? 'aumento' as const : pctChange <= -30 ? 'reducao' as const : 'estavel' as const;
  const significant = Math.abs(pctChange) >= 20;

  let prevCat: { name: string; level: number; color: string };
  let currCat: { name: string; level: number; color: string };
  const alerts: string[] = [];

  if (examType === 'tireoide') {
    const prevScore = calcTiradsScore(prevData);
    const currScore = calcTiradsScore(currData);
    const prevLvl = tiradsCategory(prevScore);
    const currLvl = tiradsCategory(currScore);
    const prevInfo = TIRADS_CATEGORIES[prevLvl];
    const currInfo = TIRADS_CATEGORIES[currLvl];
    prevCat = { name: prevInfo.name, level: prevLvl, color: prevInfo.color };
    currCat = { name: currInfo.name, level: currLvl, color: currInfo.color };
    if (significant && dimStatus === 'aumento') alerts.push('Crescimento significativo detectado (≥20%). Segundo Tuttle et al. (2018), nódulos com crescimento > 20% devem ser reavaliados quanto à indicação de PAAF.');
    if (dimStatus === 'estavel') alerts.push('Estabilidade dimensional mantida. Nódulos tireoidianos estáveis por ≥ 5 anos raramente são malignos (< 1% segundo Durante et al., 2015).');
    if (currLvl > prevLvl) alerts.push(`Aumento na classificação TI-RADS (TR${prevLvl} → TR${currLvl}). Reavaliação clínica recomendada.`);
    if (currLvl < prevLvl) alerts.push(`Redução na classificação TI-RADS (TR${prevLvl} → TR${currLvl}).`);
  } else {
    const prevLvl = calcBiradsCategory(prevData);
    const currLvl = calcBiradsCategory(currData);
    const prevInfo = BIRADS_CATEGORIES[prevLvl] || BIRADS_CATEGORIES[2];
    const currInfo = BIRADS_CATEGORIES[currLvl] || BIRADS_CATEGORIES[2];
    prevCat = { name: prevInfo.name, level: prevLvl, color: prevInfo.color };
    currCat = { name: currInfo.name, level: currLvl, color: currInfo.color };
    if (significant && dimStatus === 'aumento') alerts.push('Aumento dimensional significativo. Conforme BI-RADS 5ª edição, lesões com crescimento devem ser reclassificadas.');
    if (dimStatus === 'estavel') alerts.push('Estabilidade dimensional. Lesões BI-RADS 3 estáveis por 2-3 anos podem ser reclassificadas para BI-RADS 2.');
  }

  if (matchScore < 60) alerts.push('Baixa correspondência entre os achados (< 60%). Verificar se trata-se da mesma lesão.');

  const confidence = matchScore >= 80 ? 'alta' as const : matchScore >= 60 ? 'moderada' as const : 'baixa' as const;
  const recommendation = examType === 'tireoide'
    ? TIRADS_CATEGORIES[currCat.level]?.recommendation || ''
    : BIRADS_CATEGORIES[currCat.level]?.recommendation || '';

  return {
    matchScore, confidence,
    dimensionalChange: { status: dimStatus, percentage: Math.round(pctChange), significant, prevMax, currMax },
    prevCategory: prevCat, currCategory: currCat, alerts, recommendation,
  };
}

// ── Component ──
const emptyExam = (): ExamData => ({ location: '', dimensions: '', date: '', shape: '', margins: '', orientation: '', echogenicity: '', posteriorFeatures: '', calcifications: '', composition: '', tForm: '', tMargins: '', echogenicFoci: '' });

export default function LaudoEvolutivoPanel() {
  const [examType, setExamType] = useState<ExamType>(null);
  const [inputMode, setInputMode] = useState<InputMode>('texto');
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [prevExam, setPrevExam] = useState<ExamData>(emptyExam());
  const [currExam, setCurrExam] = useState<ExamData>(emptyExam());
  const [analyzing, setAnalyzing] = useState(false);
  const [noduleResults, setNoduleResults] = useState<NoduleResult[]>([]);
  const [analysisError, setAnalysisError] = useState('');

  // Text input states
  const [prevText, setPrevText] = useState('');
  const [currText, setCurrText] = useState('');

  // Audio/file states
  const [singleAudioText, setSingleAudioText] = useState('');
  const [prevAudioText, setPrevAudioText] = useState('');
  const [currAudioText, setCurrAudioText] = useState('');
  const [prevUploadedFile, setPrevUploadedFile] = useState<File | null>(null);
  const [currUploadedFile, setCurrUploadedFile] = useState<File | null>(null);
  const [prevFilePreview, setPrevFilePreview] = useState('');
  const [currFilePreview, setCurrFilePreview] = useState('');

  // Debug: parsed nodules preview
  const [parsedPreview, setParsedPreview] = useState<{ prev: ParsedNodule[]; curr: ParsedNodule[] } | null>(null);

  const canAnalyze = examType && (
    inputMode === 'estruturado' ? (prevExam.dimensions && currExam.dimensions) :
    inputMode === 'texto' ? (prevText.trim().length > 20 && currText.trim().length > 20) :
    inputMode === 'audio-unico' ? singleAudioText.trim().length > 20 :
    inputMode === 'audios-separados' ? (prevAudioText.trim().length > 10 && currAudioText.trim().length > 10) :
    inputMode === 'arquivo' ? (!!prevUploadedFile && !!currUploadedFile) :
    false
  );

  const handleFileUpload = (exam: 'prev' | 'curr', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    if (exam === 'prev') { setPrevUploadedFile(file); setPrevFilePreview(preview); }
    else { setCurrUploadedFile(file); setCurrFilePreview(preview); }
  };

  const getTextInputs = (): { prevTextInput: string; currTextInput: string } => {
    if (inputMode === 'texto') return { prevTextInput: prevText, currTextInput: currText };
    if (inputMode === 'audios-separados') return { prevTextInput: prevAudioText, currTextInput: currAudioText };
    if (inputMode === 'audio-unico') {
      // Try to split single audio by "anterior" / "atual" markers
      const text = singleAudioText;
      const splitIdx = text.search(/\b(atual|exame\s+atual|segundo\s+exame)\b/i);
      if (splitIdx > 0) {
        return { prevTextInput: text.slice(0, splitIdx), currTextInput: text.slice(splitIdx) };
      }
      // If can't split, treat as two halves
      const mid = Math.floor(text.length / 2);
      return { prevTextInput: text.slice(0, mid), currTextInput: text.slice(mid) };
    }
    return { prevTextInput: '', currTextInput: '' };
  };

  const handleAnalyze = () => {
    if (!examType) return;
    setAnalyzing(true);
    setNoduleResults([]);
    setParsedPreview(null);
    setAnalysisError('');

    setTimeout(() => {
      if (inputMode === 'arquivo') {
        setAnalysisError('No modo Arquivo, ainda não há extração automática de texto (OCR). Para comparação precisa, use o modo Texto e cole os laudos.');
        setAnalyzing(false);
        return;
      }

      if (inputMode === 'estruturado') {
        // Single nodule comparison (structured mode)
        const result = analyzeNodulePair(prevExam, currExam, examType);
        setNoduleResults([{
          ...result,
          noduleId: 'N1',
          prevNodule: { id: 'N1', description: '', location: prevExam.location, dimensions: prevExam.dimensions, composition: prevExam.composition || '', echogenicity: prevExam.echogenicity || '', form: prevExam.tForm || '', margins: prevExam.tMargins || '', echogenicFoci: prevExam.echogenicFoci || '', tiradsClassification: null, biradsClassification: null },
          currNodule: { id: 'N1', description: '', location: currExam.location, dimensions: currExam.dimensions, composition: currExam.composition || '', echogenicity: currExam.echogenicity || '', form: currExam.tForm || '', margins: currExam.tMargins || '', echogenicFoci: currExam.echogenicFoci || '', tiradsClassification: null, biradsClassification: null },
        }]);
      } else {
        // Text-based: parse and compare multiple nodules
        const { prevTextInput, currTextInput } = getTextInputs();
        const prevNodules = parseReport(prevTextInput);
        const currNodules = parseReport(currTextInput);
        setParsedPreview({ prev: prevNodules, curr: currNodules });

        const pairs = matchNodulesBetweenExams(prevNodules, currNodules);

        if (pairs.length === 0) {
          setAnalysisError('Não foi possível correlacionar nódulos entre os dois exames.');
          setNoduleResults([]);
          setAnalyzing(false);
          return;
        }

        const results: NoduleResult[] = pairs.map(({ prev, curr }) => {
          const prevData = noduleToExamData(prev);
          const currData = noduleToExamData(curr);
          const analysis = analyzeNodulePair(prevData, currData, examType);
          return {
            ...analysis,
            noduleId: prev.id,
            prevNodule: prev,
            currNodule: curr,
          };
        });

        setNoduleResults(results);
      }
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

      {/* TIPO DE EXAME */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Exame</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => { setExamType('tireoide'); setNoduleResults([]); setPrevExam(emptyExam()); setCurrExam(emptyExam()); setParsedPreview(null); }}
            className={cn(
              "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group",
              examType === 'tireoide'
                ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-lg"
                : "border-border hover:border-purple-400/40 hover:shadow-md"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", examType === 'tireoide' ? "bg-purple-100 dark:bg-purple-900/30" : "bg-muted")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("h-7 w-7", examType === 'tireoide' ? "text-purple-600" : "text-muted-foreground")}>
                  <path d="M12 16V20" />
                  <path d="M12 16C12 16 8 15 6 12C4 9 5.5 6 8 5C9.5 4.3 11 5 12 6.5" />
                  <path d="M12 16C12 16 16 15 18 12C20 9 18.5 6 16 5C14.5 4.3 13 5 12 6.5" />
                  <circle cx="9" cy="9" r="1.5" />
                  <circle cx="15" cy="9" r="1.5" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tireoide</h3>
                <p className="text-sm text-muted-foreground">ACR TI-RADS</p>
              </div>
            </div>
            {examType === 'tireoide' && <div className="absolute top-3 right-3"><CheckCircle className="h-5 w-5 text-purple-500" /></div>}
          </button>

          <button
            onClick={() => { setExamType('mama'); setNoduleResults([]); setPrevExam(emptyExam()); setCurrExam(emptyExam()); setParsedPreview(null); }}
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
      </div>

      {examType && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* HISTÓRIA CLÍNICA */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">História Clínica</h3>
            <Card>
              <CardContent className="pt-5">
                <Textarea
                  value={clinicalHistory}
                  onChange={(e) => setClinicalHistory(e.target.value)}
                  placeholder="Informações clínicas relevantes: idade, sintomas, antecedentes, indicação do exame..."
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* ENTRADA DOS LAUDOS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entrada dos Laudos</h3>
            <Card>
              <CardContent className="pt-5">
                {/* Mode selector */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
                  {INPUT_MODES.map(mode => {
                    const Icon = mode.icon;
                    const isActive = inputMode === mode.key;
                    return (
                      <button
                        key={mode.key}
                        onClick={() => setInputMode(mode.key)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-lg"
                            : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium text-center">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TEXT MODE */}
                {inputMode === 'texto' && (
                  <div className="space-y-6">
                    <Alert className="border-primary/30 bg-primary/5">
                      <Info className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm">
                        Cole o texto do laudo de cada exame. O sistema identificará automaticamente os nódulos (N1, N2...) e comparará cada um individualmente.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Anterior</Badge>
                          Laudo do Exame Anterior
                        </Label>
                        <Textarea
                          value={prevText}
                          onChange={(e) => setPrevText(e.target.value)}
                          placeholder={"ANÁLISE:\nTireoide\nN1 | Nódulo espongiforme...\n- Localização: ...\n- Dimensões: 0,8 x 0,5 x 0,3 cm.\n- Classificação ACR TI-RADS: 4."}
                          className="min-h-[200px] font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Badge variant="default" className="text-xs">Atual</Badge>
                          Laudo do Exame Atual
                        </Label>
                        <Textarea
                          value={currText}
                          onChange={(e) => setCurrText(e.target.value)}
                          placeholder={"ANÁLISE:\nTireoide\nN1 | Nódulo espongiforme...\n- Localização: ...\n- Dimensões: 0,6 x 0,5 x 0,4 cm.\n- Classificação ACR TI-RADS: 4."}
                          className="min-h-[200px] font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* AUDIO UNICO */}
                {inputMode === 'audio-unico' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Grave um áudio único descrevendo os achados do exame <strong>anterior</strong> e do exame <strong>atual</strong>, incluindo localização, dimensões e características das lesões.
                    </p>
                    <AudioRecorder value={singleAudioText} onChange={setSingleAudioText} placeholder="Descreva ambos os exames (anterior e atual) em um único áudio..." />
                  </div>
                )}

                {/* AUDIOS SEPARADOS */}
                {inputMode === 'audios-separados' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Anterior</Badge>
                        Áudio do Exame Anterior
                      </Label>
                      <AudioRecorder value={prevAudioText} onChange={setPrevAudioText} placeholder="Descreva os achados do exame anterior..." />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Badge variant="default" className="text-xs">Atual</Badge>
                        Áudio do Exame Atual
                      </Label>
                      <AudioRecorder value={currAudioText} onChange={setCurrAudioText} placeholder="Descreva os achados do exame atual..." />
                    </div>
                  </div>
                )}

                {/* ARQUIVO */}
                {inputMode === 'arquivo' && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Faça upload de uma <strong>imagem</strong> ou <strong>PDF</strong> de cada exame para comparação automática.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3 p-4 rounded-xl border border-border bg-card/50">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Anterior</Badge>
                          Arquivo do Exame Anterior
                        </Label>
                        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                          <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload('prev', e)} className="hidden" id="laudo-file-upload-prev" />
                          <label htmlFor="laudo-file-upload-prev" className="cursor-pointer space-y-3 block">
                            <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Selecionar arquivo anterior</p>
                              <p className="text-xs text-muted-foreground mt-1">PDF ou imagem (JPG, PNG) • Máx. 20MB</p>
                            </div>
                          </label>
                        </div>
                        {prevUploadedFile && (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <FileUp className="h-5 w-5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{prevUploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(prevUploadedFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <Badge variant="outline" className="text-xs">Pronto</Badge>
                          </div>
                        )}
                        {prevFilePreview && <img src={prevFilePreview} alt="Preview do exame anterior" className="max-h-48 mx-auto rounded-lg border border-border" />}
                      </div>

                      <div className="space-y-3 p-4 rounded-xl border border-border bg-card/50">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Badge variant="default" className="text-xs">Atual</Badge>
                          Arquivo do Exame Atual
                        </Label>
                        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                          <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload('curr', e)} className="hidden" id="laudo-file-upload-curr" />
                          <label htmlFor="laudo-file-upload-curr" className="cursor-pointer space-y-3 block">
                            <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Selecionar arquivo atual</p>
                              <p className="text-xs text-muted-foreground mt-1">PDF ou imagem (JPG, PNG) • Máx. 20MB</p>
                            </div>
                          </label>
                        </div>
                        {currUploadedFile && (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <FileUp className="h-5 w-5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{currUploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(currUploadedFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <Badge variant="outline" className="text-xs">Pronto</Badge>
                          </div>
                        )}
                        {currFilePreview && <img src={currFilePreview} alt="Preview do exame atual" className="max-h-48 mx-auto rounded-lg border border-border" />}
                      </div>
                    </div>
                  </div>
                )}

                {/* ESTRUTURADO */}
                {inputMode === 'estruturado' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TypeformExamWizard title="Exame Anterior" data={prevExam} onChange={updatePrev} examType={examType} accentColor="text-muted-foreground" />
                    <TypeformExamWizard title="Exame Atual" data={currExam} onChange={updateCurr} examType={examType} accentColor="text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analyze Button */}
          <Button onClick={handleAnalyze} disabled={!canAnalyze || analyzing} className="w-full" size="lg">
            {analyzing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando evolução...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Analisar Evolução</>
            )}
          </Button>

          {analysisError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
          )}

          {/* Parsed Preview (for text modes) */}
          {parsedPreview && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Nódulos Identificados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Exame Anterior ({parsedPreview.prev.length} nódulo{parsedPreview.prev.length > 1 ? 's' : ''})</p>
                    {parsedPreview.prev.map(n => (
                      <div key={n.id} className="text-xs p-2 rounded-lg bg-muted/50 mb-1.5 space-y-0.5">
                        <span className="font-bold text-foreground">{n.id}</span>
                        {n.location && <span className="text-muted-foreground"> — {n.location}</span>}
                        {n.dimensions && <p className="text-muted-foreground">Dim: {n.dimensions} cm</p>}
                        {n.composition && <p className="text-muted-foreground">Comp: {n.composition}</p>}
                        {n.echogenicity && <p className="text-muted-foreground">Eco: {n.echogenicity}</p>}
                        {n.echogenicFoci && <p className="text-muted-foreground">Focos: {n.echogenicFoci}</p>}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Exame Atual ({parsedPreview.curr.length} nódulo{parsedPreview.curr.length > 1 ? 's' : ''})</p>
                    {parsedPreview.curr.map(n => (
                      <div key={n.id} className="text-xs p-2 rounded-lg bg-muted/50 mb-1.5 space-y-0.5">
                        <span className="font-bold text-foreground">{n.id}</span>
                        {n.location && <span className="text-muted-foreground"> — {n.location}</span>}
                        {n.dimensions && <p className="text-muted-foreground">Dim: {n.dimensions} cm</p>}
                        {n.composition && <p className="text-muted-foreground">Comp: {n.composition}</p>}
                        {n.echogenicity && <p className="text-muted-foreground">Eco: {n.echogenicity}</p>}
                        {n.echogenicFoci && <p className="text-muted-foreground">Focos: {n.echogenicFoci}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results - Per Nodule */}
          {noduleResults.length > 0 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {noduleResults.length > 1 && (
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {noduleResults.length} nódulos comparados
                </h3>
              )}

              {noduleResults.map((result, idx) => (
                <div key={result.noduleId} className="space-y-4">
                  {noduleResults.length > 1 && (
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-base font-bold px-3 py-1">{result.noduleId}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {result.prevNodule.location || result.currNodule.location}
                      </span>
                    </div>
                  )}

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {noduleResults.length > 1 ? `${result.noduleId} — ` : ''}Correspondência dos Achados
                        </CardTitle>
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
                        {result.dimensionalChange.prevMax}cm → {result.dimensionalChange.currMax}cm{' '}
                        <span className={cn("font-bold", result.dimensionalChange.status === 'aumento' ? 'text-destructive' : result.dimensionalChange.status === 'reducao' ? 'text-success' : 'text-warning')}>
                          ({result.dimensionalChange.percentage > 0 ? '+' : ''}{result.dimensionalChange.percentage}%)
                        </span>
                      </p>
                      {result.dimensionalChange.prevMax > 0 && result.dimensionalChange.currMax > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Maior eixo: {result.prevNodule.dimensions} mm → {result.currNodule.dimensions} mm
                        </p>
                      )}
                      {result.dimensionalChange.significant && <Badge variant="destructive" className="mt-2">Variação significativa (≥20%)</Badge>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3 bg-foreground/5 rounded-t-lg">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Análise Evolutiva & Recomendação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="text-sm py-1 px-3" style={{ backgroundColor: result.prevCategory.color, color: '#fff' }}>{result.prevCategory.name}</Badge>
                        <span className="text-muted-foreground font-bold">→</span>
                        <Badge className="text-sm py-1 px-3" style={{ backgroundColor: result.currCategory.color, color: '#fff' }}>{result.currCategory.name}</Badge>
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
                    </CardContent>
                  </Card>

                  {idx < noduleResults.length - 1 && <Separator className="my-6" />}
                </div>
              ))}

              <Alert variant="default" className="bg-muted">
                <AlertDescription className="text-xs text-muted-foreground italic">
                  Esta análise é baseada nas diretrizes ACR {examType === 'tireoide' ? 'TI-RADS' : 'BI-RADS'} e literatura científica atual. A decisão final deve considerar o contexto clínico completo.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* No results found for text input */}
          {parsedPreview && noduleResults.length === 0 && !analyzing && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Não foi possível identificar nódulos nos textos fornecidos. Verifique se os laudos contêm marcadores como "N1 |", "N2 |" ou "Nódulo 1:" seguidos de localização e dimensões.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
