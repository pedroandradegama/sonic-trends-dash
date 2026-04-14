import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "financeiro", label: "Financeiro", color: "bg-emerald-100 text-emerald-700" },
  { value: "profissional", label: "Profissional", color: "bg-blue-100 text-blue-700" },
  { value: "pessoal", label: "Pessoal", color: "bg-violet-100 text-violet-700" },
  { value: "saude", label: "Saúde", color: "bg-rose-100 text-rose-700" },
];

const REMIND_CHANNELS = ["WhatsApp", "Email"];
const REMIND_TIMES = [
  { value: "7d", label: "7 dias antes" },
  { value: "1d", label: "1 dia antes" },
  { value: "3h", label: "3 horas antes" },
];

export function TaskCreateDialog() {
  const { create } = useTasks();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("pessoal");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("monthly");
  const [recurrenceDay, setRecurrenceDay] = useState(1);
  const [recurrenceEnd, setRecurrenceEnd] = useState<Date | undefined>();
  const [remindVia, setRemindVia] = useState<string[]>(["whatsapp"]);
  const [remindWhen, setRemindWhen] = useState<string[]>(["1d"]);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("pessoal");
    setDueDate(undefined);
    setIsRecurring(false);
    setRecurrenceType("monthly");
    setRecurrenceDay(1);
    setRecurrenceEnd(undefined);
    setRemindVia(["whatsapp"]);
    setRemindWhen(["1d"]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await create({
        title: title.trim(),
        description: description.trim() || null,
        category,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring
          ? { type: recurrenceType, day: recurrenceDay, end: recurrenceEnd ? format(recurrenceEnd, "yyyy-MM-dd") : null }
          : null,
        reminder_config: { channels: remindVia, times: remindWhen },
        status: "pending",
      });
      toast.success("Tarefa criada!");
      resetForm();
      setOpen(false);
    } catch {
      toast.error("Erro ao criar tarefa");
    } finally {
      setSaving(false);
    }
  };

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Enviar declaração de IR" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Detalhes opcionais..." />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn("text-xs", c.color)}>{c.label}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label>Data de vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} locale={ptBR} /></PopoverContent>
            </Popover>
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="cursor-pointer">Tarefa recorrente</Label>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {isRecurring && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <div className="space-y-1.5">
                <Label>Tipo de recorrência</Label>
                <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {recurrenceType === "monthly" && (
                <div className="space-y-1.5">
                  <Label>Dia do mês</Label>
                  <Input type="number" min={1} max={31} value={recurrenceDay} onChange={(e) => setRecurrenceDay(Number(e.target.value))} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Repetir até (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !recurrenceEnd && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurrenceEnd ? format(recurrenceEnd, "dd/MM/yyyy", { locale: ptBR }) : "Sem limite"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={recurrenceEnd} onSelect={setRecurrenceEnd} locale={ptBR} /></PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Remind via */}
          <div className="space-y-2">
            <Label>Lembrar via</Label>
            <div className="flex gap-3">
              {REMIND_CHANNELS.map((ch) => (
                <label key={ch} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={remindVia.includes(ch.toLowerCase())}
                    onCheckedChange={() => setRemindVia(toggleArray(remindVia, ch.toLowerCase()))}
                  />
                  <span className="text-sm">{ch}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Remind when */}
          <div className="space-y-2">
            <Label>Quando lembrar</Label>
            <div className="flex flex-wrap gap-3">
              {REMIND_TIMES.map((rt) => (
                <label key={rt.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={remindWhen.includes(rt.value)}
                    onCheckedChange={() => setRemindWhen(toggleArray(remindWhen, rt.value))}
                  />
                  <span className="text-sm">{rt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!title.trim() || saving} className="w-full">
            {saving ? "Criando..." : "Criar tarefa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
