import { useState } from 'react';
import { Lightbulb, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRadioburgerSuggestions } from '@/hooks/useRadioburgerSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function RadioburgerSuggestionButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const { addSuggestion } = useRadioburgerSuggestions();

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await addSuggestion.mutateAsync(text.trim());
      // Send email notification to master
      try {
        await supabase.functions.invoke('send-agenda-email', {
          body: {
            medicoNome: 'Sistema',
            agendaDays: [],
            comments: `Nova sugestão para o Radioburger:\n\n"${text.trim()}"`,
          },
        });
      } catch { /* silent - email is best-effort */ }
      toast.success('Sugestão enviada! Obrigado pela contribuição.');
      setText('');
      setOpen(false);
    } catch {
      toast.error('Erro ao enviar sugestão.');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          title="Sugerir tema para o Radioburger"
        >
          <Lightbulb className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="end">
        <p className="text-sm font-medium">Sugerir tema para o Radioburger</p>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Sugira um caso, artigo ou tema interessante..."
          className="text-sm min-h-[80px]"
          maxLength={500}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSend} disabled={addSuggestion.isPending || !text.trim()} className="gap-1">
            {addSuggestion.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Enviar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
