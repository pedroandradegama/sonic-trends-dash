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
    <Card className="relative overflow-hidden border-0 bg-[hsl(195,50%,16%)] text-white">
      {/* Decorative gradient orbs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[radial-gradient(circle,hsl(193,44%,42%,0.3)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[radial-gradient(circle,hsl(195,47%,34%,0.25)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-72 h-72 -translate-y-1/2 translate-x-1/3 rounded-full bg-[radial-gradient(circle,hsl(190,45%,50%,0.12)_0%,transparent_60%)] pointer-events-none" />
      {/* Subtle concentric ring */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full border border-white/[0.08] pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full border border-white/[0.05] pointer-events-none" />

      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2 text-white">
            <UserPlus className="h-4 w-4 text-[hsl(190,60%,70%)]" />
            Member Get Member
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
            onClick={() => setShowForm(!showForm)}
          >
            <Send className="h-3 w-3" /> Indicar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        <p className="text-xs text-white/60">
          Indique colegas e receba após 6 meses de agendas ativas.
        </p>

        {showForm && (
          <div className="p-3 border border-white/20 rounded-lg space-y-3 bg-white/10 backdrop-blur-sm">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Nome do colega *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40" maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Telefone (opcional)</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="81 99999-9999" className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40" maxLength={20} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-xs bg-[hsl(190,60%,70%)] text-[hsl(195,50%,12%)] hover:bg-[hsl(190,60%,80%)]" onClick={handleSubmit} disabled={addReferral.isPending}>
                {addReferral.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Enviar
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-white/30 text-white hover:bg-white/10" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-white/50" /></div>
        ) : (
          <>
            {activeReferrals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Minhas Indicações</p>
                {activeReferrals.map(r => {
                  const prog = getProgress(r.started_at!);
                  return (
                    <div key={r.id} className="p-2 rounded-lg border border-white/15 bg-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{r.referred_name}</p>
                        {prog.completed ? (
                          <Badge className="bg-[hsl(152,60%,45%)] text-white text-xs gap-1">
                            <DollarSign className="h-3 w-3" /> Concluído!
                          </Badge>
                        ) : (
                          <span className="text-xs text-white/50">{prog.remaining}d restantes</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={prog.pct} className="h-1.5 flex-1 bg-white/15 [&>div]:bg-[hsl(190,60%,70%)]" />
                        <span className="text-xs font-medium text-white/60 w-8 text-right">{prog.pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pendingReferrals.length > 0 && (
              <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                {activeReferrals.length > 0 && <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Aguardando Início</p>}
                {pendingReferrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-white/15 bg-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">{r.referred_name}</p>
                      <p className="text-xs text-white/50">{r.referred_email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs gap-1 border-white/30 text-white/70"><Clock className="h-3 w-3" />Pendente</Badge>
                  </div>
                ))}
              </div>
            )}

            {referrals.length === 0 && !showForm && (
              <p className="text-xs text-white/50 text-center py-3">Nenhuma indicação ainda. Seja o primeiro!</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
