import { useState } from 'react';
import { useFnOpenFinance } from '@/hooks/useFnOpenFinance';
import { useFnConfig } from '@/hooks/useFnConfig';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';

export function FnTransactionList() {
  const { transactions, classifyTransaction } = useFnOpenFinance();
  const { services } = useFnConfig();
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'credit' | 'unclassified'>('all');

  const filtered = transactions.filter(tx => {
    if (filter === 'credit') return tx.is_credit_card;
    if (filter === 'unclassified') return tx.is_pj_expense === null || tx.is_pj_expense === undefined;
    return true;
  });

  const shown = expanded ? filtered : filtered.slice(0, 15);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Transações</p>
        <div className="flex gap-1">
          {(['all','credit','unclassified'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 text-[10px] rounded-lg border transition-colors',
                filter === f
                  ? 'bg-muted border-border font-medium text-foreground'
                  : 'border-transparent text-muted-foreground'
              )}
            >
              {f === 'all' ? 'Todas' : f === 'credit' ? 'Cartão' : 'Não classificadas'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        {shown.map(tx => {
          const isDebit = tx.amount < 0;
          const absAmount = Math.abs(tx.amount);
          const [, m, d] = tx.date.split('-').map(Number);
          const dateLabel = `${d}/${m}`;

          return (
            <div
              key={tx.id}
              className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0 group"
            >
              <div className={cn(
                'w-1.5 h-8 rounded-full flex-shrink-0',
                tx.detected_as_income ? 'bg-teal-500'
                : tx.is_pj_expense ? 'bg-blue-400'
                : tx.is_credit_card ? 'bg-violet-400'
                : 'bg-muted-foreground/30'
              )} />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {tx.merchant_name || tx.description}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
                  {tx.category && (
                    <span className="text-[10px] text-muted-foreground">· {tx.category}</span>
                  )}
                  {tx.total_installments && tx.total_installments > 1 && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {tx.installment_number}/{tx.total_installments}x
                    </Badge>
                  )}
                  {tx.is_pj_expense && (
                    <Badge className="text-[9px] px-1 py-0 h-4 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                      PJ
                    </Badge>
                  )}
                </div>
              </div>

              <span className={cn(
                'text-sm font-medium flex-shrink-0',
                !isDebit ? 'text-green-600 dark:text-green-400' : 'text-foreground'
              )}>
                {!isDebit ? '+' : ''}R$ {absAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>

              {isDebit && (tx.is_pj_expense === null || tx.is_pj_expense === undefined) && (
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => classifyTransaction.mutate({ txId: tx.id, isPjExpense: true })}
                  title="Marcar como despesa PJ"
                >
                  <Tag className="h-3.5 w-3.5 text-muted-foreground hover:text-blue-500" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length > 15 && (
        <button
          className="w-full mt-3 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded
            ? <><ChevronUp className="h-3.5 w-3.5" />Mostrar menos</>
            : <><ChevronDown className="h-3.5 w-3.5" />Ver mais {filtered.length - 15} transações</>}
        </button>
      )}
    </div>
  );
}
