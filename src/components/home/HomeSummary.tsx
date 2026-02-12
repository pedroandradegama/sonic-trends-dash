import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDoctorPreferences } from '@/hooks/useDoctorPreferences';
import { useIntegratedDashboard } from '@/hooks/useIntegratedDashboard';
import { useCasuisticaData } from '@/hooks/useCasuisticaData';
import { useNPSData } from '@/hooks/useNPSData';
import { useInterestingCases } from '@/hooks/useInterestingCases';
import { useAgendaComunicacoes } from '@/hooks/useAgendaComunicacoes';
import {
  User, DollarSign, BarChart3, ThumbsUp, Wrench, ArrowRight,
  Baby, Stethoscope, BookOpen, ChevronRight, Bookmark,
  FlaskConical, Droplets, Activity, CalendarPlus, CalendarOff, AlertTriangle,
} from 'lucide-react';
import { format, parseISO, isFuture, isToday, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SCHEDULING_LABELS: Record<string, string> = {
  combo: 'Combo',
  rotatividade: 'Rotatividade',
};

// Feriados 2026
const FERIADOS_2026 = [
  { date: '2026-01-01', name: 'Confraternização Universal' },
  { date: '2026-02-15', name: 'Domingo de Carnaval' },
  { date: '2026-02-17', name: 'Terça-feira de Carnaval' },
  { date: '2026-04-03', name: 'Sexta-feira Santa' },
  { date: '2026-05-01', name: 'Dia do Trabalhador' },
  { date: '2026-09-07', name: 'Independência do Brasil' },
  { date: '2026-11-02', name: 'Finados' },
  { date: '2026-12-25', name: 'Natal' },
];

export function HomeSummary() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { preferences } = useDoctorPreferences();
  const { kpis, loading: dashLoading, examDistribution } = useIntegratedDashboard();
  const { data: casuisticaData, loading: casLoading } = useCasuisticaData();
  const { data: npsData, loading: npsLoading } = useNPSData();
  const { cases: interestingCases, loading: casesLoading } = useInterestingCases();
  const { comunicacoes, isLoading: agendaLoading } = useAgendaComunicacoes();

  // Perfil summary
  const perfilSummary = useMemo(() => {
    if (!preferences) return null;
    const items: string[] = [];
    items.push(`Perfil: ${SCHEDULING_LABELS[preferences.scheduling_profile] || preferences.scheduling_profile}`);
    if (preferences.overbooking_enabled) items.push(`Overbooking: ${preferences.overbooking_percentage || 0}%`);
    if (preferences.coffee) items.push('☕ Café');
    if (preferences.tea) items.push('🍵 Chá');
    if (preferences.ambient_music) items.push(`🎵 ${preferences.music_genre || 'Música'}`);
    return items;
  }, [preferences]);

  const topExams = useMemo(() => examDistribution.slice(0, 5), [examDistribution]);

  const casuisticaSummary = useMemo(() => {
    if (!casuisticaData || casuisticaData.length === 0) return null;
    const diagnosticos = new Set(
      casuisticaData.map(r => r['Comentário']).filter((v): v is string => !!v && v.trim().length > 0)
    );
    return { totalExames: casuisticaData.length, totalDiagnosticos: diagnosticos.size };
  }, [casuisticaData]);

  const npsSummary = useMemo(() => {
    if (!npsData || npsData.length === 0) return null;
    const scores = npsData.map(r => r.nota_real).filter((n): n is number => typeof n === 'number' && n >= 0 && n <= 10);
    if (scores.length === 0) return null;
    const promoters = scores.filter(n => n >= 9).length;
    const detractors = scores.filter(n => n <= 6).length;
    const npsPercentual = ((promoters - detractors) / scores.length) * 100;
    return { nps: Math.round(npsPercentual), total: scores.length, promoters, detractors };
  }, [npsData]);

  // Next feriado
  const nextFeriado = useMemo(() => {
    return FERIADOS_2026.find(f => isFuture(parseISO(f.date)) || isToday(parseISO(f.date)));
  }, []);

  // Next agenda entry
  const nextAgenda = useMemo(() => {
    if (!comunicacoes || comunicacoes.length === 0) return null;
    const future = comunicacoes
      .filter(c => isFuture(parseISO(c.data_agenda)) || isToday(parseISO(c.data_agenda)))
      .sort((a, b) => a.data_agenda.localeCompare(b.data_agenda));
    return future[0] || null;
  }, [comunicacoes]);

  // Alert: check if next month has no agenda entries
  const nextMonthMissing = useMemo(() => {
    const nextMonth = addMonths(new Date(), 1);
    const start = startOfMonth(nextMonth);
    const end = endOfMonth(nextMonth);
    const hasNextMonth = comunicacoes.some(c => {
      const d = parseISO(c.data_agenda);
      return isWithinInterval(d, { start, end });
    });
    return !hasNextMonth;
  }, [comunicacoes]);

  const tools = [
    { label: 'US Pediátrico — Percentis', icon: Baby, path: '/ferramentas/percentis-us' },
    { label: 'ACR TI-RADS (2017)', icon: Stethoscope, path: '/ferramentas/ti-rads' },
    { label: 'Medidas Adulto', icon: BookOpen, path: '/ferramentas/medidas-adulto' },
    { label: 'Prova Motora VB', icon: FlaskConical, path: '/ferramentas/prova-motora-vb' },
    { label: 'Vol. Vesical Ped.', icon: Droplets, path: '/ferramentas/volume-vesical-ped' },
    { label: 'CMI/IMT Percentil', icon: Activity, path: '/ferramentas/cimt-percentile' },
  ];

  const isLoading = dashLoading || casLoading || npsLoading || casesLoading || agendaLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {profile ? `Olá, Dr(a). ${profile.medico_nome.split(' ')[0]}` : 'Home'}
        </h1>
        <p className="text-muted-foreground mt-1">Resumo do seu portal</p>
      </div>

      {/* Alert: missing next month agenda */}
      {!isLoading && nextMonthMissing && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Atenção:</strong> Você ainda não enviou sua disponibilidade para o mês de{' '}
            <strong>{format(addMonths(new Date(), 1), 'MMMM yyyy', { locale: ptBR })}</strong>.{' '}
            <Button variant="link" className="p-0 h-auto text-amber-800 dark:text-amber-200 underline" onClick={() => navigate('/institucional')}>
              Enviar agora →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Próxima Agenda */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/institucional')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-primary" />
                  Sua Agenda
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextAgenda ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium capitalize">
                    {format(parseISO(nextAgenda.data_agenda), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextAgenda.horario_inicio?.slice(0, 5)}
                    {nextAgenda.horario_fim && ` – ${nextAgenda.horario_fim.slice(0, 5)}`}
                  </p>
                  {nextAgenda.comentarios && (
                    <p className="text-xs text-muted-foreground italic">"{nextAgenda.comentarios}"</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem agenda futura registrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Próximo Feriado */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/institucional')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarOff className="h-4 w-4 text-destructive" />
                  Próximo Feriado
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextFeriado ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{nextFeriado.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(parseISO(nextFeriado.date), "dd 'de' MMMM (EEEE)", { locale: ptBR })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum feriado próximo.</p>
              )}
            </CardContent>
          </Card>

          {/* Perfil */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/perfil')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><User className="h-4 w-4 text-primary" />Perfil</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {perfilSummary ? (
                <div className="flex flex-wrap gap-1.5">
                  {perfilSummary.map((item, i) => <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Configure suas preferências.</p>
              )}
            </CardContent>
          </Card>

          {/* Repasse */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Repasse</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  R$ {kpis.repasseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {kpis.totalExames} exames · Ticket médio R$ {kpis.ticketMedio.toFixed(2)}
              </div>
              {topExams.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {topExams.slice(0, 3).map(e => (
                    <Badge key={e.exame} variant="outline" className="text-xs truncate max-w-[140px]">{e.exame}: {e.quantidade}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Casuística */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/casuistica')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Casuística</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {casuisticaSummary ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">{casuisticaSummary.totalExames}</span>
                    <span className="text-xs text-muted-foreground">exames registrados</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{casuisticaSummary.totalDiagnosticos} diagnósticos únicos</div>
                  {interestingCases.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Bookmark className="h-3 w-3" />
                        {interestingCases.length} caso{interestingCases.length !== 1 ? 's' : ''} interessante{interestingCases.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de casuística.</p>
              )}
            </CardContent>
          </Card>

          {/* NPS */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/nps')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-primary" />NPS</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {npsSummary ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      npsSummary.nps >= 50 ? 'text-[hsl(var(--success))]' :
                      npsSummary.nps >= 0 ? 'text-[hsl(var(--warning))]' : 'text-destructive'
                    }`}>{npsSummary.nps}</span>
                    <span className="text-xs text-muted-foreground">NPS score</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {npsSummary.total} respostas · {npsSummary.promoters} promotores · {npsSummary.detractors} detratores
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de NPS.</p>
              )}
            </CardContent>
          </Card>

          {/* Ferramentas */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow group md:col-span-2 xl:col-span-3" onClick={() => navigate('/ferramentas')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" />Ferramentas</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tools.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <Button key={tool.path} variant="outline" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(tool.path); }}>
                      <Icon className="h-4 w-4" />{tool.label}<ArrowRight className="h-3 w-3" />
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
