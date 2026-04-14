import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Trash2, GripVertical } from "lucide-react";
import { format, isToday, isThisWeek, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/useTasks";

const CATEGORY_COLORS: Record<string, string> = {
  financeiro: "bg-emerald-100 text-emerald-700 border-emerald-200",
  profissional: "bg-blue-100 text-blue-700 border-blue-200",
  pessoal: "bg-violet-100 text-violet-700 border-violet-200",
  saude: "bg-rose-100 text-rose-700 border-rose-200",
  personal: "bg-violet-100 text-violet-700 border-violet-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  financeiro: "Financeiro",
  profissional: "Profissional",
  pessoal: "Pessoal",
  saude: "Saúde",
  personal: "Pessoal",
};

interface Props {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskCard({ task, onComplete, onDelete }: { task: Task; onComplete: (id: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const catColor = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.pessoal;
  const catLabel = CATEGORY_LABELS[task.category] || "Pessoal";
  const isOverdue = task.due_date && isBefore(new Date(task.due_date), startOfDay(new Date())) && task.status !== "done";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md",
        isOverdue && "border-destructive/40 bg-destructive/5"
      )}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium leading-tight", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", catColor)}>{catLabel}</Badge>
            {task.due_date && (
              <span className={cn("text-[11px] text-muted-foreground", isOverdue && "text-destructive font-medium")}>
                {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
              </span>
            )}
            {task.is_recurring && <span className="text-[11px] text-muted-foreground">🔁</span>}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== "done" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onComplete(task.id)}>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Column({ title, tasks, count, onComplete, onDelete }: { title: string; tasks: Task[]; count: number; onComplete: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="flex-1 min-w-[240px]">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary" className="text-[10px] h-5">{count}</Badge>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[60px]">
          {tasks.length === 0 && <p className="text-xs text-muted-foreground italic py-4 text-center">Nenhuma tarefa</p>}
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onComplete={onComplete} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskKanbanView({ tasks, onComplete, onDelete }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = useMemo(() => {
    const today: Task[] = [];
    const thisWeek: Task[] = [];
    const upcoming: Task[] = [];
    const done: Task[] = [];

    tasks.forEach((t) => {
      if (t.status === "done") {
        done.push(t);
        return;
      }
      if (!t.due_date) {
        upcoming.push(t);
        return;
      }
      const d = new Date(t.due_date);
      if (isToday(d) || isBefore(d, startOfDay(new Date()))) {
        today.push(t);
      } else if (isThisWeek(d, { weekStartsOn: 1 })) {
        thisWeek.push(t);
      } else {
        upcoming.push(t);
      }
    });

    return { today, thisWeek, upcoming, done: done.slice(0, 10) };
  }, [tasks]);

  const handleDragEnd = (_event: DragEndEvent) => {
    // Future: reorder or move between columns
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <Column title="Hoje" tasks={columns.today} count={columns.today.length} onComplete={onComplete} onDelete={onDelete} />
        <Column title="Esta semana" tasks={columns.thisWeek} count={columns.thisWeek.length} onComplete={onComplete} onDelete={onDelete} />
        <Column title="Próximas" tasks={columns.upcoming} count={columns.upcoming.length} onComplete={onComplete} onDelete={onDelete} />
        <Column title="Concluídas" tasks={columns.done} count={columns.done.length} onComplete={onComplete} onDelete={onDelete} />
      </div>
    </DndContext>
  );
}
