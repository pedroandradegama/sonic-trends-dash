import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { FnService, FnProjectionPrefs, WorkRegime, REGIME_LABELS } from '@/types/financialNavigator';

interface Props {
  prefs: FnProjectionPrefs;
  services: FnService[];
  onSave: (p: Partial<FnProjectionPrefs>) => void;
}

export function FnProjectionFilters({ prefs, services, onSave }: Props) {
  const [localTax, setLocalTax] = useState(prefs.tax_rate);

  const chip = (
    label: string,
    active: boolean,
    onClick: () => void,
    color?: string,
  ) => (
    <button
      key={label}
      onClick={onClick}
      className={cn(
        'px-3 py-1 text-xs rounded-full border transition-colors flex-shrink-0',
        active
          ? 'bg-muted border-border font-medium text-foreground'
          : 'border-transparent text-muted-foreground hover:bg-muted/50',
      )}
      style={active && color ? { borderColor: color, color } : {}}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Filtro por serviço */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {chip('Todos os serviços', prefs.filter_service === 'all', () =>
          onSave({ filter_service: 'all' }))}
        {services.map(s =>
          chip(s.name, prefs.filter_service === s.id, () =>
            onSave({ filter_service: s.id }), s.color)
        )}
      </div>

      {/* Filtro por regime */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {chip('Todos os regimes', prefs.filter_regime === 'all', () =>
          onSave({ filter_regime: 'all' }))}
        {(['pj_turno','pj_producao','clt','residencia','fellowship'] as WorkRegime[]).map(r =>
          chip(REGIME_LABELS[r], prefs.filter_regime === r, () =>
            onSave({ filter_regime: r }))
        )}
      </div>

      {/* Toggle bruto / líquido + campo tributário */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['bruto','liquido'] as const).map(vt => (
          <button
            key={vt}
            onClick={() => onSave({ show_net: vt === 'liquido' })}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg border transition-colors',
              (vt === 'liquido') === prefs.show_net
                ? 'bg-muted border-border font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:bg-muted/50',
            )}
          >
            Valor {vt}
          </button>
        ))}

        {prefs.show_net && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Desconto total</span>
            <Input
              type="number"
              min={0} max={60} step={0.5}
              value={localTax}
              onChange={e => setLocalTax(Number(e.target.value))}
              onBlur={() => onSave({ tax_rate: localTax })}
              className="w-16 h-7 text-xs text-right px-2"
            />
            <span className="text-xs text-muted-foreground">%</span>
            <span className="text-[10px] text-muted-foreground">
              (−{localTax}% aplicado)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
