import { PiggyBank } from 'lucide-react';

interface Props {
  provisionAmount: number;
  include13th: boolean;
  includeVacation: boolean;
  netMonthly: number;
}

export function FnProvisionCard({
  provisionAmount, include13th, includeVacation, netMonthly,
}: Props) {
  const thirteenthMonthly = include13th ? Math.round(netMonthly / 12) : 0;
  const vacationMonthly = includeVacation ? Math.round((netMonthly / 12) * (4 / 3)) : 0;

  return (
    <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <PiggyBank className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Provisão mensal sugerida
        </p>
      </div>
      <div className="space-y-1.5 text-xs text-amber-700 dark:text-amber-400">
        {include13th && (
          <div className="flex justify-between">
            <span>Equivalente 13º salário (1/12)</span>
            <span className="font-medium">
              R$ {thirteenthMonthly.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
        {includeVacation && (
          <div className="flex justify-between">
            <span>Equivalente férias (1/12 × 1⅓)</span>
            <span className="font-medium">
              R$ {vacationMonthly.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
        <div className="flex justify-between pt-1.5 border-t border-amber-200 dark:border-amber-800 font-medium">
          <span>Total a reservar por mês</span>
          <span>R$ {Math.round(provisionAmount).toLocaleString('pt-BR')}</span>
        </div>
      </div>
      <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2">
        Reserve em conta separada. Configure em Bloco 1 → Perfil pessoal.
      </p>
    </div>
  );
}
