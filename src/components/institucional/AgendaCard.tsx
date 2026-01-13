import { useState } from 'react';
import { CalendarPlus, Clock, Trash2, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAgendaComunicacoes, CreateAgendaComunicacao } from '@/hooks/useAgendaComunicacoes';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const AgendaCard = () => {
  const { toast } = useToast();
  const { 
    comunicacoes, 
    isLoading, 
    createComunicacao, 
    deleteComunicacao,
    isCreating,
    isDeleting 
  } = useAgendaComunicacoes();

  const [formData, setFormData] = useState<CreateAgendaComunicacao>({
    data_agenda: '',
    horario_inicio: '',
    horario_fim: '',
    comentarios: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.data_agenda || !formData.horario_inicio) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha a data e o horário de início.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createComunicacao(formData);
      toast({
        title: 'Comunicação enviada',
        description: 'Sua disponibilidade de agenda foi registrada com sucesso.',
      });
      setFormData({
        data_agenda: '',
        horario_inicio: '',
        horario_fim: '',
        comentarios: '',
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível registrar a comunicação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComunicacao(id);
      toast({
        title: 'Comunicação removida',
        description: 'A entrada foi removida com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover a comunicação.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5); // HH:MM format
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" />
          Comunicação de Abertura de Agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_agenda">Data da Agenda *</Label>
              <Input
                id="data_agenda"
                type="date"
                value={formData.data_agenda}
                onChange={(e) => setFormData({ ...formData, data_agenda: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="horario_inicio">Horário Início *</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={formData.horario_inicio}
                  onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario_fim">Horário Fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  value={formData.horario_fim}
                  onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentários / Observações</Label>
            <Textarea
              id="comentarios"
              placeholder="Informe alterações de premissas, restrições ou observações relevantes..."
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isCreating} className="w-full md:w-auto">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Comunicação
              </>
            )}
          </Button>
        </form>

        {/* Lista de comunicações */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comunicacoes.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Suas comunicações recentes:</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comunicacoes.map((com) => (
                <div 
                  key={com.id} 
                  className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">
                      {formatDate(com.data_agenda)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatTime(com.horario_inicio)}
                        {com.horario_fim && ` - ${formatTime(com.horario_fim)}`}
                      </span>
                    </div>
                    {com.comentarios && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{com.comentarios}"
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(com.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma comunicação de agenda registrada.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AgendaCard;
