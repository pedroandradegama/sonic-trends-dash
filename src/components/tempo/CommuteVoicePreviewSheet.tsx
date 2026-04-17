import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCommuteEntries } from '@/hooks/useCommuteEntries';

export interface ParsedCommuteEntry {
  label: string;
  origin_description: string;
  destination_description: string;
  duration_minutes: number;
  days_of_week: number[];
  time_of_day: string;
  is_round_trip: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  transcript: string;
  entries: ParsedCommuteEntry[];
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function CommuteVoicePreviewSheet({ open, onClose, transcript, entries }: Props) {
  const [items, setItems] = useState<ParsedCommuteEntry[]>(entries);
  const { createMany } = useCommuteEntries();

  useEffect(() => { setItems(entries); }, [entries]);

  const update = (i: number, patch: Partial<ParsedCommuteEntry>) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  };

  const handleSave = async () => {
    if (items.length === 0) { onClose(); return; }
    try {
      await createMany.mutateAsync(items.map(it => ({
        label: it.label,
        origin_description: it.origin_description,
        destination_description: it.destination_description,
        duration_minutes: it.is_round_trip ? it.duration_minutes * 2 : it.duration_minutes,
        days_of_week: it.days_of_week,
        time_of_day: it.time_of_day || null,
        source: 'voice',
        raw_transcript: transcript,
        is_work_commute: false,
      })));
      toast.success(`${items.length} deslocamento(s) salvos.`);
      onClose();
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Deslocamentos identificados</SheetTitle>
        </SheetHeader>

        {transcript && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground italic">
            "{transcript}"
          </div>
        )}

        <div className="mt-4 space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum deslocamento identificado.
            </p>
          )}
          {items.map((it, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Input
                value={it.label}
                onChange={e => update(i, { label: e.target.value })}
                className="font-medium"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{it.origin_description}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{it.destination_description}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Duração (min)</Label>
                  <Input
                    type="number"
                    value={it.duration_minutes}
                    onChange={e => update(i, { duration_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Horário</Label>
                  <Input
                    type="time"
                    value={it.time_of_day}
                    onChange={e => update(i, { time_of_day: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Dias</Label>
                <div className="flex gap-1">
                  {WEEKDAYS.map((d, idx) => {
                    const active = it.days_of_week.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => update(i, {
                          days_of_week: active
                            ? it.days_of_week.filter(x => x !== idx)
                            : [...it.days_of_week, idx].sort(),
                        })}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Label htmlFor={`rt-${i}`}>Ida e volta</Label>
                <Switch
                  id={`rt-${i}`}
                  checked={it.is_round_trip}
                  onCheckedChange={v => update(i, { is_round_trip: v })}
                />
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} disabled={createMany.isPending || items.length === 0} className="flex-1">
            {createMany.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar todos
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
