import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FnDayCell } from './FnDayCell';
import { FnDaySheet } from './FnDaySheet';
import { useFnCalendar } from '@/hooks/useFnCalendar';
import { cn } from '@/lib/utils';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS_FULL = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

interface Props { year: number; month: number; onNavigate: (y: number, m: number) => void }

export function FnCalendar({ year, month, onNavigate }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { buildDayData } = useFnCalendar();

  const navigate = (dir: 1 | -1) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    onNavigate(y, m);
  };

  const calDays = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; dateStr: string | null; otherMonth: boolean }[] = [];
    for (let i = 0; i < firstDow; i++) {
      const d = new Date(year, month, 0 - firstDow + i + 1);
      days.push({ day: d.getDate(), dateStr: null, otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      days.push({ day: d, dateStr, otherMonth: false });
    }
    return days;
  }, [year, month]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold text-foreground min-w-[160px] text-center">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Clique em qualquer dia para editar</p>
      </div>

      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS_FULL.map(d => (
          <div key={d} className={cn(
            'py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
            d === 'Dom' || d === 'Sáb' ? 'text-muted-foreground/60' : ''
          )}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calDays.map((cell, idx) => {
          if (cell.otherMonth) {
            return (
              <div key={idx} className="min-h-[120px] border-r border-b border-border/40 last:border-r-0 opacity-30 p-2">
                <span className="text-xs text-muted-foreground">{cell.day}</span>
              </div>
            );
          }
          const dayData = buildDayData(cell.dateStr!);
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;
          return (
            <div
              key={idx}
              className={cn(
                'min-h-[90px] border-r border-b border-border/40 cursor-pointer transition-colors',
                'last:border-r-0',
                isWeekend ? 'bg-muted/20' : '',
                selectedDate === cell.dateStr ? 'ring-2 ring-inset ring-primary' : '',
              )}
              onClick={() => setSelectedDate(cell.dateStr)}
            >
              <FnDayCell
                dayNumber={cell.day}
                dateStr={cell.dateStr!}
                dayData={dayData}
                isToday={cell.dateStr === today}
                isSelected={cell.dateStr === selectedDate}
                onClick={() => setSelectedDate(cell.dateStr)}
                expanded
              />
            </div>
          );
        })}
      </div>

      <FnDaySheet dateStr={selectedDate} onClose={() => setSelectedDate(null)} />
    </div>
  );
}
