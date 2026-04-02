import { SpendingSummary } from '@/hooks/useFnOpenFinance';

interface Props {
  summary: SpendingSummary;
  projectedIncome: number;
}

const BRL = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

export function FnSpendingDashboard({ summary, projectedIncome }: Props) {
  const { total_spending, total_income, savings_rate, by_category, credit_card_total, pj_expenses } = summary;

  const srColor = (savings_rate ?? 0) >= 20 ? 'text-green-600 dark:text-green-400'
               : (savings_rate ?? 0) >= 5  ? 'text-amber-600 dark:text-amber-400'
               : 'text-destructive';

  const topCats = Object.entries(by_category ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxCat = topCats[0]?.[1] ?? 1;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted rounded-xl p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Receita real
          </p>
          <p className="text-base font-semibold text-green-700 dark:text-green-400">
            {BRL(total_income)}
          </p>
          {projectedIncome > 0 && (
            <p className="text-[10px] text-muted-foreground">
              projetado {BRL(projectedIncome)}
            </p>
          )}
        </div>
        <div className="bg-muted rounded-xl p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Total gastos
          </p>
          <p className="text-base font-semibold text-foreground">{BRL(total_spending)}</p>
          {credit_card_total > 0 && (
            <p className="text-[10px] text-muted-foreground">
              cartão {BRL(credit_card_total)}
            </p>
          )}
        </div>
        <div className="bg-muted rounded-xl p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Índice de poupança
          </p>
          <p className={`text-base font-semibold ${srColor}`}>
            {savings_rate != null ? `${savings_rate}%` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {(savings_rate ?? 0) >= 20 ? 'Ótimo' : (savings_rate ?? 0) >= 5 ? 'Atenção' : 'Crítico'}
          </p>
        </div>
        {pj_expenses > 0 && (
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Despesas PJ
            </p>
            <p className="text-base font-semibold text-foreground">{BRL(pj_expenses)}</p>
            <p className="text-[10px] text-muted-foreground">dedutíveis</p>
          </div>
        )}
      </div>

      {topCats.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-3">Gastos por categoria</p>
          <div className="space-y-2">
            {topCats.map(([cat, val]) => (
              <div key={cat} className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground w-28 truncate flex-shrink-0">{cat}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all"
                    style={{ width: `${(val / maxCat) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-20 text-right flex-shrink-0">
                  {BRL(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
