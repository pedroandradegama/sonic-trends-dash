import { Badge } from '@/components/ui/badge';

const BRL = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

interface BenchmarkGaugeProps {
  value: number;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
}

export function BenchmarkGauge({ value, p25, p50, p75, p90 }: BenchmarkGaugeProps) {
  const safeP25 = p25 ?? 0;
  const safeP50 = p50 ?? 0;
  const safeP75 = p75 ?? 0;
  const safeP90 = p90 ?? 0;
  const max = safeP90 * 1.2 || 1;
  const percentage = Math.min((value / max) * 100, 100);

  const markers = [
    { val: safeP25, label: 'P25' },
    { val: safeP50, label: 'P50' },
    { val: safeP75, label: 'P75' },
    { val: safeP90, label: 'P90' },
  ];

  return (
    <div className="relative w-full h-28 pt-10 pb-8">
      {/* Background zones */}
      <div className="absolute left-0 right-0 top-10 h-10 flex rounded-lg overflow-hidden">
        <div
          className="bg-red-100 dark:bg-red-950/30"
          style={{ width: `${(safeP25 / max) * 100}%` }}
        />
        <div
          className="bg-yellow-100 dark:bg-yellow-950/30"
          style={{ width: `${((safeP50 - safeP25) / max) * 100}%` }}
        />
        <div
          className="bg-blue-100 dark:bg-blue-950/30"
          style={{ width: `${((safeP75 - safeP50) / max) * 100}%` }}
        />
        <div
          className="bg-green-100 dark:bg-green-950/30"
          style={{ width: `${((safeP90 - safeP75) / max) * 100}%` }}
        />
        <div
          className="bg-emerald-100 dark:bg-emerald-950/30"
          style={{ width: `${((max - safeP90) / max) * 100}%` }}
        />
      </div>

      {/* Percentile markers */}
      {markers.map((m, i) => (
        <div
          key={i}
          className="absolute top-10 h-10 w-px bg-border/70"
          style={{ left: `${(m.val / max) * 100}%` }}
        >
          <span className="absolute top-full mt-1 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
            {BRL(m.val)}
          </span>
        </div>
      ))}

      {/* User value indicator */}
      <div
        className="absolute top-10 h-10 w-1 bg-primary rounded-full shadow-lg z-10"
        style={{ left: `${percentage}%` }}
      >
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <Badge className="bg-primary text-primary-foreground shadow-md">
            {BRL(value)}/h
          </Badge>
        </div>
      </div>
    </div>
  );
}
