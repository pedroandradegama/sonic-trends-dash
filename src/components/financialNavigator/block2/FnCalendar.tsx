import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FnDayCell } from './FnDayCell';
import { FnDaySheet } from './FnDaySheet';
import { useFnCalendar } from '@/hooks/useFnCalendar';

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

interface Props {
  year: number;
  month: number;
  onNavigate: (year: number, month: number) => void;
}

export function FnCalendar({ year, month, onNavigate }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { buildDayData } = useFnCalendar();

  const navigate = (dir: 1 | -1) => {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
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
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, otherMonth: false });
    }
    return days;
  }, [year, month]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-medium min-w-[160px] text-center font-body">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground font-body">toque para editar</span>
      </div>

      <div className="grid grid-cols-7 gap-1 mt-3">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider py-1 font-body">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calDays.map((cell, idx) => {
          if (cell.otherMonth) {
            return (
              <div
                key={idx}
                className="aspect-[0.85] rounded-lg border border-border/30 opacity-20 min-h-[52px]"
              >
                <span className="text-[10px] text-muted-foreground p-1 block font-body">
                  {cell.day}
                </span>
              </div>
            );
          }
          const dayData = buildDayData(cell.dateStr!);
          return (
            <FnDayCell
              key={idx}
              dayNumber={cell.day}
              dateStr={cell.dateStr!}
              dayData={dayData}
              isToday={cell.dateStr === today}
              isSelected={cell.dateStr === selectedDate}
              onClick={() => setSelectedDate(cell.dateStr)}
            />
          );
        })}
      </div>

      <FnDaySheet
        dateStr={selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
