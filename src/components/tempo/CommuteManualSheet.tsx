import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCommuteEntries } from '@/hooks/useCommuteEntries';

interface Props {
  open: boolean;
  onClose: () => void;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function CommuteManualSheet({ open, onClose }: Props) {
  const { createEntry } = useCommuteEntries();
  const [label, setLabel] = useState('');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [duration, setDuration] = useState(30);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [time, setTime] = useState('');

  const reset = () => {
    setLabel(''); setOrigin(''); setDest(''); setDuration(30); setDays([1,2,3,4,5]); setTime('');
  };

  const handleSave = async () => {
    if (!label.trim()) { toast.error('Informe um nome para o deslocamento.'); return; }
    try {
      await createEntry.mutateAsync({
        label: label.trim(),
        origin_description: origin || null,
        destination_description: dest || null,
        duration_minutes: duration,
        days_of_week: days,
        time_of_day: time || null,
        source: 'manual',
        is_work_commute: false,
      });
      toast.success('Deslocamento adicionado.');
      reset();
      onClose();
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>Novo deslocamento</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Levar filho na escola" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Origem</Label>
              <Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Casa" />
            </div>
            <div>
              <Label>Destino</Label>
              <Input value={dest} onChange={e => setDest(e.target.value)} placeholder="Escola X" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Duração (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Dias da semana</Label>
            <div className="flex gap-1">
              {WEEKDAYS.map((d, idx) => {
                const active = days.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDays(active ? days.filter(x => x !== idx) : [...days, idx].sort())}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={createEntry.isPending} className="flex-1">
              {createEntry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
