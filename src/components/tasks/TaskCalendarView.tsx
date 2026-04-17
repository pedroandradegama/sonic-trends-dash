import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  addMonths,
  endOfMonth,
  format,
  getDate,
  isBefore,
  isSameDay,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Task } from "@/hooks/useTasks";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CATEGORY_DOT: Record<string, string> = {
  financeiro: "bg-emerald-500",
  profissional: "bg-blue-500",
  pessoal: "bg-violet-500",
  saude: "bg-rose-500",
  personal: "bg-violet-500",
};

interface Occurrence {
  task: Task;
  date: Date;
  isProjected: boolean; // true if generated from recurrence (not the original task date)
}

/**
 * Expand a recurring task into occurrences within [from, to].
 * Supports recurrence_rule = { type: 'weekly'|'monthly'|'yearly', day?: number, end?: 'YYYY-MM-DD' }
 */
function expandTask(task: Task, from: Date, to: Date): Occurrence[] {
  const occurrences: Occurrence[] = [];
  if (!task.due_date) return occurrences;

  const startDate = parseISO(task.due_date);
  // Always include the original due_date if in range
  if (startDate >= from && startDate <= to) {
    occurrences.push({ task, date: startDate, isProjected: false });
  }

  if (!task.is_recurring || !task.recurrence_rule) return occurrences;

  const rule = task.recurrence_rule as { type?: string; day?: number; end?: string | null };
  const endLimit = rule.end ? parseISO(rule.end) : addMonths(to, 1);
  const stopAt = endLimit < to ? endLimit : to;

  let cursor = new Date(startDate);
  // Avoid infinite loops
  let safety = 0;
  while (cursor <= stopAt && safety < 200) {
    safety++;
    if (rule.type === "weekly") cursor = new Date(cursor.getTime() + 7 * 86400000);
    else if (rule.type === "monthly") cursor = addMonths(cursor, 1);
    else if (rule.type === "yearly") cursor = addMonths(cursor, 12);
    else break;

    if (cursor > stopAt) break;
    if (cursor < from) continue;
    occurrences.push({ task, date: new Date(cursor), isProjected: true });
  }

  return occurrences;
}

interface Props {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export function TaskCalendarView({ tasks, onSelectTask }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);

  const occurrences = useMemo(() => {
    // Project up to 6 months ahead so navigation forward shows them too
    const horizon = addMonths(monthEnd, 6);
    return tasks.flatMap((t) => expandTask(t, monthStart, horizon));
  }, [tasks, monthStart, monthEnd]);

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    occurrences.forEach((occ) => {
      if (occ.date < monthStart || occ.date > monthEnd) return;
      const key = format(occ.date, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(occ);
    });
    return map;
  }, [occurrences, monthStart, monthEnd]);

  const calDays = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; date: Date | null; otherMonth: boolean }[] = [];
    for (let i = 0; i < firstDow; i++) {
      const d = new Date(year, month, 0 - firstDow + i + 1);
      days.push({ day: d.getDate(), date: null, otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, date: new Date(year, month, d), otherMonth: false });
    }
    return days;
  }, [year, month]);

  const navigate = (dir: 1 | -1) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y);
  };

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
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> recorrente projetada</span>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className={cn(
            "py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
            d === "Dom" || d === "Sáb" ? "text-muted-foreground/60" : ""
          )}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calDays.map((cell, idx) => {
          if (cell.otherMonth || !cell.date) {
            return (
              <div key={idx} className="min-h-[110px] border-r border-b border-border/40 last:border-r-0 opacity-30 p-2">
                <span className="text-xs text-muted-foreground">{cell.day}</span>
              </div>
            );
          }
          const key = format(cell.date, "yyyy-MM-dd");
          const items = occurrencesByDay.get(key) ?? [];
          const isToday = isSameDay(cell.date, today);
          const isPast = isBefore(cell.date, today) && !isToday;

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[110px] border-r border-b border-border/40 last:border-r-0 p-2 flex flex-col gap-1",
                isToday && "bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-semibold",
                  isToday ? "text-primary" : isPast ? "text-muted-foreground/60" : "text-foreground"
                )}>
                  {cell.day}
                </span>
                {items.length > 3 && (
                  <Badge variant="secondary" className="h-4 text-[9px] px-1">
                    +{items.length - 3}
                  </Badge>
                )}
              </div>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {items.slice(0, 3).map((occ, i) => {
                  const dot = CATEGORY_DOT[occ.task.category] || CATEGORY_DOT.pessoal;
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectTask?.(occ.task)}
                      className={cn(
                        "w-full text-left flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate hover:bg-muted/60 transition-colors",
                        occ.isProjected && "opacity-70 italic",
                        occ.task.status === "done" && "line-through text-muted-foreground"
                      )}
                      title={occ.task.title + (occ.isProjected ? " (recorrente)" : "")}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dot)} />
                      <span className="truncate">{occ.task.title}</span>
                      {occ.isProjected && <Repeat className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
