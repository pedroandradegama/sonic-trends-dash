import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useMasterAdminCheck } from '@/hooks/useMasterAdminCheck';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, CheckCircle2, Clock, XCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AgendaItem {
  id: string;
  user_id: string;
  medico_nome: string;
  data_agenda: string;
  horario_inicio: string;
  horario_fim: string | null;
  comentarios: string | null;
  status: string;
  confirmed_at: string | null;
  created_at: string;
}

export default function GestaoAgendas() {
  const navigate = useNavigate();
  const { isMasterAdmin, loading: masterLoading } = useMasterAdminCheck();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [monthOffset, setMonthOffset] = useState(1);

  const targetMonth = addMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);

  const { data: agendas = [], isLoading } = useQuery({
    queryKey: ['gestao-agendas', monthOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_comunicacoes')
        .select('*')
        .gte('data_agenda', format(monthStart, 'yyyy-MM-dd'))
        .lte('data_agenda', format(monthEnd, 'yyyy-MM-dd'))
        .order('data_agenda')
        .order('horario_inicio');
      if (error) throw error;
      return (data || []) as unknown as AgendaItem[];
    },
    enabled: isMasterAdmin,
  });

  const handleConfirm = async (id: string) => {
    const { error } = await supabase
      .from('agenda_comunicacoes')
      .update({ status: 'confirmada', confirmed_by: user?.id, confirmed_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (error) { toast.error('Erro ao confirmar'); return; }
    toast.success('Agenda confirmada');
    queryClient.invalidateQueries({ queryKey: ['gestao-agendas'] });
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('agenda_comunicacoes')
      .update({ status: 'rejeitada' } as any)
      .eq('id', id);
    if (error) { toast.error('Erro ao rejeitar'); return; }
    toast.success('Agenda rejeitada');
    queryClient.invalidateQueries({ queryKey: ['gestao-agendas'] });
  };

  // Calendar map
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const agendaMap = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    agendas.forEach(a => {
      const key = a.data_agenda;
      map.set(key, [...(map.get(key) || []), a]);
    });
    return map;
  }, [agendas]);

  // Conflict detection
  const conflicts = useMemo(() => {
    const result: string[] = [];
    agendaMap.forEach((items, date) => {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], b = items[j];
          if (a.medico_nome === b.medico_nome) continue;
          const aEnd = a.horario_fim || '23:59';
          const bEnd = b.horario_fim || '23:59';
          if (a.horario_inicio < bEnd && b.horario_inicio < aEnd) {
            result.push(`${date}: ${a.medico_nome} (${a.horario_inicio}-${aEnd}) × ${b.medico_nome} (${b.horario_inicio}-${bEnd})`);
          }
        }
      }
    });
    return result;
  }, [agendaMap]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'confirmada': return <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Confirmada</Badge>;
      case 'rejeitada': return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" />Rejeitada</Badge>;
      default: return <Badge variant="outline" className="text-xs gap-1 border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]"><Clock className="h-3 w-3" />Pendente</Badge>;
    }
  };

  if (masterLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isMasterAdmin) { navigate('/'); return null; }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            Gestão de Agendas
          </h1>
          <p className="text-muted-foreground">Confirme e gerencie as agendas solicitadas pelos médicos</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={String(monthOffset)} onValueChange={v => setMonthOffset(Number(v))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</SelectItem>
            <SelectItem value="1">{format(addMonths(new Date(), 1), 'MMMM yyyy', { locale: ptBR })}</SelectItem>
            <SelectItem value="2">{format(addMonths(new Date(), 2), 'MMMM yyyy', { locale: ptBR })}</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline">{agendas.length} agenda{agendas.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Conflicts alert */}
      {conflicts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Conflitos Detectados ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {conflicts.map((c, i) => <li key={i} className="text-sm text-destructive">{c}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Calendar grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base capitalize">
            Mapa de Agendas — {format(targetMonth, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {/* Empty cells for offset */}
            {Array.from({ length: getDay(monthStart) }).map((_, i) => <div key={`empty-${i}`} />)}
            {daysInMonth.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayAgendas = agendaMap.get(key) || [];
              const hasConflict = conflicts.some(c => c.startsWith(key));
              return (
                <div
                  key={key}
                  className={`p-1 rounded-md min-h-[48px] border text-xs ${
                    dayAgendas.length > 0
                      ? hasConflict
                        ? 'bg-destructive/10 border-destructive/30'
                        : 'bg-primary/5 border-primary/20'
                      : 'border-border/30'
                  }`}
                >
                  <span className="font-medium">{format(day, 'd')}</span>
                  {dayAgendas.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayAgendas.slice(0, 2).map(a => (
                        <div key={a.id} className={`text-[10px] truncate rounded px-0.5 ${
                          a.status === 'confirmada' ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' :
                          a.status === 'rejeitada' ? 'bg-destructive/10 text-destructive' :
                          'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]'
                        }`}>
                          {a.medico_nome.split(' ')[0]}
                        </div>
                      ))}
                      {dayAgendas.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayAgendas.length - 2}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agenda list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agendas Solicitadas</CardTitle>
          <CardDescription>Confirme ou rejeite cada agenda individual</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : agendas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma agenda para este mês.</p>
          ) : (
            <div className="space-y-3">
              {agendas.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{a.medico_nome}</span>
                      {statusBadge(a.status)}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {format(parseISO(a.data_agenda), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                      {' · '}
                      {a.horario_inicio?.slice(0, 5)}{a.horario_fim && ` – ${a.horario_fim.slice(0, 5)}`}
                    </p>
                    {a.comentarios && <p className="text-xs text-muted-foreground italic">"{a.comentarios}"</p>}
                  </div>
                  {a.status === 'pendente' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]/30 gap-1" onClick={() => handleConfirm(a.id)}>
                        <CheckCircle2 className="h-3 w-3" /> Confirmar
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 gap-1" onClick={() => handleReject(a.id)}>
                        <XCircle className="h-3 w-3" /> Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
