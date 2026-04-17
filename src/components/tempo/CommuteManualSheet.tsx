import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCommuteEntries, CommuteEntry } from '@/hooks/useCommuteEntries';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/useUserProfile';

interface Props {
  open: boolean;
  onClose: () => void;
  entry?: CommuteEntry | null;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function CommuteManualSheet({ open, onClose, entry }: Props) {
  const { createEntry } = useCommuteEntries();
  const { profile } = useUserProfile();
  const qc = useQueryClient();
  const isEdit = !!entry;

  const [label, setLabel] = useState('');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [duration, setDuration] = useState(30);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  // Hydrate form when opening for edit, or reset when opening for create
  useEffect(() => {
    if (!open) return;
    if (entry) {
      setLabel(entry.label ?? '');
      setOrigin(entry.origin_description ?? '');
      setDest(entry.destination_description ?? '');
      setDuration(entry.duration_minutes ?? 30);
      setDays(entry.days_of_week ?? [1, 2, 3, 4, 5]);
      setTime(entry.time_of_day ? entry.time_of_day.slice(0, 5) : '');
    } else {
      setLabel(''); setOrigin(''); setDest(''); setDuration(30); setDays([1,2,3,4,5]); setTime('');
    }
  }, [open, entry]);

  const handleSave = async () => {
    if (!label.trim()) { toast.error('Informe um nome para o deslocamento.'); return; }
    setSaving(true);
    try {
      const payload = {
        label: label.trim(),
        origin_description: origin || null,
        destination_description: dest || null,
        duration_minutes: duration,
        days_of_week: days,
        time_of_day: time || null,
      };
      if (isEdit && entry) {
        const { error } = await (supabase as any)
          .from('commute_entries')
          .update(payload)
          .eq('id', entry.id)
          .eq('user_id', profile?.user_id);
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ['commute_entries', profile?.user_id ?? ''] });
        toast.success('Deslocamento atualizado.');
      } else {
        await createEntry.mutateAsync({
          ...payload,
          source: 'manual',
          is_work_commute: false,
        });
        toast.success('Deslocamento adicionado.');
      }
      onClose();
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>{isEdit ? 'Editar deslocamento' : 'Novo deslocamento'}</SheetTitle></SheetHeader>
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
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar alterações' : 'Salvar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
