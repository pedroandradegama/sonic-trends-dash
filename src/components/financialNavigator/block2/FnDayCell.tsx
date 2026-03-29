import { cn } from '@/lib/utils';
import { CalendarDayData } from '@/types/financialNavigator';
import { useFnConfig } from '@/hooks/useFnConfig';

interface Props {
  dayNumber: number;
  dateStr: string;
  dayData: CalendarDayData;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function FnDayCell({
  dayNumber, dateStr, dayData, isToday, isSelected, onClick,
}: Props) {
  const { services } = useFnConfig();
  const { slotOccupancy, hasConflict, totalValue } = dayData;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-lg border overflow-hidden cursor-pointer transition-all',
        'flex flex-col min-h-[52px]',
        isSelected
          ? 'border-primary ring-1 ring-primary/30'
          : hasConflict
          ? 'border-destructive/60'
          : 'border-border hover:border-border/80',
      )}
      style={{ aspectRatio: '0.85' }}
    >
      <div className="absolute inset-0 flex flex-col">
        {slotOccupancy.map((shift, slotIdx) => {
          if (!shift) {
            return <div key={slotIdx} className="flex-1 w-full" />;
          }
          const svc = services.find(s => s.id === shift.service_id);
          const color = svc?.color ?? '#888880';
          return (
            <div
              key={slotIdx}
              className="flex-1 w-full relative"
              style={{ background: hexToRgba(color, 0.18) }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: color }}
              />
            </div>
          );
        })}
      </div>

      <span
        className={cn(
          'absolute top-1 left-1.5 text-[11px] leading-none z-10 font-body',
          isToday ? 'text-primary font-semibold' : 'text-muted-foreground',
        )}
      >
        {dayNumber}
      </span>

      {hasConflict && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive z-10" />
      )}

      {totalValue > 0 && (
        <span className="absolute bottom-0.5 right-1 text-[9px] font-medium text-muted-foreground z-10 leading-none font-body">
          {totalValue >= 1000
            ? `R$${(Math.round(totalValue / 100) / 10).toFixed(1)}k`
            : `R$${totalValue}`}
        </span>
      )}
    </div>
  );
}
