import { FnTransaction } from '@/hooks/useFnOpenFinance';
import { useFnConfig } from '@/hooks/useFnConfig';
import { CheckCircle2 } from 'lucide-react';

interface Props { transactions: FnTransaction[] }

export function FnIncomeDetection({ transactions }: Props) {
  const { services } = useFnConfig();

  return (
    <div className="border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        <p className="text-sm font-medium text-teal-800 dark:text-teal-300">
          {transactions.length} receita{transactions.length !== 1 ? 's' : ''} detectada{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-2">
        {transactions.map(tx => {
          const svc = services.find(s => s.id === tx.matched_service_id);
          const [, m, d] = tx.date.split('-').map(Number);
          return (
            <div key={tx.id} className="flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-teal-800 dark:text-teal-300">
                  {tx.description}
                </span>
                {svc && (
                  <span className="text-teal-600 dark:text-teal-400 ml-1.5">
                    · {svc.name}
                  </span>
                )}
                <span className="text-teal-500 ml-1.5">{d}/{m}</span>
              </div>
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                +R$ {Math.round(tx.amount).toLocaleString('pt-BR')}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-teal-600 dark:text-teal-500 mt-2.5">
        Recebimentos identificados no extrato. Confirme no ciclo fiscal do serviço correspondente.
      </p>
    </div>
  );
}
