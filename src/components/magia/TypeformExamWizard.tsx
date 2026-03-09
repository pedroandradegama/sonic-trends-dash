import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Reusable Typeform-style wizard for exam data (used in LaudoEvolutivoPanel)

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

type ExamType = 'tireoide' | 'mama';

interface TypeformExamWizardProps {
  title: string;
  data: ExamData;
  onChange: (field: keyof ExamData, value: string) => void;
  examType: ExamType;
  accentColor?: string;
}

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

interface StepDef {
  question: string;
  subtitle?: string;
  type: 'input' | 'date' | 'pill';
  field: keyof ExamData;
  options?: string[];
  placeholder?: string;
}

function getSteps(examType: ExamType): StepDef[] {
  const common: StepDef[] = [
    { question: 'Localização da lesão?', subtitle: examType === 'tireoide' ? 'Ex: Lobo direito, terço médio' : 'Ex: QSE, 10h, 3cm da papila', type: 'input', field: 'location', placeholder: examType === 'tireoide' ? 'Lobo direito, terço médio' : 'QSE, 10h, 3cm da papila' },
    { question: 'Dimensões (mm)?', subtitle: 'Insira as medidas separadas por x', type: 'input', field: 'dimensions', placeholder: '15 x 12 x 10' },
    { question: 'Data do exame?', type: 'date', field: 'date' },
  ];

  if (examType === 'mama') {
    return [
      ...common,
      { question: 'Forma?', type: 'pill', field: 'shape', options: MAMA_SHAPES },
      { question: 'Margens?', type: 'pill', field: 'margins', options: MAMA_MARGINS },
      { question: 'Orientação?', type: 'pill', field: 'orientation', options: MAMA_ORIENTATION },
      { question: 'Ecogenicidade?', type: 'pill', field: 'echogenicity', options: MAMA_ECHO },
      { question: 'Características posteriores?', type: 'pill', field: 'posteriorFeatures', options: MAMA_POSTERIOR },
      { question: 'Calcificações?', type: 'pill', field: 'calcifications', options: MAMA_CALC },
    ];
  }

  return [
    ...common,
    { question: 'Composição?', type: 'pill', field: 'composition', options: TIRADS_COMP },
    { question: 'Ecogenicidade?', type: 'pill', field: 'echogenicity', options: TIRADS_ECHO },
    { question: 'Forma?', type: 'pill', field: 'tForm', options: TIRADS_FORM },
    { question: 'Margens?', type: 'pill', field: 'tMargins', options: TIRADS_MARGINS },
    { question: 'Focos ecogênicos?', type: 'pill', field: 'echogenicFoci', options: TIRADS_FOCI },
  ];
}

export default function TypeformExamWizard({ title, data, onChange, examType, accentColor }: TypeformExamWizardProps) {
  const [step, setStep] = useState(0);
  const steps = getSteps(examType);
  const totalSteps = steps.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const current = steps[step];

  const next = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const renderContent = () => {
    if (current.type === 'input') {
      return (
        <Input
          value={data[current.field] || ''}
          onChange={(e) => onChange(current.field, e.target.value)}
          placeholder={current.placeholder}
          className="max-w-[280px] mx-auto text-center h-12"
          autoFocus
        />
      );
    }
    if (current.type === 'date') {
      return (
        <Input
          type="date"
          value={data[current.field] || ''}
          onChange={(e) => onChange(current.field, e.target.value)}
          className="max-w-[200px] mx-auto text-center h-12"
        />
      );
    }
    if (current.type === 'pill' && current.options) {
      return (
        <div className="flex flex-wrap gap-2 justify-center">
          {current.options.map(opt => {
            const selected = data[current.field] === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(current.field, selected ? '' : opt)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card/50 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className={cn("text-base font-semibold", accentColor)}>{title}</h4>
        <span className="text-xs text-muted-foreground">{step + 1}/{totalSteps}</span>
      </div>

      <Progress value={progress} className="h-1" />

      {/* Step dots */}
      <div className="flex justify-center gap-1">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === step ? "w-4 bg-primary" : i < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-border"
            )}
          />
        ))}
      </div>

      <div className="min-h-[140px] flex flex-col items-center justify-center text-center animate-in fade-in-0 slide-in-from-right-4 duration-300" key={step}>
        <h3 className="text-base font-semibold font-display mb-1">{current.question}</h3>
        {current.subtitle && <p className="text-xs text-muted-foreground mb-4">{current.subtitle}</p>}
        {!current.subtitle && <div className="mb-4" />}
        {renderContent()}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Ant.
        </Button>
        {step < totalSteps - 1 ? (
          <Button size="sm" onClick={next} className="gap-1">
            Próx. <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Badge variant="default" className="py-1.5 px-3">
            <Check className="h-3 w-3 mr-1" /> Pronto
          </Badge>
        )}
      </div>
    </div>
  );
}
