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
  ShiftType, SHIFT_LABELS, SHIFT_COLORS, AGENDA_SHIFTS, PLANTAO_SHIFTS,
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
          <span className="text-base font-medium font-display">
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

      {/* Service legend */}
      {services.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {services.map(svc => (
            <span key={svc.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: svc.color }} />
              {svc.name}
            </span>
          ))}
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calDays.map((cell, idx) => {
          const isToday = cell.key === dkey(
            new Date().getFullYear(), new Date().getMonth(), new Date().getDate()
          );
          const dayShifts = cell.key ? getShiftsForDate(cell.key) : [];

          // Group shifts by service
          const svcShifts: Record<string, { svc: typeof services[0]; shifts: typeof dayShifts }> = {};
          dayShifts.forEach(ds => {
            const svc = services.find(s => s.id === ds.service_id);
            if (!svc) return;
            if (!svcShifts[svc.id]) svcShifts[svc.id] = { svc, shifts: [] };
            svcShifts[svc.id].shifts.push(ds);
          });

          const dayVal = dayShifts.reduce((a, ds) => {
            const svc = services.find(s => s.id === ds.service_id);
            return a + (svc?.shiftValues?.[ds.shift_type] ?? 0);
          }, 0);

          const svcEntries = Object.values(svcShifts);

          return (
            <div
              key={idx}
              onClick={() => cell.key && !cell.otherMonth && openSheet(cell.key)}
              className={cn(
                'relative rounded-xl overflow-hidden cursor-pointer transition-all',
                'flex flex-col backdrop-blur-sm',
                cell.otherMonth ? 'opacity-20 pointer-events-none' : '',
                isToday
                  ? 'border-2 border-primary/40 shadow-md'
                  : 'border border-border/60 hover:border-primary/20 hover:shadow-sm',
                dayShifts.length === 0 ? 'bg-white/80' : 'bg-white/60'
              )}
              style={{ aspectRatio: '0.85', minHeight: '52px' }}
            >
              {/* Service color background - split evenly between services */}
              {svcEntries.length > 0 && (
                <div className="absolute inset-0 flex flex-col">
                  {svcEntries.map(({ svc }) => (
                    <div
                      key={svc.id}
                      className="flex-1 w-full"
                      style={{ background: `${svc.color}22` }}
                    />
                  ))}
                </div>
              )}

              {/* Left color strip per service */}
              {svcEntries.length > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] flex flex-col">
                  {svcEntries.map(({ svc }) => (
                    <div key={svc.id} className="flex-1" style={{ background: svc.color }} />
                  ))}
                </div>
              )}

              <span
                className={cn(
                  'absolute top-1 left-1.5 text-[11px] z-10 leading-none font-medium',
                  isToday ? 'text-primary' : 'text-foreground/70'
                )}
              >
                {cell.day}
              </span>

              {/* Service name labels */}
              {svcEntries.length > 0 && (
                <div className="absolute left-1.5 top-4 z-10 flex flex-col gap-0.5 max-w-[calc(100%-8px)]">
                  {svcEntries.slice(0, 2).map(({ svc }) => (
                    <span
                      key={svc.id}
                      className="text-[7px] leading-tight font-medium truncate block"
                      style={{ color: svc.color }}
                    >
                      {svc.name}
                    </span>
                  ))}
                  {svcEntries.length > 2 && (
                    <span className="text-[7px] text-muted-foreground">+{svcEntries.length - 2}</span>
                  )}
                </div>
              )}

              {dayVal > 0 && (
                <span className="absolute bottom-1 right-1 text-[9px] font-medium text-foreground/60 z-10 leading-none">
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
