import { useState, useMemo } from 'react';
import { CalendarPlus, Clock, Trash2, Send, Loader2, Edit2, Save, X, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgendaComunicacoes, CreateAgendaComunicacao } from '@/hooks/useAgendaComunicacoes';
import { format, parseISO, isSameDay, getDay, getDaysInMonth, addDays as addDaysFn } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface DaySchedule {
  date: Date;
  horario_inicio: string;
  horario_fim: string;
}

const getAgendaStatusMeta = (status?: 'pendente' | 'confirmada' | 'rejeitada') => {
  switch (status) {
    case 'confirmada':
      return {
        label: 'Agenda confirmada',
        pillClass: 'border-primary/20 bg-primary text-primary-foreground',
        containerClass: 'border-primary/20 bg-primary/5',
        dotClass: 'bg-primary',
      };
    case 'rejeitada':
      return {
        label: 'Agenda rejeitada',
        pillClass: 'border-destructive/20 bg-destructive/10 text-destructive',
        containerClass: 'border-destructive/20 bg-destructive/5',
        dotClass: 'bg-destructive',
      };
    default:
      return {
        label: 'Enviada · aguarda confirmação',
        pillClass: 'border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.16)] text-foreground',
        containerClass: 'border-[hsl(var(--warning)/0.28)] bg-[hsl(var(--warning)/0.12)]',
        dotClass: 'bg-[hsl(var(--warning))]',
      };
  }
};

