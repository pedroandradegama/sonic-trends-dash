import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FiscalMode, WorkRegime, FISCAL_MODE_LABELS } from '@/types/financialNavigator';

interface Props {
  regime: WorkRegime;
  fiscalMode: FiscalMode;
  fiscalPctTotal: number;
  fiscalPctBase: number;
  fiscalFixedCosts: number;
  onChange: (updates: Partial<{
    fiscal_mode: FiscalMode;
    fiscal_pct_total: number;
    fiscal_pct_base: number;
    fiscal_fixed_costs: number;
  }>) => void;
}

export function FiscalConfigSection({
  regime, fiscalMode, fiscalPctTotal, fiscalPctBase, fiscalFixedCosts, onChange,
}: Props) {
  if (regime === 'fellowship') {
    return (
      <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground font-body">
        Fellowship não remunerado — sem configuração fiscal necessária.
      </div>
    );
  }

  if (regime === 'clt' || regime === 'residencia') {
    return (
      <div className="p-4 bg-muted rounded-lg space-y-1.5">
        <p className="text-sm font-medium font-body">Retenção na fonte automática</p>
        <p className="text-xs text-muted-foreground font-body">
          INSS (alíquota progressiva) + IRRF (tabela 2024) calculados automaticamente
          sobre o salário informado. Nenhuma configuração adicional necessária.
        </p>
      </div>
    );
  }

  const modes: FiscalMode[] = ['A', 'B', 'C'];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Modo de configuração fiscal</Label>
        {modes.map(m => (
          <button
            key={m}
            onClick={() => onChange({ fiscal_mode: m })}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-all',
              fiscalMode === m
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-border/80'
            )}
          >
            <p className="text-xs font-medium font-body">Modo {m}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-body">
              {FISCAL_MODE_LABELS[m]}
            </p>
          </button>
        ))}
      </div>

      {fiscalMode === 'A' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Percentual total de desconto (%)</Label>
          <Input
            type="number"
            min={0} max={50} step={0.5}
            value={fiscalPctTotal}
            onChange={e => onChange({ fiscal_pct_total: Number(e.target.value) })}
          />
          <p className="text-[11px] text-muted-foreground font-body">
            Cobre impostos + contador + todas as despesas PJ.
          </p>
        </div>
      )}

      {(fiscalMode === 'B' || fiscalMode === 'C') && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">% sobre o valor da NF</Label>
            <Input
              type="number"
              min={0} max={30} step={0.5}
              value={fiscalPctBase}
              onChange={e => onChange({ fiscal_pct_base: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Despesas fixas mensais (R$)</Label>
            <Input
              type="number"
              min={0} step={50}
              value={fiscalFixedCosts}
              onChange={e => onChange({ fiscal_fixed_costs: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground font-body">
              Total das despesas fixas. Detalhe na aba Despesas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
