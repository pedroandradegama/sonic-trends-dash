import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  semaforo: {
    status: 'green' | 'amber' | 'red' | 'no_goal';
    pct: number;
    delta: number;
  };
  goal: number;
}

const STATUS_CONFIG = {
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    text: 'text-green-800 dark:text-green-300',
    sub: 'text-green-600 dark:text-green-400',
    label: 'Acima da meta',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    text: 'text-amber-800 dark:text-amber-300',
    sub: 'text-amber-600 dark:text-amber-400',
    label: 'Próximo da meta',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    text: 'text-red-800 dark:text-red-300',
    sub: 'text-red-600 dark:text-red-400',
    label: 'Abaixo da meta',
  },
  no_goal: {
    bg: 'bg-muted',
    border: 'border-border',
    dot: 'bg-muted-foreground',
    text: 'text-foreground',
    sub: 'text-muted-foreground',
    label: 'Meta não definida',
  },
};

export function FnSemaforoCard({ semaforo, goal }: Props) {
  const cfg = STATUS_CONFIG[semaforo.status];

  return (
    <div className={cn('rounded-xl border p-5', cfg.bg, cfg.border)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-3 h-3 rounded-full flex-shrink-0 mt-0.5', cfg.dot)} />
          <div>
            <p className={cn('text-sm font-medium font-body', cfg.text)}>{cfg.label}</p>
            {goal > 0 && (
              <p className={cn('text-xs mt-0.5 font-body', cfg.sub)}>
                Meta: R$ {Math.round(goal).toLocaleString('pt-BR')} líquido/mês
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          {semaforo.status !== 'no_goal' && (
            <>
              <p className={cn('text-2xl font-medium font-display', cfg.text)}>
                {semaforo.pct}%
              </p>
              <p className={cn('text-xs font-body', cfg.sub)}>
                {semaforo.delta >= 0 ? '+' : ''}
                R$ {Math.abs(Math.round(semaforo.delta)).toLocaleString('pt-BR')}
              </p>
            </>
          )}
        </div>
      </div>

      {semaforo.status !== 'no_goal' && (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', cfg.dot)}
              style={{ width: `${Math.min(semaforo.pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={cn('text-[10px] font-body', cfg.sub)}>0%</span>
            <span className={cn('text-[10px] font-medium font-body', cfg.sub)}>Meta 100%</span>
          </div>
        </div>
      )}

      {semaforo.status === 'no_goal' && (
        <p className="text-xs text-muted-foreground mt-2 font-body">
          Defina sua meta em Configurações → Perfil pessoal para ativar o semáforo.
        </p>
      )}

      {semaforo.status === 'red' && (
        <p className={cn('text-xs mt-2 font-medium font-body', cfg.sub)}>
          Sugestão: verifique se há turnos não lançados nas Agendas ou ajuste a meta.
        </p>
      )}
    </div>
  );
}
