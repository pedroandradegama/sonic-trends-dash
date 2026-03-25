import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ShiftType, SHIFT_LABELS, SHIFT_SLOT_MAP, SLOT_BG_COLORS,
  SHIFT_COLORS, AGENDA_SHIFTS, PLANTAO_SHIFTS,
  MonthSummary,
} from '@/types/revenue';
import { useRevenueData } from '@/hooks/useRevenueData';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

type Props = ReturnType<typeof useRevenueData>;

export function RevenueCalendar(props: Props) {
  const { services, getShiftsForDate, saveShiftsForDay, clearDay } = props;
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(new Date().getMonth());
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [draftShifts, setDraftShifts] = useState<ShiftType[]>([]);
  const [draftSvcId, setDraftSvcId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const navigate = (dir: 1 | -1) => {
    let m = curMonth + dir;
    let y = curYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCurMonth(m); setCurYear(y);
  };

  const dkey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const calDays = useMemo(() => {
    const first = new Date(curYear, curMonth, 1).getDay();
    const total = new Date(curYear, curMonth + 1, 0).getDate();
    const days: { day: number; key: string | null; otherMonth: boolean }[] = [];
    for (let i = 0; i < first; i++) {
      const d = new Date(curYear, curMonth, 0 - first + i + 1);
      days.push({ day: d.getDate(), key: null, otherMonth: true });
    }
    for (let d = 1; d <= total; d++) {
      days.push({ day: d, key: dkey(curYear, curMonth, d), otherMonth: false });
    }
    return days;
  }, [curYear, curMonth]);

  const monthSummary = useMemo((): MonthSummary => {
    const bySvc: Record<string, number> = {};
    const byShift = {} as Record<ShiftType, number>;
    let total = 0; let shiftCount = 0;
    calDays.forEach(({ key }) => {
      if (!key) return;
      const dayShifts = getShiftsForDate(key);
      dayShifts.forEach(s => {
        const svc = services.find(sv => sv.id === s.service_id);
        const val = svc?.shiftValues?.[s.shift_type] ?? 0;
        total += val;
        shiftCount++;
        bySvc[s.service_id] = (bySvc[s.service_id] ?? 0) + val;
        byShift[s.shift_type] = (byShift[s.shift_type] ?? 0) + val;
      });
    });
    return { total, shiftCount, bySvc, byShift };
  }, [calDays, getShiftsForDate, services]);

  const openSheet = (key: string) => {
    const dayShifts = getShiftsForDate(key);
    setDraftShifts(dayShifts.map(s => s.shift_type));
    setDraftSvcId(dayShifts[0]?.service_id ?? services[0]?.id ?? '');
    setSheetDate(key);
  };

  const toggleShift = (st: ShiftType) => {
    setDraftShifts(prev =>
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    );
  };

  const handleSave = async () => {
    if (!sheetDate) return;
    setSaving(true);
    await saveShiftsForDay.mutateAsync({
      date: sheetDate, shiftTypes: draftShifts, serviceId: draftSvcId,
    });
    setSaving(false);
    setSheetDate(null);
  };

  const handleClear = async () => {
    if (!sheetDate) return;
    setSaving(true);
    await clearDay.mutateAsync(sheetDate);
    setSaving(false);
    setSheetDate(null);
  };

  const sheetDateObj = sheetDate ? new Date(sheetDate + 'T12:00:00') : null;
  const sheetLabel = sheetDateObj
    ? `${sheetDateObj.getDate()} de ${MONTHS_SHORT[sheetDateObj.getMonth()]} de ${sheetDateObj.getFullYear()}`
    : '';

  const draftValue = useMemo(() => {
    const svc = services.find(s => s.id === draftSvcId);
    if (!svc || draftShifts.length === 0) return 0;
    return draftShifts.reduce((acc, st) => acc + (svc.shiftValues?.[st] ?? 0), 0);
  }, [draftShifts, draftSvcId, services]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-medium">
            {MONTHS[curMonth]} {curYear}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">toque para configurar</span>
      </div>

      {/* Summary strip */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <div className="flex-shrink-0 bg-muted rounded-lg px-3 py-2 min-w-[100px]">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Projetado</p>
          <p className="text-base font-medium">R$ {monthSummary.total.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-muted-foreground">{monthSummary.shiftCount} turno{monthSummary.shiftCount !== 1 ? 's' : ''}</p>
        </div>
        {Object.entries(monthSummary.bySvc).slice(0, 3).map(([svcId, val]) => {
          const svc = services.find(s => s.id === svcId);
          return (
            <div key={svcId} className="flex-shrink-0 bg-muted rounded-lg px-3 py-2 min-w-[100px]">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 truncate max-w-[90px]">{svc?.name ?? '—'}</p>
              <p className="text-base font-medium">R$ {val.toLocaleString('pt-BR')}</p>
            </div>
          );
        })}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calDays.map((cell, idx) => {
          const isToday = cell.key === dkey(
            new Date().getFullYear(), new Date().getMonth(), new Date().getDate()
          );
          const dayShifts = cell.key ? getShiftsForDate(cell.key) : [];
          const svc = dayShifts[0] ? services.find(s => s.id === dayShifts[0].service_id) : null;

          const slotColors: (string | null)[] = [null, null, null, null];
          dayShifts.forEach(ds => {
            const slots = SHIFT_SLOT_MAP[ds.shift_type];
            slots.forEach(si => { slotColors[si] = SLOT_BG_COLORS[ds.shift_type]; });
          });

          const dayVal = svc
            ? dayShifts.reduce((a, ds) => a + (svc.shiftValues?.[ds.shift_type] ?? 0), 0)
            : 0;

          return (
            <div
              key={idx}
              onClick={() => cell.key && !cell.otherMonth && openSheet(cell.key)}
              className={cn(
                'relative rounded-lg border overflow-hidden cursor-pointer transition-colors',
                'flex flex-col',
                cell.otherMonth ? 'opacity-25 pointer-events-none' : '',
                isToday ? 'border-primary/40' : 'border-border',
              )}
              style={{ aspectRatio: '0.85', minHeight: '52px' }}
            >
              <div className="absolute inset-0 flex flex-col">
                {slotColors.map((color, si) => (
                  <div
                    key={si}
                    className="flex-1 w-full"
                    style={{ background: color ?? 'transparent' }}
                  />
                ))}
              </div>

              <span
                className={cn(
                  'absolute top-1 left-1.5 text-[11px] z-10 leading-none',
                  isToday ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {cell.day}
              </span>

              {dayVal > 0 && (
                <span className="absolute bottom-1 right-1 text-[9px] font-medium text-muted-foreground z-10 leading-none">
                  R${(Math.round(dayVal / 100) / 10).toFixed(1)}k
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Day Sheet */}
      <Sheet open={!!sheetDate} onOpenChange={open => !open && setSheetDate(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base font-medium">{sheetLabel}</SheetTitle>
          </SheetHeader>

          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Agenda
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {AGENDA_SHIFTS.map(st => {
              const active = draftShifts.includes(st);
              const colors = SHIFT_COLORS[st];
              return (
                <button
                  key={st}
                  onClick={() => toggleShift(st)}
                  className={cn(
                    'py-2.5 px-2 rounded-lg border text-center transition-all',
                    'flex flex-col items-center gap-0.5'
                  )}
                  style={active ? {
                    borderColor: colors.border,
                    background: colors.bg,
                  } : {}}
                >
                  <span className="text-xs font-medium" style={active ? { color: colors.text } : {}}>
                    {SHIFT_LABELS[st]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {services.find(s => s.id === draftSvcId)?.shiftValues?.[st]
                      ? `R$${((services.find(s => s.id === draftSvcId)!.shiftValues![st]) / 1000).toFixed(1)}k`
                      : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Plantão
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {PLANTAO_SHIFTS.map(st => {
              const active = draftShifts.includes(st);
              const colors = SHIFT_COLORS[st];
              return (
                <button
                  key={st}
                  onClick={() => toggleShift(st)}
                  className={cn(
                    'py-2.5 px-2 rounded-lg border text-center transition-all',
                    'flex flex-col items-center gap-0.5'
                  )}
                  style={active ? {
                    borderColor: colors.border,
                    background: colors.bg,
                  } : {}}
                >
                  <span className="text-xs font-medium" style={active ? { color: colors.text } : {}}>
                    {SHIFT_LABELS[st]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {services.find(s => s.id === draftSvcId)?.shiftValues?.[st]
                      ? `R$${((services.find(s => s.id === draftSvcId)!.shiftValues![st]) / 1000).toFixed(1)}k`
                      : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {draftShifts.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Serviço / clínica
              </p>
              <Select value={draftSvcId} onValueChange={setDraftSvcId}>
                <SelectTrigger className="mb-2">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {draftValue > 0 && (
                <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">
                    {draftShifts.map(s => SHIFT_LABELS[s]).join(' + ')}
                  </span>
                  <span className="text-lg font-medium">
                    R$ {draftValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          )}

          <Button className="w-full mb-2" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar dia'}
          </Button>
          <Button variant="outline" className="w-full text-muted-foreground" onClick={handleClear} disabled={saving}>
            Limpar dia
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
