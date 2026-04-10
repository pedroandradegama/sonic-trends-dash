import { Car } from 'lucide-react';
import { ProjectionMetrics, FnProjectionPrefs } from '@/types/financialNavigator';

interface Props {
  metrics: ProjectionMetrics;
  prefs: FnProjectionPrefs;
  commuteHoursMonth?: number;
}

function MetricCard({
  label, value, sub, highlight, icon,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            {label}
          </p>
          <p className={`text-xl font-bold font-display ${highlight ? 'text-[hsl(var(--success))]' : 'text-foreground'}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        {icon && <div className="rounded-lg p-2 bg-muted">{icon}</div>}
      </div>
    </div>
  );
}

const BRL = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

export function FnMetricsGrid({ metrics, prefs, commuteHoursMonth = 0 }: Props) {
  const label = prefs.show_net ? 'líquido' : 'bruto';
  const now = new Date();
  const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <MetricCard
        label={`${MONTHS_SHORT[now.getMonth()]} — ${label}`}
        value={BRL(prefs.show_net ? metrics.currentMonthNet : metrics.currentMonthGross)}
        sub={`${metrics.totalHoursCurrentMonth}h trabalhadas`}
      />
      <MetricCard
        label={`próximo mês — ${label}`}
        value={BRL(prefs.show_net ? metrics.nextMonthNet : metrics.nextMonthGross)}
      />
      <MetricCard
        label="média mensal"
        value={BRL(metrics.avgMonthlyGross)}
        sub="8 meses projetados"
        highlight
      />
      <MetricCard
        label="R$/h efetivo"
        value={`R$ ${metrics.effectiveHourlyRate}/h`}
        sub="inclui commute"
      />
      {metrics.provisionAmount > 0 && (
        <MetricCard
          label="provisão 13º/férias"
          value={BRL(metrics.provisionAmount)}
          sub="reservar por mês"
        />
      )}
      {commuteHoursMonth > 0 && (
        <MetricCard
          label="deslocamento/mês"
          value={`${commuteHoursMonth.toFixed(1)}h`}
          sub="ida+volta estimados"
        />
      )}
    </div>
  );
}
