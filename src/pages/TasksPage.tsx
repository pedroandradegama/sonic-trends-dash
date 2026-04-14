import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, CalendarDays, List } from "lucide-react";
import { TaskCreateDialog } from "@/components/tasks/TaskCreateDialog";
import { TaskKanbanView } from "@/components/tasks/TaskKanbanView";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";
import { format, isToday, isThisWeek, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  financeiro: "bg-emerald-100 text-emerald-700",
  profissional: "bg-blue-100 text-blue-700",
  pessoal: "bg-violet-100 text-violet-700",
  saude: "bg-rose-100 text-rose-700",
  personal: "bg-violet-100 text-violet-700",
};
const CATEGORY_LABELS: Record<string, string> = {
  financeiro: "Financeiro",
  profissional: "Profissional",
  pessoal: "Pessoal",
  saude: "Saúde",
  personal: "Pessoal",
};

export default function TasksPage() {
  const { data: tasks, isLoading, complete, delete: deleteTask } = useTasks();

  const handleComplete = async (id: string) => {
    try {
      await complete(id);
      toast.success("Tarefa concluída!");
    } catch {
      toast.error("Erro ao concluir tarefa");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success("Tarefa excluída");
    } catch {
      toast.error("Erro ao excluir tarefa");
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Minhas Tarefas</h1>
          <p className="page-description">Gerencie suas atividades e compromissos</p>
        </div>
        <TaskCreateDialog />
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban" className="gap-1.5"><Kanban className="h-4 w-4" /> Kanban</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Calendário</TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5"><List className="h-4 w-4" /> Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <TaskKanbanView tasks={tasks} onComplete={handleComplete} onDelete={handleDelete} />
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground text-sm">
            Visualização de calendário em breve.
          </div>
        </TabsContent>

        <TabsContent value="list">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Carregando...</div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground text-sm">
              Nenhuma tarefa criada ainda.
            </div>
          ) : (
            <div className="rounded-2xl border bg-card divide-y">
              {tasks.map((t) => {
                const catColor = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.pessoal;
                const catLabel = CATEGORY_LABELS[t.category] || "Pessoal";
                const isOverdue = t.due_date && isBefore(new Date(t.due_date), startOfDay(new Date())) && t.status !== "done";
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={cn("text-[10px]", catColor)}>{catLabel}</Badge>
                        {t.due_date && (
                          <span className={cn("text-[11px] text-muted-foreground", isOverdue && "text-destructive font-medium")}>
                            {format(new Date(t.due_date), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {t.status !== "done" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleComplete(t.id)}>
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
