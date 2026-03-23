import { useState } from 'react';
import { Share2, MessageCircle as MessageCircleIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useInterestingCases } from '@/hooks/useInterestingCases';
import { Plus, Trash2, Calendar, Stethoscope, Bell, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, parseISO, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function InterestingCasesPanel() {
  const { cases, loading, addCase, deleteCase, toggleResolved } = useInterestingCases();
  const [showForm, setShowForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [wantsFollowup, setWantsFollowup] = useState(false);
  const [followupDays, setFollowupDays] = useState<number>(30);
  const [sharedWithTeam, setSharedWithTeam] = useState(false);
  const [requestOpinion, setRequestOpinion] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setPatientName('');
    setExamDate('');
    setHypothesis('');
    setWantsFollowup(false);
    setFollowupDays(30);
    setSharedWithTeam(false);
    setRequestOpinion(false);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!patientName.trim() || !examDate) {
      toast.error('Preencha o nome do paciente e a data do exame.');
      return;
    }
    try {
      setSubmitting(true);
      await addCase({
        patient_name: patientName.trim(),
        exam_date: examDate,
        diagnostic_hypothesis: hypothesis.trim() || undefined,
        wants_followup: wantsFollowup,
        followup_days: wantsFollowup ? followupDays : undefined,
        shared_with_team: sharedWithTeam,
        request_opinion: requestOpinion,
      });
      toast.success('Caso adicionado com sucesso.');
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao adicionar caso.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCase(id);
      toast.success('Caso removido.');
    } catch {
      toast.error('Erro ao remover caso.');
    }
  };

  const getFollowupStatus = (c: typeof cases[0]) => {
    if (!c.wants_followup || !c.followup_days) return null;
    const target = addDays(parseISO(c.exam_date), c.followup_days);
    const overdue = isBefore(target, new Date());
    return { target, overdue };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Casos Interessantes</h3>
          <p className="text-sm text-muted-foreground">
            {cases.length} caso{cases.length !== 1 ? 's' : ''} anotado{cases.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Caso
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar Caso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Paciente *</Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome completo"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Exame *</Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hipótese Diagnóstica (opcional)</Label>
              <Input
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="Ex: Nódulo hepático suspeito"
                maxLength={500}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={wantsFollowup} onCheckedChange={setWantsFollowup} />
                <Label>Lembrar de verificar follow-up</Label>
              </div>
              {wantsFollowup && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Em quantos dias:</Label>
                  <Input
                    type="number"
                    value={followupDays}
                    onChange={(e) => setFollowupDays(Number(e.target.value))}
                    min={1}
                    max={730}
                    className="w-24"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch checked={sharedWithTeam} onCheckedChange={setSharedWithTeam} />
                <Label className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Compartilhar com a equipe</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={requestOpinion} onCheckedChange={setRequestOpinion} />
                <Label className="flex items-center gap-1"><MessageCircleIcon className="h-3.5 w-3.5" /> Solicitar opinião da equipe</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting} size="sm">
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button onClick={resetForm} variant="outline" size="sm">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {cases.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum caso interessante registrado ainda. Clique em "Novo Caso" para adicionar.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {cases.map((c) => {
          const followup = getFollowupStatus(c);
          return (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{c.patient_name}</span>
                      {c.diagnostic_hypothesis && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {c.diagnostic_hypothesis}
                        </Badge>
                      )}
                      {c.shared_with_team && (
                        <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                          <Share2 className="h-3 w-3" />
                          Compartilhado
                        </Badge>
                      )}
                      {c.request_opinion && (
                        <Badge variant="outline" className="text-xs gap-1 border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]">
                          <MessageCircleIcon className="h-3 w-3" />
                          Opinião solicitada
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(c.exam_date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {followup && (
                        <span className={`flex items-center gap-1 ${followup.overdue ? 'text-destructive font-medium' : 'text-primary'}`}>
                          <Bell className="h-3 w-3" />
                          Follow-up: {format(followup.target, "dd/MM/yyyy", { locale: ptBR })}
                          {followup.overdue && ' (vencido)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        try {
                          await toggleResolved(c.id, !c.resolved);
                          toast.success(c.resolved ? 'Caso reaberto.' : 'Caso marcado como resolvido.');
                        } catch {
                          toast.error('Erro ao atualizar caso.');
                        }
                      }}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
                        c.resolved
                          ? "text-[hsl(var(--success))] hover:text-[hsl(var(--success))]/80"
                          : "text-muted-foreground hover:text-[hsl(var(--success))]"
                      )}
                      title={c.resolved ? 'Reabrir caso' : 'Marcar como resolvido'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
