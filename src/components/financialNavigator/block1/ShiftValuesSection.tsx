import { Input } from '@/components/ui/input';
import { FnShiftType, FN_SHIFT_LABELS, FN_DEFAULT_SHIFT_VALUES } from '@/types/financialNavigator';

const AGENDA_SHIFTS: FnShiftType[] = ['slot1','slot2','slot3','slot4'];
const PLANTAO_SHIFTS: FnShiftType[] = ['plantao_6h','plantao_12h','plantao_24h'];

interface Props {
  values: Record<FnShiftType, number>;
  onChange: (v: Record<FnShiftType, number>) => void;
}

export function ShiftValuesSection({ values, onChange }: Props) {
  const update = (key: FnShiftType, val: number) =>
    onChange({ ...values, [key]: val });

  const renderGroup = (label: string, keys: FnShiftType[]) => (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-body">
        {label}
      </p>
      {keys.map(k => (
        <div key={k} className="flex items-center gap-3">
          <span className="text-sm w-28 flex-shrink-0 font-body">{FN_SHIFT_LABELS[k]}</span>
          <Input
            type="number"
            min={0}
            step={50}
            value={values[k] ?? FN_DEFAULT_SHIFT_VALUES[k]}
            onChange={e => update(k, Number(e.target.value))}
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
        Valor médio recebido por tipo de turno neste serviço.
      </p>
      {renderGroup('Agenda', AGENDA_SHIFTS)}
      {renderGroup('Plantão', PLANTAO_SHIFTS)}
    </div>
  );
}
