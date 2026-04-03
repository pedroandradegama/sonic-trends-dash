import { useState } from 'react';
import { Plus, Trash2, CalendarClock, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFnRecurrence, FnRecurrenceRule, WEEKDAY_LABELS, FREQ_LABELS } from '@/hooks/useFnRecurrence';
import { FnShiftType, FN_SHIFT_LABELS, AGENDA_SHIFT_TYPES, PLANTAO_SHIFT_TYPES } from '@/types/financialNavigator';
import { toast } from 'sonner';

interface Props {
  serviceId: string;
  serviceName: string;
  serviceColor: string;
}

const MONTHS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

function buildMonthOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let offset = -2; offset <= 14; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const mLabel = MONTHS.find(mo => mo.value === m)!.label;
    options.push({ value: `${y}-${m}`, label: `${mLabel} ${y}` });
  }
  return options;
}

export function RecurrenceRulesSection({ serviceId, serviceName, serviceColor }: Props) {
  const { getRulesForService, upsertRule, deleteRule, projectRule, removeProjectedShifts } = useFnRecurrence();
  const rules = getRulesForService(serviceId);

  const [adding, setAdding] = useState(false);
  const [newWeekday, setNewWeekday] = useState<number>(3); // Qua
  const [newShiftType, setNewShiftType] = useState<FnShiftType>('slot1');
  const [newFrequency, setNewFrequency] = useState<'weekly' | 'biweekly'>('weekly');
  const [newStartMonth, setNewStartMonth] = useState('');
  const [newEndMonth, setNewEndMonth] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteRule, setConfirmDeleteRule] = useState<FnRecurrenceRule | null>(null);

  const monthOptions = buildMonthOptions();

  const handleAdd = async () => {
    if (!newStartMonth || !newEndMonth) {
      toast.error('Selecione o mês de início e término.');
      return;
    }
    if (newStartMonth > newEndMonth) {
      toast.error('Mês de início deve ser antes do término.');
      return;
    }
    setSaving(true);
    const rule: Partial<FnRecurrenceRule> & { service_id: string } = {
      service_id: serviceId,
      shift_type: newShiftType,
      weekday: newWeekday,
      frequency: newFrequency,
      start_month: newStartMonth,
      end_month: newEndMonth,
      is_active: true,
    };
    await upsertRule.mutateAsync(rule);

    // Now project shifts
    const fullRule = {
      ...rule,
      id: '', user_id: '', is_active: true,
    } as FnRecurrenceRule;
    await projectRule.mutateAsync(fullRule);

    toast.success('Recorrência criada e turnos projetados!');
    setSaving(false);
    setAdding(false);
  };

  const handleToggleActive = async (rule: FnRecurrenceRule) => {
    if (rule.is_active) {
      // Deactivating — ask to remove projected shifts
      setConfirmDeleteRule(rule);
    } else {
      // Activating — project shifts
      await upsertRule.mutateAsync({ ...rule, is_active: true });
      await projectRule.mutateAsync(rule);
      toast.success('Recorrência reativada e turnos projetados!');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!confirmDeleteRule) return;
    setSaving(true);
    await removeProjectedShifts.mutateAsync(confirmDeleteRule);
    await upsertRule.mutateAsync({ ...confirmDeleteRule, is_active: false });
    toast.success('Recorrência desativada e turnos removidos.');
    setSaving(false);
    setConfirmDeleteRule(null);
  };

  const handleDelete = async (rule: FnRecurrenceRule) => {
    if (!confirm('Remover esta regra de recorrência? Os turnos já projetados serão mantidos.')) return;
    await deleteRule.mutateAsync(rule.id);
    toast.success('Regra removida.');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">
          Turnos Recorrentes
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setAdding(!adding)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Nova regra
        </Button>
      </div>

      {rules.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground font-body py-2">
          Nenhuma recorrência configurada. Crie regras para projetar turnos automaticamente no calendário.
        </p>
      )}

      {/* Existing rules */}
      {rules.map(rule => (
        <div
          key={rule.id}
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-lg border',
            rule.is_active ? 'bg-card border-border' : 'bg-muted/50 border-border/50 opacity-60'
          )}
          style={rule.is_active ? { borderLeftWidth: 3, borderLeftColor: serviceColor } : {}}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium font-body truncate">
                {WEEKDAY_LABELS[rule.weekday]} · {FN_SHIFT_LABELS[rule.shift_type as FnShiftType]} · {FREQ_LABELS[rule.frequency]}
              </p>
              <p className="text-[10px] text-muted-foreground font-body">
                {monthOptions.find(m => m.value === rule.start_month)?.label ?? rule.start_month}
                {' → '}
                {monthOptions.find(m => m.value === rule.end_month)?.label ?? rule.end_month}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => handleToggleActive(rule)}
              title={rule.is_active ? 'Desativar' : 'Ativar'}
            >
              {rule.is_active
                ? <Pause className="h-3.5 w-3.5 text-muted-foreground" />
                : <Play className="h-3.5 w-3.5 text-primary" />}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(rule)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}

      {/* Add new rule form */}
      {adding && (
        <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Dia da semana</Label>
              <Select value={String(newWeekday)} onValueChange={v => setNewWeekday(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEEKDAY_LABELS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Turno</Label>
              <Select value={newShiftType} onValueChange={v => setNewShiftType(v as FnShiftType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...AGENDA_SHIFT_TYPES, ...PLANTAO_SHIFT_TYPES].map(st => (
                    <SelectItem key={st} value={st}>{FN_SHIFT_LABELS[st]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-body">Frequência</Label>
            <Select value={newFrequency} onValueChange={v => setNewFrequency(v as 'weekly' | 'biweekly')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal (toda semana)</SelectItem>
                <SelectItem value="biweekly">Quinzenal (a cada 2 semanas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Início</Label>
              <Select value={newStartMonth} onValueChange={setNewStartMonth}>
                <SelectTrigger><SelectValue placeholder="Mês..." /></SelectTrigger>
                <SelectContent>
                  {monthOptions.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Término</Label>
              <Select value={newEndMonth} onValueChange={setNewEndMonth}>
                <SelectTrigger><SelectValue placeholder="Mês..." /></SelectTrigger>
                <SelectContent>
                  {monthOptions.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleAdd} disabled={saving} className="flex-1">
              {saving ? 'Projetando...' : 'Criar e projetar turnos'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Confirm deactivation dialog */}
      <Dialog open={!!confirmDeleteRule} onOpenChange={open => !open && setConfirmDeleteRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Desativar recorrência</DialogTitle>
            <DialogDescription className="font-body">
              Deseja remover todos os turnos projetados por esta regra de recorrência?
              Turnos com status diferente de "projetado" serão mantidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteRule(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeactivate} disabled={saving}>
              {saving ? 'Removendo...' : 'Sim, remover turnos e desativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
