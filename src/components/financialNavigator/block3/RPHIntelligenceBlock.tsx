import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PeerBenchmarkSection } from './PeerBenchmarkSection';

const BRL = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

interface RPHIntelligenceBlockProps {
  avgRPH: number;
  currentMonthGross: number;
  totalHours: number;
  effectiveHourlyRate: number;
  previousMonthGross?: number;
  previousMonthHours?: number;
}

export function RPHIntelligenceBlock({
  avgRPH,
  currentMonthGross,
  totalHours,
  effectiveHourlyRate,
  previousMonthGross,
  previousMonthHours,
}: RPHIntelligenceBlockProps) {
  const prevRPH = previousMonthHours && previousMonthHours > 0
    ? previousMonthGross! / previousMonthHours
    : null;

  const rphDelta = prevRPH ? ((avgRPH - prevRPH) / prevRPH) * 100 : null;

  const TrendIcon = rphDelta === null
    ? Minus
    : rphDelta >= 0
      ? TrendingUp
      : TrendingDown;

  const trendColor = rphDelta === null
    ? 'text-muted-foreground'
    : rphDelta >= 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="rounded-xl p-2 bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground font-display">RPH Intelligence</p>
          <p className="text-[10px] text-muted-foreground font-body">Análise de rendimento por hora</p>
        </div>
      </div>

      {/* RPH Insights Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold font-body">
            RPH Médio
          </p>
          <p className="text-2xl font-bold font-display">{BRL(avgRPH)}<span className="text-sm font-normal text-muted-foreground">/h</span></p>
          {rphDelta !== null && (
            <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{rphDelta > 0 ? '+' : ''}{rphDelta.toFixed(1)}% vs mês anterior</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold font-body">
            Taxa Efetiva
          </p>
          <p className="text-2xl font-bold font-display">{BRL(effectiveHourlyRate)}<span className="text-sm font-normal text-muted-foreground">/h</span></p>
          <p className="text-[10px] text-muted-foreground font-body">inclui deslocamento</p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold font-body">
            Horas no Mês
          </p>
          <p className="text-2xl font-bold font-display">{totalHours}<span className="text-sm font-normal text-muted-foreground">h</span></p>
          <p className="text-[10px] text-muted-foreground font-body">
            Bruto: {BRL(currentMonthGross)}
          </p>
        </div>
      </div>

      {/* Peer Benchmarking */}
      <PeerBenchmarkSection userRPH={avgRPH} />
    </section>
  );
}
