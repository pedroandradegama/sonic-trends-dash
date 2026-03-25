import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  ShiftType, SHIFT_LABELS, DEFAULT_SHIFT_VALUES,
  RevenueService, SERVICE_PALETTE,
} from '@/types/revenue';
import { useRevenueData } from '@/hooks/useRevenueData';

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
  const [name, setName] = useState(svc.name);
  const [delta, setDelta] = useState(String(svc.delta_months));
  const [vals, setVals] = useState<Record<ShiftType, number>>(
    svc.shiftValues ?? DEFAULT_SHIFT_VALUES
  );
  const color = SERVICE_PALETTE[index % SERVICE_PALETTE.length];

  const commit = () =>
    onUpdate({ ...svc, name, delta_months: parseInt(delta) }, vals);

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <div className="flex items-center justify-between bg-muted px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={commit}
            className="h-7 text-sm font-medium border-0 bg-transparent p-0 focus-visible:ring-0 w-40"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="px-4 py-2 grid grid-cols-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
        <span>Turno</span>
        <span className="text-right">Valor (R$)</span>
        <span className="text-right">Recebimento</span>
      </div>

      {ALL_SHIFTS.map((st, i) => (
        <div
          key={st}
          className="grid grid-cols-3 gap-2 items-center px-4 py-2 border-b border-border last:border-0"
        >
          <span className="text-xs text-foreground">{SHIFT_LABELS[st]}</span>
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
      ))}
    </div>
  );
}

export function RevenueConfig(props: Props) {
  const { services, upsertService, deleteService } = props;

  const handleUpdate = (svc: RevenueService, shiftValues: Record<ShiftType, number>) => {
    upsertService.mutate({ service: svc, shiftValues });
  };

  const handleDelete = (id: string) => {
    if (confirm('Remover este serviço?')) deleteService.mutate(id);
  };

  const handleAdd = () => {
    upsertService.mutate({
      service: {
        name: 'Nova clínica',
        color: SERVICE_PALETTE[services.length % SERVICE_PALETTE.length],
        delta_months: 1,
        sort_order: services.length,
      } as RevenueService,
      shiftValues: { ...DEFAULT_SHIFT_VALUES },
    });
  };

  return (
    <div>
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
        onClick={handleAdd}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar clínica / serviço
      </Button>
    </div>
  );
}
