import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAdminHolidays, useAdminRadioburger, useAdminAgendaEmails } from '@/hooks/useAdminSettings';
import { CalendarOff, Calendar, Mail, Plus, Trash2, Loader2 } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function AdminConfigTab() {
  return (
    <div className="space-y-6">
      <HolidaysSection />
      <RadioburgerSection />
      <AgendaEmailsSection />
    </div>
  );
}

function HolidaysSection() {
  const { holidays, loading, add, remove } = useAdminHolidays();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!date || !name.trim()) return;
    try {
      await add.mutateAsync({ date, name: name.trim() });
      setDate(''); setName('');
      toast.success('Feriado adicionado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarOff className="h-5 w-5 text-destructive" /> Feriados</CardTitle>
        <CardDescription>Gerencie os feriados em que a IMAG estará fechada</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="space-y-1 flex-1">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-1 flex-[2]">
            <Label>Nome do Feriado</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Carnaval" />
          </div>
          <Button onClick={handleAdd} disabled={add.isPending} size="sm" className="gap-1">
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            {holidays.map(h => (
              <div key={h.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPast(parseISO(h.date)) ? 'opacity-50' : 'bg-card'}`}>
                <div>
                  <p className="font-medium text-sm">{h.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{format(parseISO(h.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { remove.mutate(h.id); toast.success('Removido'); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {holidays.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum feriado cadastrado.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RadioburgerSection() {
  const { dates, loading, add, remove } = useAdminRadioburger();
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = async () => {
    if (!date) return;
    try {
      await add.mutateAsync({ date, description: desc.trim() || undefined });
      setDate(''); setDesc('');
      toast.success('Data do Radioburger adicionada');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Datas do Radioburger</CardTitle>
        <CardDescription>Defina as próximas datas do evento Radioburger</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="space-y-1 flex-1">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-1 flex-[2]">
            <Label>Descrição (opcional)</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Radioburger Março 2026" />
          </div>
          <Button onClick={handleAdd} disabled={add.isPending} size="sm" className="gap-1">
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            {dates.map(d => (
              <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPast(parseISO(d.date)) ? 'opacity-50' : 'bg-card'}`}>
                <div>
                  <p className="font-medium text-sm">{d.description || 'Radioburger'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{format(parseISO(d.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { remove.mutate(d.id); toast.success('Removido'); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {dates.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma data cadastrada.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgendaEmailsSection() {
  const { emails, loading, add, remove } = useAdminAgendaEmails();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!email.trim()) return;
    try {
      await add.mutateAsync({ email: email.trim().toLowerCase(), name: name.trim() || undefined });
      setEmail(''); setName('');
      toast.success('Email adicionado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Destinatários de Agenda</CardTitle>
        <CardDescription>Emails que receberão as comunicações de agenda e preferências dos médicos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="space-y-1 flex-1">
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Coordenação" />
          </div>
          <div className="space-y-1 flex-[2]">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coordenacao@imag.com" />
          </div>
          <Button onClick={handleAdd} disabled={add.isPending} size="sm" className="gap-1">
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            {emails.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <p className="font-medium text-sm">{e.name || 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground">{e.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { remove.mutate(e.id); toast.success('Removido'); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {emails.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum email cadastrado.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
