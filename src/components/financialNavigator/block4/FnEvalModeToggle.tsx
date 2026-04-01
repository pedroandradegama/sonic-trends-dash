import { cn } from '@/lib/utils';
import { EvalMode } from '@/types/financialNavigator';

interface Props { mode: EvalMode; onChange: (m: EvalMode) => void }

export function FnEvalModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {([
        ['by_service', 'Por serviço'],
        ['by_criterion', 'Por critério'],
      ] as [EvalMode, string][]).map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={cn(
            'px-3 py-1.5 text-xs transition-colors font-body',
            mode === val
              ? 'bg-muted text-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
