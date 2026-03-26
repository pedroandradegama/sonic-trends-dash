import { useState } from 'react';
import { Trash2, Plus, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  ShiftType, SHIFT_LABELS, DEFAULT_SHIFT_VALUES,
  RevenueService, SERVICE_PALETTE, SHIFT_COLORS,
} from '@/types/revenue';
import { useRevenueData } from '@/hooks/useRevenueData';
import { ClinicWizard } from './ClinicWizard';
import { cn } from '@/lib/utils';

const ALL_SHIFTS: ShiftType[] = ['manha','tarde','noite','p6','p12','p24'];

type Props = ReturnType<typeof useRevenueData>;

function ServiceCard({
  svc, index, onUpdate, onDelete,
}: {
  svc: RevenueService;
  index: number;
  onUpdate: (s: RevenueService, vals: Record<ShiftType, number>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(svc.name);
  const [delta, setDelta] = useState(String(svc.delta_months));
  const [vals, setVals] = useState<Record<ShiftType, number>>(
    svc.shiftValues ?? DEFAULT_SHIFT_VALUES
  );
  const color = SERVICE_PALETTE[index % SERVICE_PALETTE.length];

  const commit = () =>
    onUpdate({ ...svc, name, delta_months: parseInt(delta) }, vals);

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3 bg-card shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <div>
            <Input
              value={name}
              onChange={e => { e.stopPropagation(); setName(e.target.value); }}
              onBlur={commit}
              onClick={e => e.stopPropagation()}
              className="h-7 text-sm font-medium border-0 bg-transparent p-0 focus-visible:ring-0 w-40"
            />
            <p className="text-[10px] text-muted-foreground">
              {delta === '0' ? 'Recebimento imediato' : `Recebimento m+${delta}`}
              {' · '}
              {(svc as any).regime === 'clt' ? 'CLT' : 'PJ'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
            onClick={e => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 grid grid-cols-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
            <span>Turno</span>
            <span className="text-right">Valor (R$)</span>
            <span className="text-right">Recebimento</span>
          </div>

          {ALL_SHIFTS.map((st, i) => {
            const colors = SHIFT_COLORS[st];
            return (
              <div
                key={st}
                className="grid grid-cols-3 gap-2 items-center px-4 py-2 border-b border-border last:border-0"
              >
                <span className="text-xs text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ background: colors.border }} />
                  {SHIFT_LABELS[st]}
                </span>
                <Input
                  type="number"
                  value={vals[st]}
                  onChange={e => setVals(v => ({ ...v, [st]: parseInt(e.target.value) || 0 }))}
                  onBlur={commit}
                  className="h-7 text-xs text-right"
                />
                {i === 0 ? (
                  <Select value={delta} onValueChange={v => { setDelta(v); setTimeout(commit, 0); }}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">imediato</SelectItem>
                      <SelectItem value="1">m+1</SelectItem>
                      <SelectItem value="2">m+2</SelectItem>
                      <SelectItem value="3">m+3</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-[10px] text-muted-foreground text-right">
                    {delta === '0' ? 'imediato' : `m+${delta}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RevenueConfig(props: Props) {
  const { services, upsertService, deleteService } = props;
  const [showWizard, setShowWizard] = useState(false);

  const handleUpdate = (svc: RevenueService, shiftValues: Record<ShiftType, number>) => {
    upsertService.mutate({ service: svc, shiftValues });
  };

  const handleDelete = (id: string) => {
    if (confirm('Remover este serviço?')) deleteService.mutate(id);
  };

  const handleWizardComplete = (data: any) => {
    const shiftValues: Record<ShiftType, number> = { ...DEFAULT_SHIFT_VALUES };
    data.enabledShifts.forEach((st: ShiftType) => {
      if (data.regime === 'pj') {
        shiftValues[st] = data.shiftValues[st] || DEFAULT_SHIFT_VALUES[st];
      } else {
        // CLT: will be calculated dynamically, store 0 for now
        shiftValues[st] = data.monthlyGross > 0 && data.enabledShifts.length > 0
          ? Math.round(data.monthlyGross / (data.enabledShifts.length * 20))
          : 0;
      }
    });

    upsertService.mutate({
      service: {
        name: data.name,
        color: SERVICE_PALETTE[services.length % SERVICE_PALETTE.length],
        delta_months: data.deltaMonths,
        sort_order: services.length,
      } as RevenueService,
      shiftValues,
    });
    setShowWizard(false);
  };

  return (
    <div>
      {services.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm mb-2">Nenhuma clínica cadastrada</p>
          <p className="text-xs">Adicione sua primeira clínica para começar a projetar receita</p>
        </div>
      )}

      {services.map((svc, i) => (
        <ServiceCard
          key={svc.id}
          svc={svc}
          index={i}
          onUpdate={handleUpdate}
          onDelete={() => handleDelete(svc.id)}
        />
      ))}

      <Button
        variant="outline"
        className="w-full border-dashed text-muted-foreground"
        onClick={() => setShowWizard(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar clínica / serviço
      </Button>

      {showWizard && (
        <ClinicWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
          serviceCount={services.length}
        />
      )}
    </div>
  );
}
