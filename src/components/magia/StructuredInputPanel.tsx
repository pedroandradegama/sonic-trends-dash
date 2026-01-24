import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function StructuredInputPanel({ area, onChange }: StructuredInputPanelProps) {
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

  // Generate text whenever data changes
  useEffect(() => {
    const text = generateText(data, area);
    onChange(text);
  }, [data, area, onChange]);

  const toggleSymptom = (symptom: string) => {
    setData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const toggleShapeMargin = (value: string) => {
    setData(prev => ({
      ...prev,
      shapeMargins: prev.shapeMargins.includes(value)
        ? prev.shapeMargins.filter(s => s !== value)
        : [...prev.shapeMargins, value]
    }));
  };

  const toggleAssociatedFinding = (value: string) => {
    setData(prev => ({
      ...prev,
      associatedFindings: prev.associatedFindings.includes(value)
        ? prev.associatedFindings.filter(s => s !== value)
        : [...prev.associatedFindings, value]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Age */}
      <div className="space-y-2">
        <Label htmlFor="age">Idade do paciente</Label>
        <Input
          id="age"
          type="number"
          placeholder="Ex: 34"
          value={data.age}
          onChange={(e) => setData(prev => ({ ...prev, age: e.target.value }))}
          className="max-w-[120px]"
        />
      </div>

      {/* Symptoms */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Sintomas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {symptoms.map((symptom) => (
              <Badge
                key={symptom}
                variant={data.symptoms.includes(symptom) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => toggleSymptom(symptom)}
              >
                {symptom}
              </Badge>
            ))}
          </div>
          {data.symptoms.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Selecionados: {data.symptoms.join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ultrasound Findings */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Achados Ecográficos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Finding Type */}
          <div className="space-y-2">
            <Label>Tipo de alteração</Label>
            <Select 
              value={data.findingType} 
              onValueChange={(v) => setData(prev => ({ ...prev, findingType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {FINDING_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Echogenicity */}
          <div className="space-y-2">
            <Label>Ecogenicidade</Label>
            <Select 
              value={data.echogenicity} 
              onValueChange={(v) => setData(prev => ({ ...prev, echogenicity: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a ecogenicidade" />
              </SelectTrigger>
              <SelectContent>
                {ECHOGENICITY.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Posterior Acoustic */}
          <div className="space-y-2">
            <Label>Acústica posterior</Label>
            <Select 
              value={data.posteriorAcoustic} 
              onValueChange={(v) => setData(prev => ({ ...prev, posteriorAcoustic: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a acústica" />
              </SelectTrigger>
              <SelectContent>
                {POSTERIOR_ACOUSTIC.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shape and Margins */}
          <div className="space-y-2">
            <Label>Forma e margens</Label>
            <div className="flex flex-wrap gap-2">
              {SHAPE_MARGINS.map((item) => (
                <Badge
                  key={item.value}
                  variant={data.shapeMargins.includes(item.value) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleShapeMargin(item.value)}
                >
                  {item.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Associated Findings */}
          <div className="space-y-2">
            <Label>Achados associados</Label>
            <div className="flex flex-wrap gap-2">
              {ASSOCIATED_FINDINGS.map((item) => (
                <Badge
                  key={item.value}
                  variant={data.associatedFindings.includes(item.value) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleAssociatedFinding(item.value)}
                >
                  {item.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações adicionais (opcional)</Label>
        <Textarea
          id="notes"
          value={data.additionalNotes}
          onChange={(e) => setData(prev => ({ ...prev, additionalNotes: e.target.value }))}
          placeholder="Informações adicionais relevantes..."
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

function generateText(data: StructuredData, area: string): string {
  const parts: string[] = [];

  // Age
  if (data.age) {
    parts.push(`Paciente ${data.age} anos.`);
  }

  // Symptoms
  if (data.symptoms.length > 0) {
    parts.push(`Queixa(s): ${data.symptoms.join(', ')}.`);
  }

  // Ultrasound findings
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
