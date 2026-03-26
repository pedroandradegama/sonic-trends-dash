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

  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  const insights = useMemo(() => {
    const monthShifts = shifts.filter(s => {
      const d = new Date(s.shift_date);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    let totalValue = 0;
    let totalHours = 0;
    let shiftCount = monthShifts.length;

    monthShifts.forEach(s => {
      const svc = services.find(sv => sv.id === s.service_id);
      const val = svc?.shiftValues?.[s.shift_type] ?? 0;
      totalValue += val;
      
      // Use shift hours from service or default
      const hours = HOURS_MAP[s.shift_type] ?? 5;
      totalHours += hours;
    });

    const valuePerHour = totalHours > 0 ? Math.round(totalValue / totalHours) : 0;
    const netValue = Math.round(totalValue * (1 - prefs.tax_rate / 100));

    return { totalValue, netValue, totalHours, shiftCount, valuePerHour };
  }, [shifts, services, prefs, curMonth, curYear]);

  const cards = [
    {
      label: 'Projeção Bruta',
      value: `R$ ${insights.totalValue.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Projeção Líquida',
      value: `R$ ${insights.netValue.toLocaleString('pt-BR')}`,
      icon: TrendingUp,
      accent: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Valor / Hora',
      value: `R$ ${insights.valuePerHour.toLocaleString('pt-BR')}`,
      icon: Clock,
      accent: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Carga Horária',
      value: `${insights.totalHours}h`,
      sub: `${insights.shiftCount} turnos`,
      icon: Calendar,
      accent: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  {card.label}
                </p>
                <p className="text-xl font-semibold font-display">{card.value}</p>
                {card.sub && (
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                )}
              </div>
              <div className={cn('rounded-lg p-2', card.bg)}>
                <Icon className={cn('h-4 w-4', card.accent)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
