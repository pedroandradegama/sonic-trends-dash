import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { BenchmarkGauge } from './BenchmarkGauge';

const BRL = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

function calculatePercentile(
  value: number,
  percentiles: { p25: number | null; p50: number | null; p75: number | null; p90: number | null }
): number {
  if (value >= (percentiles.p90 ?? Infinity)) return 90;
  if (value >= (percentiles.p75 ?? Infinity)) return 75;
  if (value >= (percentiles.p50 ?? Infinity)) return 50;
  if (value >= (percentiles.p25 ?? Infinity)) return 25;
  return 10;
}

export function PeerBenchmarkSection({ userRPH }: { userRPH: number }) {
  const { data: benchmark } = useQuery({
    queryKey: ['benchmark-pe-radiologia'],
    queryFn: async () => {
      const { data } = await supabase
        .from('market_benchmark_data')
        .select('*')
        .eq('region', 'PE')
        .eq('specialty', 'radiologia')
        .eq('metric', 'rph_avg')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
  });

  if (!benchmark || userRPH <= 0) return null;

  const percentile = calculatePercentile(userRPH, {
    p25: benchmark.percentile_25,
    p50: benchmark.percentile_50,
    p75: benchmark.percentile_75,
    p90: benchmark.percentile_90,
  });

  const getPercentileColor = (p: number) => {
    if (p >= 75) return 'text-green-600 dark:text-green-400';
    if (p >= 50) return 'text-blue-600 dark:text-blue-400';
    if (p >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const p75 = benchmark.percentile_75 ?? 0;

  return (
    <div className="border-t border-border/50 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold font-display">📊 Comparação com Peers</h4>
        <Badge variant="outline" className="text-xs">
          {benchmark.sample_size ?? '—'} radiologistas PE
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Gauge visual */}
        <div>
          <BenchmarkGauge
            value={userRPH}
            p25={benchmark.percentile_25}
            p50={benchmark.percentile_50}
            p75={benchmark.percentile_75}
            p90={benchmark.percentile_90}
          />
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground font-body">Sua posição</p>
            <p className={cn('text-3xl font-bold font-display', getPercentileColor(percentile))}>
              Percentil {percentile}
              {percentile >= 75 && ' 🌟'}
            </p>
          </div>

          <div className="space-y-2 text-sm font-body">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top 10%:</span>
              <span className="font-medium">{BRL(benchmark.percentile_90 ?? 0)}/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top 25%:</span>
              <span className="font-medium">{BRL(benchmark.percentile_75 ?? 0)}/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mediana:</span>
              <span className="font-medium">{BRL(benchmark.percentile_50 ?? 0)}/h</span>
            </div>
          </div>

          {percentile < 75 && p75 > userRPH && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Para chegar ao top 25%, aumente seu RPH em{' '}
                <strong>{BRL(p75 - userRPH)}</strong>{' '}
                ({((p75 / userRPH - 1) * 100).toFixed(0)}%)
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-4 font-body">
        Fonte: {benchmark.source ?? 'Pesquisa interna'} • {benchmark.reference_period ?? '—'}
      </p>
    </div>
  );
}
