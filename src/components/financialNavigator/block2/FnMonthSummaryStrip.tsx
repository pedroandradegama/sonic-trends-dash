import { MonthSummary } from '@/types/financialNavigator';
import { useFnConfig } from '@/hooks/useFnConfig';

interface Props {
  summary: MonthSummary;
  year: number;
  month: number;
}

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export function FnMonthSummaryStrip({ summary, year, month }: Props) {
  const { services } = useFnConfig();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <div className="flex-shrink-0 bg-muted rounded-lg px-3 py-2.5 min-w-[110px]">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 font-body">
          {MONTHS_SHORT[month]}/{String(year).slice(2)}
        </p>
        <p className="text-base font-medium font-body">
          R$ {summary.totalGross.toLocaleString('pt-BR')}
        </p>
        <p className="text-[10px] text-muted-foreground font-body">
          {summary.shiftCount} turno{summary.shiftCount !== 1 ? 's' : ''}
          {' · '}{summary.totalHours}h
        </p>
      </div>

      {Object.entries(summary.byService).map(([svcId, data]) => {
        const svc = services.find(s => s.id === svcId);
        return (
          <div
            key={svcId}
            className="flex-shrink-0 bg-muted rounded-lg px-3 py-2.5 min-w-[110px]"
            style={{ borderLeft: `3px solid ${svc?.color ?? '#888'}` }}
          >
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate max-w-[90px] font-body">
              {svc?.name ?? '—'}
            </p>
            <p className="text-base font-medium font-body">
              R$ {data.gross.toLocaleString('pt-BR')}
            </p>
            <p className="text-[10px] text-muted-foreground font-body">
              {data.shifts} turno{data.shifts !== 1 ? 's' : ''} · {data.hours}h
            </p>
          </div>
        );
      })}
    </div>
  );
}