const AgendaCard = () => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const {
    comunicacoes,
    isLoading,
    createComunicacao,
    deleteComunicacao,
    isCreating,
    isDeleting,
  } = useAgendaComunicacoes();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [selectedDays, setSelectedDays] = useState<DaySchedule[]>([]);
  const [activeDay, setActiveDay] = useState<Date | null>(null);
  const [tempHorarioInicio, setTempHorarioInicio] = useState('08:00');
  const [tempHorarioFim, setTempHorarioFim] = useState('18:00');
  const [comentarios, setComentarios] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return options;
  }, []);

  const currentMonthDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const pendingDates = useMemo(() => {
    return comunicacoes.filter((c) => c.status === 'pendente').map((c) => parseISO(c.data_agenda));
  }, [comunicacoes]);

  const confirmedDates = useMemo(() => {
    return comunicacoes.filter((c) => c.status === 'confirmada').map((c) => parseISO(c.data_agenda));
  }, [comunicacoes]);

  const rejectedDates = useMemo(() => {
    return comunicacoes.filter((c) => c.status === 'rejeitada').map((c) => parseISO(c.data_agenda));
  }, [comunicacoes]);

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;

    const existingIndex = selectedDays.findIndex((day) => isSameDay(day.date, date));

    if (existingIndex >= 0) {
      const existing = selectedDays[existingIndex];
      setActiveDay(date);
      setTempHorarioInicio(existing.horario_inicio);
      setTempHorarioFim(existing.horario_fim);
      return;
    }

    setActiveDay(date);
    setTempHorarioInicio('08:00');
    setTempHorarioFim('18:00');
  };

  const confirmDaySchedule = () => {
    if (!activeDay) return;

    setSelectedDays((prev) => {
      const existingIndex = prev.findIndex((day) => isSameDay(day.date, activeDay));
      const nextSchedule: DaySchedule = {
        date: activeDay,
        horario_inicio: tempHorarioInicio,
        horario_fim: tempHorarioFim,
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = nextSchedule;
        return updated;
      }

      return [...prev, nextSchedule].sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    setActiveDay(null);
  };

  const removeDay = (date: Date) => {
    setSelectedDays((prev) => prev.filter((day) => !isSameDay(day.date, date)));
    if (activeDay && isSameDay(activeDay, date)) {
      setActiveDay(null);
    }
  };

  const handleSubmit = async () => {
    if (selectedDays.length === 0) {
      toast({
        title: 'Nenhum dia selecionado',
        description: 'Por favor, selecione pelo menos um dia no calendário.',
        variant: 'destructive',
      });
      return;
    }

    try {
      for (const day of selectedDays) {
        await createComunicacao({
          data_agenda: format(day.date, 'yyyy-MM-dd'),
          horario_inicio: day.horario_inicio,
          horario_fim: day.horario_fim || '',
          comentarios,
        });
      }

      setIsSendingEmail(true);
      try {
        const { error } = await supabase.functions.invoke('send-agenda-email', {
          body: {
            medicoNome: profile?.medico_nome || 'Médico',
            diasAgenda: selectedDays.map((day) => ({
              data: format(day.date, 'dd/MM/yyyy (EEEE)', { locale: ptBR }),
              horarioInicio: day.horario_inicio,
              horarioFim: day.horario_fim,
            })),
            comentarios: comentarios || undefined,
          },
        });

        if (error) {
          console.error('Erro ao enviar email:', error);
          toast({
            title: 'Agenda salva, mas email não enviado',
            description: 'A comunicação foi registrada, mas houve um erro ao enviar o email de notificação.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Comunicação enviada com sucesso!',
            description: `${selectedDays.length} dia(s) registrado(s) e email enviado para a equipe.`,
          });
        }
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        toast({
          title: 'Agenda salva',
          description: `${selectedDays.length} dia(s) registrado(s). Email de notificação não configurado.`,
        });
      } finally {
        setIsSendingEmail(false);
      }

      setSelectedDays([]);
      setComentarios('');
      setActiveDay(null);
    } catch {
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
    } catch {
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

  const formatTime = (timeStr: string) => timeStr?.slice(0, 5) || '';
  const selectedDates = useMemo(() => selectedDays.map((day) => day.date), [selectedDays]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" />
          Comunicação de Abertura de Agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Selecione o Mês</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label>Selecione os dias de disponibilidade</Label>
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => {
                if (dates && dates.length > selectedDates.length) {
                  const newDate = dates.find((date) => !selectedDates.some((selectedDate) => isSameDay(selectedDate, date)));
                  if (newDate) handleDayClick(newDate);
                } else if (dates && dates.length < selectedDates.length) {
                  const removedDate = selectedDates.find((selectedDate) => !dates.some((date) => isSameDay(date, selectedDate)));
                  if (removedDate) removeDay(removedDate);
                }
              }}
              locale={ptBR}
              month={currentMonthDate}
              className="rounded-md border"
              classNames={{
                caption: 'hidden',
                nav: 'hidden',
              }}
              modifiers={{
                selected: selectedDates,
                active: activeDay ? [activeDay] : [],
                pending: pendingDates,
                confirmed: confirmedDates,
                rejected: rejectedDates,
              }}
              modifiersClassNames={{
                selected: 'bg-primary/20 text-foreground font-semibold',
                active: '!bg-primary !text-primary-foreground ring-2 ring-primary ring-offset-2',
                pending: 'bg-[hsl(var(--warning)/0.22)] text-foreground hover:bg-[hsl(var(--warning)/0.3)]',
                confirmed: 'bg-primary text-primary-foreground hover:bg-primary/90',
                rejected: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
              }}
            />

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--warning))]" />
                Laranja - Enviada | Aguarda confirmação da Imag
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Azul sólido - Agenda confirmada
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Dias selecionados e horários</Label>

            {activeDay && (
              <div className="p-4 border-2 border-primary rounded-lg bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm capitalize text-primary">
                    {format(activeDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setActiveDay(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Horário Início</Label>
                    <Input type="time" value={tempHorarioInicio} onChange={(e) => setTempHorarioInicio(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Horário Fim</Label>
                    <Input type="time" value={tempHorarioFim} onChange={(e) => setTempHorarioFim(e.target.value)} />
                  </div>
                </div>
                <Button size="sm" onClick={confirmDaySchedule} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Horário
                </Button>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dia selecionado ainda</p>
              ) : (
                selectedDays.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/20"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {format(day.date, 'dd/MM (EEE)', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {day.horario_inicio} - {day.horario_fim}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDayClick(day.date)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeDay(day.date)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comentarios">Comentários / Observações</Label>
          <Textarea
            id="comentarios"
            placeholder="Informe alterações de premissas, restrições ou observações relevantes..."
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isSendingEmail || selectedDays.length === 0}
            className="flex-1 md:flex-none"
          >
            {isCreating || isSendingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSendingEmail ? 'Enviando email...' : 'Salvando...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Comunicação ({selectedDays.length} dia{selectedDays.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comunicacoes.length > 0 ? (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Suas comunicações recentes:</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comunicacoes.map((com) => {
                const statusMeta = getAgendaStatusMeta(com.status);

                return (
                  <div
                    key={com.id}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${statusMeta.containerClass}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize">{formatDate(com.data_agenda)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(com.horario_inicio)}
                          {com.horario_fim && ` - ${formatTime(com.horario_fim)}`}
                        </span>
                      </div>
                      <span className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-medium ${statusMeta.pillClass}`}>
                        <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                        {statusMeta.label}
                      </span>
                      {com.comentarios && (
                        <p className="text-xs text-muted-foreground mt-2 italic">"{com.comentarios}"</p>
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
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4 border-t pt-4">
            Nenhuma comunicação de agenda registrada.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AgendaCard;
