import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FnShiftType, FN_SHIFT_LABELS, FN_DEFAULT_SHIFT_VALUES } from '@/types/financialNavigator';

const AGENDA_SHIFTS: FnShiftType[] = ['slot1','slot2','slot3','slot4'];
const PLANTAO_SHIFTS: FnShiftType[] = ['plantao_6h','plantao_12h','plantao_24h'];
const ALL_SHIFTS: FnShiftType[] = [...AGENDA_SHIFTS, ...PLANTAO_SHIFTS];

interface Props {
  values: Record<FnShiftType, number>;
  onChange: (v: Record<FnShiftType, number>) => void;
}

export function ShiftValuesSection({ values, onChange }: Props) {
  const [enabled, setEnabled] = useState<Record<FnShiftType, boolean>>(() =>
    Object.fromEntries(ALL_SHIFTS.map(shiftType => [shiftType, (values[shiftType] ?? 0) > 0])) as Record<FnShiftType, boolean>
  );

  const update = (key: FnShiftType, val: number) =>
    onChange({ ...values, [key]: val });

  const toggleShift = (key: FnShiftType, checked: boolean) => {
    setEnabled(prev => ({ ...prev, [key]: checked }));

    if (!checked) {
      update(key, 0);
      return;
    }

    if ((values[key] ?? 0) <= 0) {
      update(key, FN_DEFAULT_SHIFT_VALUES[key]);
    }
  };

  const renderGroup = (label: string, keys: FnShiftType[]) => (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-body">
        {label}
      </p>
      {keys.map(k => (
        <div
          key={k}
          className={cn(
            'grid grid-cols-[auto_minmax(0,1fr)_112px_auto] items-center gap-3 rounded-xl border px-3 py-3 transition-all',
            enabled[k]
              ? 'border-primary/20 bg-primary/5'
              : 'border-border/60 bg-muted/20 opacity-80'
          )}
        >
          <Checkbox
            checked={enabled[k]}
            onCheckedChange={checked => toggleShift(k, !!checked)}
            aria-label={`Ativar ${FN_SHIFT_LABELS[k]}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium font-body">{FN_SHIFT_LABELS[k]}</p>
            <p className="text-[11px] text-muted-foreground font-body">
              {enabled[k] ? 'Turno ativo nesta clínica' : 'Marque para ativar este turno'}
            </p>
          </div>
          <Input
            type="number"
            min={0}
            step={50}
            value={enabled[k] ? (values[k] ?? '') : ''}
            onChange={e => update(k, Number(e.target.value || 0))}
            placeholder={String(FN_DEFAULT_SHIFT_VALUES[k])}
            disabled={!enabled[k]}
            className="text-right"
          />
          <span className="text-xs text-muted-foreground flex-shrink-0">R$</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground font-body">
        Deixe todos os turnos apagados por padrão e ative apenas aqueles que realmente existem nesta clínica.
      </p>
      {renderGroup('Agenda', AGENDA_SHIFTS)}
      {renderGroup('Plantão', PLANTAO_SHIFTS)}
    </div>
  );
}
