import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { FnServiceExpense } from '@/types/financialNavigator';

type Expense = Omit<FnServiceExpense, 'id' | 'service_id' | 'user_id'>;

interface Props {
  expenses: Expense[];
  onChange: (v: Expense[]) => void;
}

const SUGGESTIONS = [
  'Contador', 'Certificado digital', 'Anuidade CRM',
  'Seguro responsabilidade civil', 'Licença software laudo',
];

export function ExpensesSection({ expenses, onChange }: Props) {
  const add = () => onChange([
    ...expenses, { label: '', amount_brl: 0, frequency: 'monthly' }
  ]);

  const update = (i: number, patch: Partial<Expense>) =>
    onChange(expenses.map((e, idx) => idx === i ? { ...e, ...patch } : e));

  const remove = (i: number) =>
    onChange(expenses.filter((_, idx) => idx !== i));

  const monthlyTotal = expenses.reduce((acc, e) =>
    acc + (e.frequency === 'annual' ? e.amount_brl / 12 : e.amount_brl), 0
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-body">
        Despesas fixas associadas a este serviço. Anuais são divididas por 12.
      </p>

      {expenses.map((e, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1.5">
            <Input
              list="expense-suggestions"
              value={e.label}
              onChange={ev => update(i, { label: ev.target.value })}
              placeholder="Ex: Contador"
            />
            <datalist id="expense-suggestions">
              {SUGGESTIONS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <Input
            type="number"
            min={0}
            value={e.amount_brl}
            onChange={ev => update(i, { amount_brl: Number(ev.target.value) })}
            className="w-28 text-right"
            placeholder="R$"
          />
          <Select
            value={e.frequency}
            onValueChange={v => update(i, { frequency: v as 'monthly' | 'annual' })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost" size="icon"
            className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(i)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button variant="outline" className="w-full border-dashed" onClick={add}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Adicionar despesa
      </Button>

      {expenses.length > 0 && (
        <div className="flex justify-between items-center py-2 px-3 bg-muted rounded-lg">
          <span className="text-xs text-muted-foreground font-body">Total mensal estimado</span>
          <span className="text-sm font-medium font-body">
            R$ {monthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}
