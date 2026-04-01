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
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Serviço</p>
        <div className="flex gap-1.5 flex-wrap">
          {chip('Todos', prefs.filter_service === 'all', () => onSave({ filter_service: 'all' }))}
          {services.map(s => chip(s.name, prefs.filter_service === s.id, () => onSave({ filter_service: s.id }), s.color))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Regime</p>
        <div className="flex gap-1.5 flex-wrap">
          {chip('Todos', prefs.filter_regime === 'all', () => onSave({ filter_regime: 'all' }))}
          {(['pj_turno','pj_producao','clt','residencia','fellowship'] as WorkRegime[]).map(r =>
            chip(REGIME_LABELS[r], prefs.filter_regime === r, () => onSave({ filter_regime: r }))
          )}
        </div>
      </div>

      <div className="border-t border-border/50" />

      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Valor</p>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['bruto', 'liquido'] as const).map(vt => (
            <button
              key={vt}
              onClick={() => onSave({ show_net: vt === 'liquido' })}
              className={cn(
                'px-4 py-1.5 text-xs font-medium transition-colors capitalize',
                (vt === 'liquido') === prefs.show_net
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {vt}
            </button>
          ))}
        </div>
        {prefs.show_net && (
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Desconto</span>
            <Input
              type="number" min={0} max={60} step={0.5}
              value={localTax}
              onChange={e => setLocalTax(Number(e.target.value))}
              onBlur={() => onSave({ tax_rate: localTax })}
              className="w-16 h-7 text-xs text-right px-2 border-0 bg-transparent focus-visible:ring-0"
            />
            <span className="text-xs font-medium text-foreground">{localTax}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
