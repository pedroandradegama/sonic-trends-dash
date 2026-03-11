import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Send, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useMemberReferrals } from '@/hooks/useMemberReferrals';
import { toast } from 'sonner';

export function MemberGetMemberCard() {
  const { referrals, isLoading, addReferral } = useMemberReferrals();
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
      });
      toast.success('Indicação enviada com sucesso!');
      setName(''); setEmail(''); setPhone(''); setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar indicação.');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge variant="outline" className="text-xs gap-1 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"><CheckCircle2 className="h-3 w-3" />Aprovado</Badge>;
    return <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
  };

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
          Indique colegas para a plataforma e fortaleça nossa comunidade.
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
        ) : referrals.length > 0 ? (
          <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                <div>
                  <p className="text-sm font-medium">{r.referred_name}</p>
                  <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                </div>
                {statusBadge(r.status)}
              </div>
            ))}
          </div>
        ) : !showForm ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhuma indicação ainda. Seja o primeiro!</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
