import { WorkMethod, METHOD_LABELS, FnProjectionPrefs } from '@/types/financialNavigator';

interface Props {
  hoursByMethod: Record<WorkMethod, number>;
  grossByMethod: Record<WorkMethod, number>;
  prefs: FnProjectionPrefs;
}

const METHOD_COLORS: Record<WorkMethod, string> = {
  us_geral:    '#378ADD',
  us_vascular: '#1D9E75',
  mamografia:  '#D4537E',
  tc:          '#BA7517',
  rm:          '#7F77DD',
  puncao:      '#D85A30',
  misto:       '#888780',
};

export function FnMethodBreakdown({ hoursByMethod, grossByMethod, prefs }: Props) {
  const activeEntries = (Object.entries(hoursByMethod) as [WorkMethod, number][])
    .filter(([, h]) => h > 0)
    .sort(([, a], [, b]) => b - a);

  if (activeEntries.length === 0) return null;

  const totalHours = activeEntries.reduce((acc, [, h]) => acc + h, 0);
  const totalGross = activeEntries.reduce((acc, [m]) => acc + (grossByMethod[m] ?? 0), 0);

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3">Produção por método</p>
      <div className="space-y-2.5">
        {activeEntries.map(([method, hours]) => {
          const gross = grossByMethod[method] ?? 0;
          const net = prefs.show_net
            ? Math.round(gross * (1 - prefs.tax_rate / 100))
            : gross;
          const pctHours = totalHours > 0 ? (hours / totalHours) * 100 : 0;
          const ticketPerHour = hours > 0 ? Math.round(gross / hours) : 0;
          const color = METHOD_COLORS[method];

          return (
            <div key={method} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  {METHOD_LABELS[method]}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(hours)}h · R$ {Math.round(net).toLocaleString('pt-BR')} · R${ticketPerHour}/h
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pctHours}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span>{Math.round(totalHours)}h total</span>
        <span>
          Ticket médio geral: R${totalHours > 0 ? Math.round(totalGross / totalHours) : 0}/h
        </span>
      </div>
    </div>
  );
}
