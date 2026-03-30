import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, RefreshCw } from 'lucide-react';
import { FnShiftAdjustment, FnService, FN_SHIFT_LABELS, FnShiftType } from '@/types/financialNavigator';

interface Props {
  adjustments: FnShiftAdjustment[];
  services: FnService[];
}

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

const ADJ_ICONS = {
  added:   <Plus className="h-3 w-3 text-green-600" />,
  removed: <Minus className="h-3 w-3 text-destructive" />,
  changed: <RefreshCw className="h-3 w-3 text-amber-600" />,
};

const ADJ_LABELS = {
  added:   'Adicionado',
  removed: 'Removido',
  changed: 'Alterado',
};

export function FnAdjustmentsLog({ adjustments, services }: Props) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? adjustments : adjustments.slice(0, 3);

  return (
    <div>
      <button
        className="flex items-center justify-between w-full mb-3"
        onClick={() => setExpanded(e => !e)}
      >
        <p className="text-sm font-medium text-foreground">
          Histórico de ajustes ({adjustments.length})
        </p>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <div className="space-y-2">
        {shown.map(adj => {
          const svc = services.find(s => s.id === adj.service_id);
          const [, m, d] = adj.shift_date.split('-').map(Number);
          const dateLabel = `${d} ${MONTHS_SHORT[m - 1]}`;
          const impact = adj.gross_impact;

          return (
            <div
              key={adj.id}
              className="flex items-center gap-2.5 py-2 border-b border-border/50 last:border-0"
            >
              <div className="flex-shrink-0">
                {ADJ_ICONS[adj.adjustment_type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-medium">{ADJ_LABELS[adj.adjustment_type]}</span>
                  {' · '}{dateLabel}
                  {svc && <span style={{ color: svc.color }}> · {svc.name}</span>}
                  {adj.shift_type && <span className="text-muted-foreground">
                    {' · '}{FN_SHIFT_LABELS[adj.shift_type as FnShiftType]}
                  </span>}
                </p>
                {adj.reason && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{adj.reason}</p>
                )}
              </div>
              {impact !== 0 && (
                <span className={`text-xs font-medium flex-shrink-0 ${
                  impact > 0 ? 'text-green-600' : 'text-destructive'
                }`}>
                  {impact > 0 ? '+' : ''}R$ {Math.abs(Math.round(impact)).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!expanded && adjustments.length > 3 && (
        <button
          className="text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors"
          onClick={() => setExpanded(true)}
        >
          Ver mais {adjustments.length - 3} ajustes
        </button>
      )}
    </div>
  );
}
