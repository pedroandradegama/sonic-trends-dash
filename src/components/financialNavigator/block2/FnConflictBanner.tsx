import { AlertTriangle } from 'lucide-react';

interface Props { conflictDays: string[] }

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export function FnConflictBanner({ conflictDays }: Props) {
  const labels = conflictDays.map(d => {
    const [, m, day] = d.split('-').map(Number);
    return `${day}/${MONTHS_SHORT[m - 1]}`;
  });

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-xl">
      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-destructive font-body">
          Conflito de horário detectado
        </p>
        <p className="text-xs text-destructive/80 mt-0.5 font-body">
          {labels.join(', ')} — dois turnos ocupam o mesmo slot de 6h.
        </p>
      </div>
    </div>
  );
}
