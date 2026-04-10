import { useMemo } from 'react';
import { Clock, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRevenueData } from '@/hooks/useRevenueData';
import { ShiftType } from '@/types/revenue';

type Props = ReturnType<typeof useRevenueData>;

const HOURS_MAP: Record<ShiftType, number> = {
  manha: 5, tarde: 5, noite: 4, p6: 6, p12: 12, p24: 24,
};

export function RevenueInsights(props: Props) {
  const { services, shifts, prefs } = props;

  const insights = useMemo(() => {
    // Group shifts by month
    const monthBuckets: Record<string, typeof shifts> = {};
    shifts.forEach(s => {
      const d = new Date(s.shift_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthBuckets[key]) monthBuckets[key] = [];
      monthBuckets[key].push(s);
    });

    const monthKeys = Object.keys(monthBuckets);
    if (monthKeys.length === 0) {
      return { avgValue: 0, avgHours: 0, avgValuePerHour: 0, monthCount: 0 };
    }

    let grandTotalValue = 0;
    let grandTotalHours = 0;

    monthKeys.forEach(mk => {
      const bucket = monthBuckets[mk];
      bucket.forEach(s => {
        const svc = services.find(sv => sv.id === s.service_id);
        const val = svc?.shiftValues?.[s.shift_type] ?? 0;
        grandTotalValue += val;
        grandTotalHours += HOURS_MAP[s.shift_type] ?? 5;
      });
    });

    const monthCount = monthKeys.length;
    const avgValue = Math.round(grandTotalValue / monthCount);
    const avgHours = Math.round(grandTotalHours / monthCount);
    const avgValuePerHour = avgHours > 0 ? Math.round(avgValue / avgHours) : 0;

    return { avgValue, avgHours, avgValuePerHour, monthCount };
  }, [shifts, services]);

  const cards = [
    {
      label: 'Receita Média / mês',
      value: `R$ ${insights.avgValue.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Carga Horária / mês',
      value: `${insights.avgHours}h`,
      sub: `média de ${insights.monthCount} ${insights.monthCount === 1 ? 'mês' : 'meses'}`,
      icon: Calendar,
      accent: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Valor / Hora (média)',
      value: `R$ ${insights.avgValuePerHour.toLocaleString('pt-BR')}`,
      icon: Clock,
      accent: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                  {card.label}
                </p>
                <p className="text-2xl font-bold font-display">{card.value}</p>
                {card.sub && (
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                )}
              </div>
              <div className={cn('rounded-lg p-2.5', card.bg)}>
                <Icon className={cn('h-5 w-5', card.accent)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
