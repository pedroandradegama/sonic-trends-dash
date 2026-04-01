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
  expanded?: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SLOT_TIMES = ['7h', '13h', '19h', '1h'];

export function FnDayCell({ dayNumber, dayData, isToday, expanded, onClick }: Props) {
  const { services } = useFnConfig();
  const { slotOccupancy, hasConflict, totalValue } = dayData;

  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1" onClick={onClick}>
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
          isToday
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground'
        )}>
          {dayNumber}
        </span>
        {hasConflict && (
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
        )}
      </div>

      {expanded && (
        <div className="flex flex-col gap-0.5 flex-1">
          {slotOccupancy.map((shift, slotIdx) => {
            const svc = shift ? services.find(s => s.id === shift.service_id) : null;
            const color = svc?.color ?? null;
            return (
              <div
                key={slotIdx}
                className={cn(
                  'flex-1 rounded-sm flex items-center px-1 min-h-[12px]',
                  !color ? 'bg-transparent' : ''
                )}
                style={color ? {
                  background: hexToRgba(color, 0.15),
                  borderLeft: `2px solid ${color}`,
                } : {
                  borderLeft: '2px solid transparent',
                }}
                title={`${SLOT_TIMES[slotIdx]}${svc ? ` — ${svc.name}` : ''}`}
              >
                {color && svc && (
                  <span className="text-[8px] font-medium truncate" style={{ color }}>
                    {svc.name.split(' ')[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalValue > 0 && (
        <span className="text-[9px] font-semibold text-muted-foreground text-right leading-none">
          R${Math.round(totalValue / 1000)}k
        </span>
      )}
    </div>
  );
}
