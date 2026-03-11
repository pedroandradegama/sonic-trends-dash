import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserPlus, Send, CheckCircle2, Clock, Loader2, DollarSign } from 'lucide-react';
import { useMemberReferrals } from '@/hooks/useMemberReferrals';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { differenceInDays, addMonths } from 'date-fns';

export function MemberGetMemberCard() {
  const { referrals, isLoading, addReferral } = useMemberReferrals();
  const { profile } = useUserProfile();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Preencha nome e email.');
      return;
    }
    try {
      await addReferral.mutateAsync({
        referred_name: name.trim(),
        referred_email: email.trim().toLowerCase(),
        referred_phone: phone.trim() || undefined,
        referrer_nome: profile?.medico_nome || undefined,
      });
      toast.success('Indicação enviada com sucesso!');
      setName(''); setEmail(''); setPhone(''); setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar indicação.');
    }
  };

  const getProgress = (startedAt: string) => {
    const start = new Date(startedAt);
    const end = addMonths(start, 6);
    const totalDays = differenceInDays(end, start);
    const elapsed = differenceInDays(new Date(), start);
    const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
    const remaining = Math.max(0, differenceInDays(end, new Date()));
    return { pct: Math.round(pct), remaining, completed: pct >= 100 };
  };

  const activeReferrals = referrals.filter(r => r.started_at);
  const pendingReferrals = referrals.filter(r => !r.started_at);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Member Get Member
          </span>
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setShowForm(!showForm)}>
            <Send className="h-3 w-3" /> Indicar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Indique colegas e receba após 6 meses de agendas ativas.
        </p>

        {showForm && (
          <div className="p-3 border rounded-lg space-y-3 bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do colega *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" className="h-8 text-sm" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="h-8 text-sm" maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone (opcional)</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="81 99999-9999" className="h-8 text-sm" maxLength={20} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-xs" onClick={handleSubmit} disabled={addReferral.isPending}>
                {addReferral.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Enviar
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Active referrals with progress */}
            {activeReferrals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Minhas Indicações</p>
                {activeReferrals.map(r => {
                  const prog = getProgress(r.started_at!);
                  return (
                    <div key={r.id} className="p-2 rounded-lg border bg-card/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{r.referred_name}</p>
                        {prog.completed ? (
                          <Badge className="bg-[hsl(var(--success))] text-white text-xs gap-1">
                            <DollarSign className="h-3 w-3" /> Concluído!
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{prog.remaining}d restantes</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={prog.pct} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-muted-foreground w-8 text-right">{prog.pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending referrals */}
            {pendingReferrals.length > 0 && (
              <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                {activeReferrals.length > 0 && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aguardando Início</p>}
                {pendingReferrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                    <div>
                      <p className="text-sm font-medium">{r.referred_name}</p>
                      <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />Pendente</Badge>
                  </div>
                ))}
              </div>
            )}

            {referrals.length === 0 && !showForm && (
              <p className="text-xs text-muted-foreground text-center py-3">Nenhuma indicação ainda. Seja o primeiro!</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
