import { MonthProjectionPoint, FnService, FnProjectionPrefs } from '@/types/financialNavigator';

interface Props {
  receiptsByMonth: Record<string, number>;
  services: FnService[];
  projectionPoints: MonthProjectionPoint[];
  prefs: FnProjectionPrefs;
}

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export function FnReceiptTimeline({ receiptsByMonth, services, projectionPoints, prefs }: Props) {
  const now = new Date();
  const entries = Object.entries(receiptsByMonth)
    .filter(([key]) => key >= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 6);

  if (entries.length === 0) return null;

  const totalFuture = entries.reduce((acc, [, v]) => acc + v, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Quando vou receber</p>
        <p className="text-xs text-muted-foreground">
          Total projetado: R$ {Math.round(totalFuture).toLocaleString('pt-BR')}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {entries.map(([key, value]) => {
          const [y, m] = key.split('-').map(Number);
          const isCurrent = y === now.getFullYear() && m - 1 === now.getMonth();
          const label = `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}`;

          const contributors = services.filter(svc => {
            const srcMonthOffset = m - 1 - svc.payment_delta;
            let srcM = srcMonthOffset;
            let srcY = y;
            while (srcM < 0) { srcM += 12; srcY--; }
            const pt = projectionPoints.find(p => p.year === srcY && p.month === srcM);
            return (pt?.grossByService[svc.id] ?? 0) > 0;
          });

          return (
            <div
              key={key}
              className={`flex-shrink-0 rounded-lg px-3 py-2.5 min-w-[110px] ${
                isCurrent
                  ? 'bg-background border border-border'
                  : 'bg-muted'
              }`}
            >
              <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${
                isCurrent ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}{isCurrent ? ' (agora)' : ''}
              </p>
              <p className="text-base font-medium text-foreground">
                R$ {Math.round(value).toLocaleString('pt-BR')}
              </p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {contributors.map(svc => (
                  <span
                    key={svc.id}
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `${svc.color}20`,
                      color: svc.color,
                      border: `0.5px solid ${svc.color}60`,
                    }}
                  >
                    {svc.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
