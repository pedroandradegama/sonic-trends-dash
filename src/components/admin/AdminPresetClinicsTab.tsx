import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminPresetClinicsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', short_name: '', address: '', city: 'Recife', state: 'PE' });
  const [editId, setEditId] = useState<string | null>(null);

  const { data: clinics = [] } = useQuery({
    queryKey: ['fn_preset_clinics_admin'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('fn_preset_clinics').select('*').order('name');
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        await (supabase as any).from('fn_preset_clinics').update(form).eq('id', editId);
      } else {
        await (supabase as any).from('fn_preset_clinics').insert(form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fn_preset_clinics_admin'] });
      qc.invalidateQueries({ queryKey: ['fn_preset_clinics'] });
      setForm({ name: '', short_name: '', address: '', city: 'Recife', state: 'PE' });
      setEditId(null);
      toast({ title: editId ? 'Clínica atualizada' : 'Clínica adicionada' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from('fn_preset_clinics').delete().eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fn_preset_clinics_admin'] });
      qc.invalidateQueries({ queryKey: ['fn_preset_clinics'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium">{editId ? 'Editar clínica' : 'Adicionar clínica'}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Nome completo</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="IMAG – Diagnóstico por Imagem" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Abreviação</Label>
            <Input value={form.short_name} onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))} placeholder="IMAG" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cidade</Label>
            <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Endereço</Label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Av. Visconde de Jequitinhonha, 209, Boa Viagem" />
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={!form.name || !form.address} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          {editId ? 'Salvar alterações' : 'Adicionar clínica'}
        </Button>
      </div>

      <div className="space-y-2">
        {clinics.map((c: any) => (
          <div key={c.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground truncate">{c.address}, {c.city}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setForm(c); setEditId(c.id); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove.mutate(c.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
