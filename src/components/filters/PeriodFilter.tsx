import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, startOfYear, isAfter, isBefore, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodType = 'today' | '7d' | 'mtd' | 'ytd' | 'custom' | 'month' | 'all';

interface PeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (start: Date, end: Date) => void;
  customMonth?: string;
  onCustomMonthChange?: (month: string) => void;
  dataMinDate?: Date | null;
  dataMaxDate?: Date | null;
}

export function PeriodFilter({ 
  period, 
  onPeriodChange, 
  startDate, 
  endDate, 
  onDateRangeChange,
  customMonth,
  onCustomMonthChange,
  dataMinDate,
  dataMaxDate
}: PeriodFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);

  const handleCustomDateApply = () => {
    if (tempStartDate && tempEndDate && onDateRangeChange) {
      onDateRangeChange(tempStartDate, tempEndDate);
      setIsCalendarOpen(false);
    }
  };

  // Check if a period has data available
  const periodAvailability = useMemo(() => {
    if (!dataMinDate || !dataMaxDate) {
      return { today: true, '7d': true, mtd: true, ytd: true, month: true, custom: true };
    }

    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);
    const sevenDaysAgo = startOfDay(subDays(now, 7));
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    // Check if data range overlaps with period range
    const hasOverlap = (periodStart: Date, periodEnd: Date) => {
      return !(isAfter(periodStart, dataMaxDate) || isBefore(periodEnd, dataMinDate));
    };

    return {
      today: hasOverlap(today, todayEnd),
      '7d': hasOverlap(sevenDaysAgo, todayEnd),
      mtd: hasOverlap(monthStart, todayEnd),
      ytd: hasOverlap(yearStart, todayEnd),
      month: true, // Always allow month selection, we'll filter months
      custom: true, // Always allow custom
    };
  }, [dataMinDate, dataMaxDate]);

  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMMM yyyy', { locale: ptBR });
      
      // Check if this month has data
      let hasData = true;
      if (dataMinDate && dataMaxDate) {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        hasData = !(isAfter(monthStart, dataMaxDate) || isBefore(monthEnd, dataMinDate));
      }
      
      months.push({ value: monthKey, label: monthLabel, hasData });
    }
    return months;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <Select value={period} onValueChange={(value: PeriodType) => onPeriodChange(value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            value="today" 
            disabled={!periodAvailability.today}
            className={!periodAvailability.today ? "opacity-50" : ""}
          >
            Hoje
          </SelectItem>
          <SelectItem 
            value="7d"
            disabled={!periodAvailability['7d']}
            className={!periodAvailability['7d'] ? "opacity-50" : ""}
          >
            Últimos 7 dias
          </SelectItem>
          <SelectItem 
            value="mtd"
            disabled={!periodAvailability.mtd}
            className={!periodAvailability.mtd ? "opacity-50" : ""}
          >
            Mês atual
          </SelectItem>
          <SelectItem 
            value="ytd"
            disabled={!periodAvailability.ytd}
            className={!periodAvailability.ytd ? "opacity-50" : ""}
          >
            Ano atual
          </SelectItem>
          <SelectItem value="month">Por mês</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {period === 'month' && onCustomMonthChange && (
        <Select value={customMonth} onValueChange={onCustomMonthChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {generateMonthOptions().map(month => (
              <SelectItem 
                key={month.value} 
                value={month.value}
                disabled={!month.hasData}
                className={!month.hasData ? "opacity-50" : ""}
              >
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {period === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-60 justify-start text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate && endDate ? (
                `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
              ) : (
                "Selecionar período"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data inicial</label>
                  <Calendar
                    mode="single"
                    selected={tempStartDate}
                    onSelect={setTempStartDate}
                    locale={ptBR}
                    className="rounded-md border"
                    disabled={(date) => {
                      if (dataMinDate && isBefore(date, dataMinDate)) return true;
                      if (dataMaxDate && isAfter(date, dataMaxDate)) return true;
                      return false;
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data final</label>
                  <Calendar
                    mode="single"
                    selected={tempEndDate}
                    onSelect={setTempEndDate}
                    locale={ptBR}
                    className="rounded-md border"
                    disabled={(date) => {
                      if (dataMinDate && isBefore(date, dataMinDate)) return true;
                      if (dataMaxDate && isAfter(date, dataMaxDate)) return true;
                      return false;
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCalendarOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCustomDateApply} disabled={!tempStartDate || !tempEndDate}>
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}