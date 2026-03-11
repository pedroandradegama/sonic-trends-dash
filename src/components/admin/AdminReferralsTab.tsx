import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserPlus, CheckCircle2, Loader2, Clock, DollarSign, Bell, CalendarCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Referral {
  id: string;
  referrer_user_id: string;
  referrer_nome: string | null;
  referred_name: string;
  referred_email: string;
  referred_phone: string | null;
  status: string;
  started_at: string | null;
  created_at: string;
}

export function AdminReferralsTab() {
  const queryClient = useQueryClient();

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_referrals' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Referral[];
    },
  });

  const markStarted = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('member_referrals' as any)
        .update({ started_at: new Date().toISOString(), status: 'active' } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
      toast.success('Início de agendas registrado!');
    },
  });

  const getProgress = (startedAt: string) => {
    const start = new Date(startedAt);
    const end = addMonths(start, 6);
    const totalDays = differenceInDays(end, start);
    const elapsed = differenceInDays(new Date(), start);
    const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
    const remaining = Math.max(0, differenceInDays(end, new Date()));
    const completed = pct >= 100;
    return { pct: Math.round(pct), remaining, completed };
  };

  const completedReferrals = referrals.filter(r => r.started_at && getProgress(r.started_at).completed);
  const activeReferrals = referrals.filter(r => r.started_at && !getProgress(r.started_at).completed);
  const pendingReferrals = referrals.filter(r => !r.started_at);

  return (
    <div className="space-y-6">
      {/* Completed (need payment) */}
      {completedReferrals.length > 0 && (
        <Card className="border-[hsl(var(--success))]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[hsl(var(--success))]" />
              Indicações Concluídas — Pagamento Pendente ({completedReferrals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedReferrals.map(r => (
              <div key={r.id} className="p-3 rounded-lg border border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{r.referred_name}</p>
                    <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                  </div>
                  <Badge className="bg-[hsl(var(--success))] text-white text-xs gap-1">
                    <Bell className="h-3 w-3" /> 6 meses completos
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Indicado por: <strong>{r.referrer_nome || 'Médico'}</strong> · 
                  Início: {r.started_at ? format(new Date(r.started_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                </p>
                <Progress value={100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active referrals */}
      {activeReferrals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Em Andamento ({activeReferrals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeReferrals.map(r => {
              const prog = getProgress(r.started_at!);
              return (
                <div key={r.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.referred_name}</p>
                      <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{prog.remaining} dias restantes</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Indicado por: <strong>{r.referrer_nome || 'Médico'}</strong> · 
                    Início: {format(new Date(r.started_at!), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={prog.pct} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground">{prog.pct}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Pending referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Indicações Pendentes ({pendingReferrals.length})
          </CardTitle>
          <CardDescription>Marque o início das agendas para começar a contagem de 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : pendingReferrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nenhuma indicação pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendingReferrals.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card/50">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{r.referred_name}</p>
                    <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                    <p className="text-xs text-muted-foreground">
                      Indicado por: <strong>{r.referrer_nome || 'Médico'}</strong> · 
                      {format(new Date(r.created_at), " dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={() => markStarted.mutate(r.id)}
                    disabled={markStarted.isPending}
                  >
                    <CalendarCheck className="h-3 w-3" />
                    Marcar início
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
