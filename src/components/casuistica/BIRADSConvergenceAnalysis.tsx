import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BIRADSConvergenceAnalysisProps {
  data: Array<{ categoria: string; percent: number }>;
  examType: 'mamografia' | 'ultrassom' | 'ambos';
}

interface ReferenceRange {
  min: number;
  max: number;
}

interface ConvergenceResult {
  label: string;
  value: number;
  range: ReferenceRange;
  status: 'convergente' | 'abaixo' | 'acima';
}

export function BIRADSConvergenceAnalysis({ data, examType }: BIRADSConvergenceAnalysisProps) {
  // Ranges de referência para Mamografia
  const mamografiaRanges = {
    benignos: { min: 60, max: 90 },      // BI-RADS 1 (40-60%) + BI-RADS 2 (20-30%)
    provBenignos: { min: 5, max: 10 },   // BI-RADS 3
    suspeitos: { min: 1, max: 2.5 },     // BI-RADS 4 (1-2%) + BI-RADS 5 (<0.5%)
  };

  // Ranges de referência para Ultrassonografia
  const ultrassomRanges = {
    benignos: { min: 55, max: 65 },      // BI-RADS 1 (30-35%) + BI-RADS 2 (25-30%)
    provBenignos: { min: 20, max: 25 },  // BI-RADS 3
    suspeitos: { min: 6, max: 12 },      // BI-RADS 4 (5-10%) + BI-RADS 5 (1-2%)
  };

  const ranges = examType === 'mamografia' ? mamografiaRanges : examType === 'ultrassom' ? ultrassomRanges : mamografiaRanges;

  // Calcular valores do médico
  const getPercent = (categoria: string) => {
    const item = data.find(d => d.categoria === categoria);
    return item?.percent || 0;
  };

  const benignos = getPercent('BI-RADS 1') + getPercent('BI-RADS 2');
  const provBenignos = getPercent('BI-RADS 3');
  const suspeitos = getPercent('BI-RADS 4') + getPercent('BI-RADS 5');

  const getStatus = (value: number, range: ReferenceRange): 'convergente' | 'abaixo' | 'acima' => {
    if (value < range.min) return 'abaixo';
    if (value > range.max) return 'acima';
    return 'convergente';
  };

  const results: ConvergenceResult[] = [
    {
      label: 'Diagnósticos Benignos (BI-RADS 1 + 2)',
      value: benignos,
      range: ranges.benignos,
      status: getStatus(benignos, ranges.benignos),
    },
    {
      label: 'Provavelmente Benignos (BI-RADS 3)',
      value: provBenignos,
      range: ranges.provBenignos,
      status: getStatus(provBenignos, ranges.provBenignos),
    },
    {
      label: 'Diagnósticos Suspeitos (BI-RADS 4 + 5)',
      value: suspeitos,
      range: ranges.suspeitos,
      status: getStatus(suspeitos, ranges.suspeitos),
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'convergente':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'abaixo':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'acima':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'convergente':
        return 'Dentro do esperado';
      case 'abaixo':
        return 'Abaixo do esperado';
      case 'acima':
        return 'Acima do esperado';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'convergente':
        return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800';
      case 'abaixo':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
      case 'acima':
        return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
      default:
        return '';
    }
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {results.map((result, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{result.label}</h4>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-bold">{result.value.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground">
                  (ref: {result.range.min}% - {result.range.max}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(result.status)}
              <span className="text-sm font-medium">{getStatusText(result.status)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
