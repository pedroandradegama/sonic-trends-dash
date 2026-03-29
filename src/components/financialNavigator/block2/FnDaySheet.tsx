import { useEffect, useState, useMemo } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFnCalendar } from '@/hooks/useFnCalendar';
import { useFnConfig } from '@/hooks/useFnConfig';
import {
  FnShiftType, FN_SHIFT_LABELS, SHIFT_SLOT_INDICES,
  AGENDA_SHIFT_TYPES, PLANTAO_SHIFT_TYPES, SHIFT_HOURS,
} from '@/types/financialNavigator';

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

interface Props {
  dateStr: string | null;
  onClose: () => void;
}

export function FnDaySheet({ dateStr, onClose }: Props) {
  const { buildDayData, saveDayShifts, clearDayShifts } = useFnCalendar();
  const { services } = useFnConfig();

  const [selectedShifts, setSelectedShifts] = useState<FnShiftType[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const dayData = useMemo(
    () => dateStr ? buildDayData(dateStr) : null,
    [dateStr, buildDayData]
  );

  useEffect(() => {
    if (!dateStr || !dayData) return;
    const firstShift = dayData.shifts[0];
    if (firstShift) {
      setSelectedServiceId(firstShift.service_id);
      const svcShifts = dayData.shifts
        .filter(s => s.service_id === firstShift.service_id)
        .map(s => s.shift_type);
      setSelectedShifts(svcShifts);
    } else {
      setSelectedServiceId(services[0]?.id ?? '');
      setSelectedShifts([]);
    }
  }, [dateStr]);

  const dateLabel = useMemo(() => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} de ${MONTHS_SHORT[m - 1]} de ${y}`;
  }, [dateStr]);

  const toggleShift = (st: FnShiftType) => {
    setSelectedShifts(prev =>
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    );
  };

  const conflictWarning = useMemo(() => {
    if (!dayData || !selectedShifts.length) return null;
    const mySlots = new Set(selectedShifts.flatMap(st => SHIFT_SLOT_INDICES[st]));
    const otherShifts = dayData.shifts.filter(s => s.service_id !== selectedServiceId);
    for (const other of otherShifts) {
      const otherSlots = SHIFT_SLOT_INDICES[other.shift_type];
      if (otherSlots.some(idx => mySlots.has(idx))) {
        const otherSvc = services.find(s => s.id === other.service_id);
        return `Conflito com ${otherSvc?.name ?? 'outro serviço'} no mesmo slot.`;
      }
    }
    return null;
  }, [dayData, selectedShifts, selectedServiceId, services]);

  const totalValue = useMemo(() => {
    const svc = services.find(s => s.id === selectedServiceId);
    if (!svc) return 0;
    return selectedShifts.reduce((acc, st) => acc + (svc.shiftValues?.[st] ?? 0), 0);
  }, [selectedShifts, selectedServiceId, services]);

  const totalHours = useMemo(
    () => selectedShifts.reduce((acc, st) => acc + SHIFT_HOURS[st], 0),
    [selectedShifts]
  );

  const handleSave = async () => {
    if (!dateStr || !selectedServiceId) return;
    setSaving(true);
    await saveDayShifts.mutateAsync({
      date: dateStr,
      serviceId: selectedServiceId,
      shiftTypes: selectedShifts,
    });
    setSaving(false);
    onClose();
  };

  const handleClear = async () => {
    if (!dateStr) return;
    setSaving(true);
    await clearDayShifts.mutateAsync(dateStr);
    setSaving(false);
    onClose();
  };

  const renderShiftButton = (st: FnShiftType) => {
    const active = selectedShifts.includes(st);
    const svc = services.find(s => s.id === selectedServiceId);
    const value = svc?.shiftValues?.[st];
    const color = svc?.color ?? '#888880';

    return (
      <button
        key={st}
        onClick={() => toggleShift(st)}
        className={cn(
          'py-2.5 px-2 rounded-lg border text-center transition-all flex flex-col items-center gap-0.5',
          active ? 'border-[2px]' : 'border-border hover:border-border/80'
        )}
        style={active ? {
          borderColor: color,
          background: `${color}18`,
        } : {}}
      >
        <span
          className="text-xs font-medium font-body"
          style={active ? { color } : {}}
        >
          {FN_SHIFT_LABELS[st]}
        </span>
        <span className="text-[10px] text-muted-foreground font-body">
          {value ? `R$${(value / 1000).toFixed(1)}k` : '—'}
        </span>
      </button>
    );
  };

  return (
    <Sheet open={!!dateStr} onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base font-medium font-body">{dateLabel}</SheetTitle>
        </SheetHeader>

        {dayData && dayData.shifts.filter(s => s.service_id !== selectedServiceId).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-full mb-0.5 font-body">
              Outros turnos neste dia
            </span>
            {dayData.shifts
              .filter(s => s.service_id !== selectedServiceId)
              .map(s => {
                const svc = services.find(sv => sv.id === s.service_id);
                return (
                  <Badge
                    key={s.id}
                    variant="outline"
                    className="text-[10px]"
                    style={{ borderColor: svc?.color, color: svc?.color }}
                  >
                    {svc?.name} · {FN_SHIFT_LABELS[s.shift_type]}
                  </Badge>
                );
              })}
          </div>
        )}

        <div className="mb-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 font-body">
            Serviço
          </p>
          <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o serviço..." />
            </SelectTrigger>
            <SelectContent>
              {services.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: s.color }}
                    />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 font-body">
            Agenda
          </p>
          <div className="grid grid-cols-4 gap-2">
            {AGENDA_SHIFT_TYPES.map(renderShiftButton)}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 font-body">
            Plantão
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PLANTAO_SHIFT_TYPES.map(renderShiftButton)}
          </div>
        </div>

        {conflictWarning && (
          <div className="mb-3 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-xs font-medium text-destructive font-body">{conflictWarning}</p>
          </div>
        )}

        {selectedShifts.length > 0 && (
          <div className="mb-4 flex items-center justify-between bg-muted rounded-lg px-3 py-2.5">
            <div>
              <p className="text-xs text-muted-foreground font-body">
                {selectedShifts.map(s => FN_SHIFT_LABELS[s]).join(' + ')}
                {' · '}{totalHours}h
              </p>
            </div>
            <p className="text-lg font-medium font-body">
              R$ {totalValue.toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        <Button
          className="w-full mb-2"
          onClick={handleSave}
          disabled={saving || !selectedServiceId}
        >
          {saving ? 'Salvando...' : 'Salvar dia'}
        </Button>
        <Button
          variant="outline"
          className="w-full text-muted-foreground"
          onClick={handleClear}
          disabled={saving}
        >
          Limpar dia
        </Button>
      </SheetContent>
    </Sheet>
  );
}
