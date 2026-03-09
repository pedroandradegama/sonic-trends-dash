import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SYMPTOMS_BY_AREA,
  FINDING_TYPES,
  ECHOGENICITY,
  POSTERIOR_ACOUSTIC,
  SHAPE_MARGINS,
  ASSOCIATED_FINDINGS,
} from './structuredFieldsData';

interface StructuredInputPanelProps {
  area: string;
  onChange: (text: string) => void;
}

export interface StructuredData {
  age: string;
  symptoms: string[];
  findingType: string;
  echogenicity: string;
  posteriorAcoustic: string;
  shapeMargins: string[];
  associatedFindings: string[];
  additionalNotes: string;
}

const STEP_LABELS = [
  'Paciente',
  'Sintomas',
  'Tipo de Achado',
  'Ecogenicidade',
  'Acústica',
  'Forma & Margens',
  'Achados Associados',
  'Observações',
];

export function StructuredInputPanel({ area, onChange }: StructuredInputPanelProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<StructuredData>({
    age: '',
    symptoms: [],
    findingType: '',
    echogenicity: '',
    posteriorAcoustic: '',
    shapeMargins: [],
    associatedFindings: [],
    additionalNotes: '',
  });

  const symptoms = SYMPTOMS_BY_AREA[area] || SYMPTOMS_BY_AREA.outro;
  const totalSteps = STEP_LABELS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const stableOnChange = useCallback(onChange, []);

  useEffect(() => {
    const text = generateText(data, area);
    stableOnChange(text);
  }, [data, area, stableOnChange]);

  const toggleInArray = (field: 'symptoms' | 'shapeMargins' | 'associatedFindings', value: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((s: string) => s !== value)
        : [...prev[field], value],
    }));
  };

  const next = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Passo {step + 1} de {totalSteps}</span>
          <span>{STEP_LABELS[step]}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5">
        {STEP_LABELS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/60" : "w-2 bg-border"
            )}
          />
        ))}
      </div>

      {/* Step content — animated */}
      <div className="min-h-[220px] flex flex-col justify-center animate-in fade-in-0 slide-in-from-right-4 duration-300" key={step}>
        {step === 0 && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold font-display">Qual a idade do paciente?</h3>
            <p className="text-sm text-muted-foreground">Informe a idade em anos</p>
            <Input
              type="number"
              placeholder="Ex: 34"
              value={data.age}
              onChange={(e) => setData(prev => ({ ...prev, age: e.target.value }))}
              className="max-w-[160px] mx-auto text-center text-lg h-12"
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-display text-center">Quais os sintomas?</h3>
            <p className="text-sm text-muted-foreground text-center">Toque para selecionar (múltipla escolha)</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {symptoms.map((symptom) => (
                <Badge
                  key={symptom}
                  variant={data.symptoms.includes(symptom) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-sm py-1.5 px-3 transition-all duration-200",
                    data.symptoms.includes(symptom)
                      ? "shadow-sm scale-105"
                      : "hover:bg-primary/10"
                  )}
                  onClick={() => toggleInArray('symptoms', symptom)}
                >
                  {data.symptoms.includes(symptom) && <Check className="h-3 w-3 mr-1" />}
                  {symptom}
                </Badge>
              ))}
            </div>
            {data.symptoms.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {data.symptoms.length} selecionado(s)
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold font-display">Tipo de alteração encontrada?</h3>
            <p className="text-sm text-muted-foreground">Selecione o principal achado</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {FINDING_TYPES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setData(prev => ({ ...prev, findingType: prev.findingType === item.value ? '' : item.value }))}
                  className={cn(
                    "px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                    data.findingType === item.value
                      ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                      : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold font-display">Ecogenicidade?</h3>
            <p className="text-sm text-muted-foreground">Selecione a ecogenicidade do achado</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {ECHOGENICITY.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setData(prev => ({ ...prev, echogenicity: prev.echogenicity === item.value ? '' : item.value }))}
                  className={cn(
                    "px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                    data.echogenicity === item.value
                      ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                      : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold font-display">Acústica posterior?</h3>
            <p className="text-sm text-muted-foreground">Selecione o padrão acústico</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {POSTERIOR_ACOUSTIC.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setData(prev => ({ ...prev, posteriorAcoustic: prev.posteriorAcoustic === item.value ? '' : item.value }))}
                  className={cn(
                    "px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                    data.posteriorAcoustic === item.value
                      ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                      : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-display text-center">Forma e margens?</h3>
            <p className="text-sm text-muted-foreground text-center">Selecione uma ou mais opções</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SHAPE_MARGINS.map((item) => (
                <Badge
                  key={item.value}
                  variant={data.shapeMargins.includes(item.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-sm py-1.5 px-3 transition-all duration-200",
                    data.shapeMargins.includes(item.value)
                      ? "shadow-sm scale-105"
                      : "hover:bg-primary/10"
                  )}
                  onClick={() => toggleInArray('shapeMargins', item.value)}
                >
                  {data.shapeMargins.includes(item.value) && <Check className="h-3 w-3 mr-1" />}
                  {item.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-display text-center">Achados associados?</h3>
            <p className="text-sm text-muted-foreground text-center">Selecione se presentes</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {ASSOCIATED_FINDINGS.map((item) => (
                <Badge
                  key={item.value}
                  variant={data.associatedFindings.includes(item.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-sm py-1.5 px-3 transition-all duration-200",
                    data.associatedFindings.includes(item.value)
                      ? "shadow-sm scale-105"
                      : "hover:bg-primary/10"
                  )}
                  onClick={() => toggleInArray('associatedFindings', item.value)}
                >
                  {data.associatedFindings.includes(item.value) && <Check className="h-3 w-3 mr-1" />}
                  {item.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold font-display">Observações adicionais</h3>
            <p className="text-sm text-muted-foreground">Algo mais que deseja registrar? (opcional)</p>
            <Textarea
              value={data.additionalNotes}
              onChange={(e) => setData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Informações adicionais relevantes..."
              className="min-h-[100px]"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={prev}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>

        {step < totalSteps - 1 ? (
          <Button
            size="sm"
            onClick={next}
            className="gap-1"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Badge variant="default" className="py-1.5 px-3">
            <Check className="h-3 w-3 mr-1" /> Dados preenchidos
          </Badge>
        )}
      </div>
    </div>
  );
}

function generateText(data: StructuredData, area: string): string {
  const parts: string[] = [];

  if (data.age) {
    parts.push(`Paciente ${data.age} anos.`);
  }

  if (data.symptoms.length > 0) {
    parts.push(`Queixa(s): ${data.symptoms.join(', ')}.`);
  }

  const findingParts: string[] = [];

  if (data.findingType) {
    const findingLabel = FINDING_TYPES.find(f => f.value === data.findingType)?.label || data.findingType;
    findingParts.push(findingLabel);
  }

  if (data.echogenicity) {
    const echoLabel = ECHOGENICITY.find(e => e.value === data.echogenicity)?.label || data.echogenicity;
    findingParts.push(echoLabel.toLowerCase());
  }

  if (data.posteriorAcoustic && data.posteriorAcoustic !== 'sem_alteracao') {
    const acousticLabel = POSTERIOR_ACOUSTIC.find(a => a.value === data.posteriorAcoustic)?.label || data.posteriorAcoustic;
    findingParts.push(`com ${acousticLabel.toLowerCase()}`);
  }

  if (data.shapeMargins.length > 0) {
    const shapeLabels = data.shapeMargins.map(s =>
      SHAPE_MARGINS.find(m => m.value === s)?.label || s
    );
    findingParts.push(`forma/margens: ${shapeLabels.join(', ').toLowerCase()}`);
  }

  if (findingParts.length > 0) {
    parts.push(`Achados ultrassonográficos: ${findingParts.join(', ')}.`);
  }

  if (data.associatedFindings.length > 0) {
    const assocLabels = data.associatedFindings.map(a =>
      ASSOCIATED_FINDINGS.find(f => f.value === a)?.label || a
    );
    parts.push(`Achados associados: ${assocLabels.join(', ')}.`);
  }

  if (data.additionalNotes) {
    parts.push(`Observações: ${data.additionalNotes}`);
  }

  return parts.join(' ');
}
