import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORY_LABELS: Record<string, string> = {
  irpf: 'IRPF',
  inss: 'INSS',
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  dividendos: 'Dividendos',
  planejamento: 'Planejamento',
  ir_medico: 'IR Médico',
};

type KbDoc = {
  id: string;
  category: string;
  title: string;
  content: string;
  valid_from: string;
  valid_until?: string;
  source_url?: string;
  is_active: boolean;
  updated_at: string;
};

export function AdminFinancialKbTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: 'irpf',
    title: '',
    content: '',
    source_url: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
  });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['fn_knowledge_base_admin'],
    queryFn: async (): Promise<KbDoc[]> => {
      const { data } = await (supabase as any)
        .from('fn_knowledge_base')
        .select('*')
        .order('category')
        .order('updated_at', { ascending: false });
      return (data ?? []) as KbDoc[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        valid_until: form.valid_until || null,
        source_url: form.source_url || null,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        await (supabase as any).from('fn_knowledge_base').update(payload).eq('id', editingId);
      } else {
        await (supabase as any).from('fn_knowledge_base').insert(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fn_knowledge_base_admin'] });
      setForm({ category: 'irpf', title: '', content: '', source_url: '', valid_from: new Date().toISOString().split('T')[0], valid_until: '', is_active: true });
      setEditingId(null);
      toast({ title: editingId ? 'Documento atualizado' : 'Documento adicionado' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from('fn_knowledge_base').delete().eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fn_knowledge_base_admin'] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await (supabase as any).from('fn_knowledge_base').update({ is_active }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fn_knowledge_base_admin'] }),
  });

  const startEdit = (doc: KbDoc) => {
    setEditingId(doc.id);
    setForm({
      category: doc.category,
      title: doc.title,
      content: doc.content,
      source_url: doc.source_url ?? '',
      valid_from: doc.valid_from,
      valid_until: doc.valid_until ?? '',
      is_active: doc.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">{editingId ? 'Editar documento' : 'Novo documento'}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Categoria</Label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background"
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Vigência (de)</Label>
            <Input
              type="date"
              value={form.valid_from}
              onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Tabela IRRF 2025 — Pessoa Física"
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Conteúdo (markdown)</Label>
          <Textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Conteúdo técnico do documento..."
            className="text-xs min-h-[160px] font-mono"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">URL da fonte (opcional)</Label>
          <Input
            value={form.source_url}
            onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
            placeholder="https://www.gov.br/receitafederal/..."
            className="text-xs"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => save.mutate()}
            disabled={!form.title || !form.content}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            {editingId ? 'Salvar alterações' : 'Adicionar documento'}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={() => {
              setEditingId(null);
              setForm({ category: 'irpf', title: '', content: '', source_url: '', valid_from: new Date().toISOString().split('T')[0], valid_until: '', is_active: true });
            }}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Documents list */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
        ) : docs.map(doc => (
          <div
            key={doc.id}
            className={`border rounded-xl p-3 ${doc.is_active ? 'border-border' : 'border-border/40 opacity-50'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {CATEGORY_LABELS[doc.category] ?? doc.category}
                  </Badge>
                  {!doc.is_active && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Inativo</Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    Atualizado {format(new Date(doc.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{doc.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {doc.content.slice(0, 120)}...
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(doc)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                  onClick={() => toggleActive.mutate({ id: doc.id, is_active: !doc.is_active })}
                  title={doc.is_active ? 'Desativar' : 'Ativar'}
                >
                  <span className="text-xs">{doc.is_active ? '👁' : '👁‍🗨'}</span>
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => confirm('Excluir documento?') && remove.mutate(doc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
