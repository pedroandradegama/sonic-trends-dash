import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { useCommunityTopics } from '@/hooks/useCommunityTopics';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminCommunityTopicsTab() {
  const { topics, isLoading, addTopic, removeTopic } = useCommunityTopics();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      await addTopic.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
      });
      setTitle(''); setDescription(''); setUrl('');
      toast.success('Tema adicionado à comunidade');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[hsl(var(--warning))]" />
          Temas da Comunidade
        </CardTitle>
        <CardDescription>Compartilhe temas interessantes não médicos com os colegas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <Label>Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Podcast recomendado" maxLength={200} />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição" maxLength={500} />
          </div>
          <div className="space-y-1">
            <Label>URL (opcional)</Label>
            <div className="flex gap-2">
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." maxLength={500} />
              <Button onClick={handleAdd} disabled={addTopic.isPending} size="sm" className="gap-1 shrink-0">
                {addTopic.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            {topics.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <p className="font-medium text-sm">{t.title}</p>
                  {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{t.url}</a>}
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { removeTopic.mutate(t.id); toast.success('Removido'); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {topics.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum tema compartilhado.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
