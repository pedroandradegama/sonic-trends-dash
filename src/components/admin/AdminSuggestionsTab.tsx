import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';
import { useRadioburgerSuggestions } from '@/hooks/useRadioburgerSuggestions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function AdminSuggestionsTab() {
  const { suggestions, isLoading, updateStatus } = useRadioburgerSuggestions();

  const handleReview = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'reviewed' });
      toast.success('Sugestão marcada como revisada');
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[hsl(var(--warning))]" />
          Sugestões para o Radioburger ({suggestions.length})
        </CardTitle>
        <CardDescription>Temas, casos e artigos sugeridos pelos médicos</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : suggestions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Nenhuma sugestão recebida.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map(s => (
              <div key={s.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card/50">
                <div className="space-y-1 flex-1">
                  <p className="text-sm">{s.suggestion_text}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(s.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === 'reviewed' ? (
                    <Badge variant="outline" className="text-xs gap-1 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                      <CheckCircle2 className="h-3 w-3" /> Revisado
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => handleReview(s.id)}>
                      Marcar revisado
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
