import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDoctorPreferences } from '@/hooks/useDoctorPreferences';
import { useIntegratedDashboard } from '@/hooks/useIntegratedDashboard';
import { useCasuisticaData } from '@/hooks/useCasuisticaData';
import { useNPSData } from '@/hooks/useNPSData';
import { useInterestingCases } from '@/hooks/useInterestingCases';
import { useAgendaComunicacoes } from '@/hooks/useAgendaComunicacoes';
import { useUltrasoundArticles } from '@/hooks/useUltrasoundArticles';
import { useAdminHolidays, useAdminRadioburger } from '@/hooks/useAdminSettings';
import { useRepasseData } from '@/hooks/useRepasseData';
import { DestaquesCard } from '@/components/home/DestaquesCard';
import {
  DollarSign, BarChart3, ThumbsUp, ArrowRight,
  Baby, Stethoscope, BookOpen, ChevronRight, Bookmark,
  FlaskConical, Droplets, Activity, CalendarPlus, CalendarOff, AlertTriangle,
  Brain, FileText, Wrench, ExternalLink, Calendar,
} from 'lucide-react';
import { format, parseISO, isFuture, isToday, addMonths, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function HomeSummary() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { kpis, loading: dashLoading, examDistribution } = useIntegratedDashboard();
  const { data: casuisticaData, loading: casLoading } = useCasuisticaData();
  const { data: npsData, loading: npsLoading } = useNPSData();
  const { cases: interestingCases, loading: casesLoading } = useInterestingCases();
  const { comunicacoes, isLoading: agendaLoading } = useAgendaComunicacoes();
  const { data: articles } = useUltrasoundArticles({ });
  const { data: repasseRaw } = useRepasseData();
  const { holidays } = useAdminHolidays();
  const { dates: radioburgerDates } = useAdminRadioburger();

  const topExams = useMemo(() => examDistribution.slice(0, 3), [examDistribution]);

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

  const nextFeriado = useMemo(() => {
    return holidays.find(f => isFuture(parseISO(f.date)) || isToday(parseISO(f.date)));
  }, [holidays]);

  const radioburgerDaysUntil = useMemo(() => {
    const next = radioburgerDates.find(d => {
      const diff = differenceInDays(parseISO(d.date), new Date());
      return diff >= 0;
    });
    if (!next) return null;
    return differenceInDays(parseISO(next.date), new Date());
  }, [radioburgerDates]);

  const latestArticle = useMemo(() => {
    if (!articles || articles.length === 0) return null;
    return articles[0];
  }, [articles]);

  const nextAgenda = useMemo(() => {
    if (!comunicacoes || comunicacoes.length === 0) return null;
    const future = comunicacoes
      .filter(c => isFuture(parseISO(c.data_agenda)) || isToday(parseISO(c.data_agenda)))
      .sort((a, b) => a.data_agenda.localeCompare(b.data_agenda));
    return future[0] || null;
  }, [comunicacoes]);

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

  const nextMonthName = format(addMonths(new Date(), 1), 'MMMM', { locale: ptBR });

  const firstName = useMemo(() => {
    if (!profile?.medico_nome) return '';
    const raw = profile.medico_nome.split(' ')[0];
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }, [profile]);

  const dynamicSubtitle = useMemo(() => {
    if (nextMonthMissing) return `Você tem disponibilidade pendente para ${nextMonthName}.`;
    return 'Tudo em dia. Bom trabalho!';
  }, [nextMonthMissing, nextMonthName]);

  const tools = [
    { label: 'Percentis Pediátrico', icon: Baby, path: '/ferramentas/percentis-us' },
    { label: 'ACR TI-RADS', icon: Stethoscope, path: '/ferramentas/ti-rads' },
    { label: 'Medidas Adulto', icon: BookOpen, path: '/ferramentas/medidas-adulto' },
    { label: 'CMI/IMT Percentil', icon: Activity, path: '/ferramentas/cimt-percentile' },
  ];

  const isLoading = dashLoading || casLoading || npsLoading || casesLoading || agendaLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {profile ? `Olá, Dr. ${firstName}` : 'Home'}
        </h1>
        <p className="text-muted-foreground mt-1">{dynamicSubtitle}</p>
      </div>

      {/* Alert: missing next month agenda */}
      {!isLoading && nextMonthMissing && (
        <Alert className="border-[hsl(var(--warning))]/50 bg-[hsl(var(--warning)/0.15)]">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
          <AlertDescription className="text-foreground">
            <strong>Atenção:</strong> Você ainda não enviou sua disponibilidade para{' '}
            <strong>{nextMonthName}</strong>.{' '}
            <Button variant="link" className="p-0 h-auto text-foreground underline font-semibold" onClick={() => navigate('/minha-agenda')}>
              Preencher disponibilidade de {nextMonthName} →
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
        <>
          {/* Row 1 — Action & Performance (3 columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Sua Agenda */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/minha-agenda')}>
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
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Nenhuma agenda futura registrada.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-primary"
                      onClick={(e) => { e.stopPropagation(); navigate('/minha-agenda'); }}
                    >
                      Enviar sua disponibilidade →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Repasse */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/meu-trabalho')}>
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
                    {topExams.map(e => (
                      <Badge key={e.exame} variant="outline" className="text-xs truncate max-w-[140px]">{e.exame}: {e.quantidade}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 3: Desempenho (Casuística + NPS) */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/meu-trabalho')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Desempenho</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {/* Casuística block */}
                <div className="space-y-1.5">
                  {casuisticaSummary ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-foreground">{casuisticaSummary.totalExames}</span>
                        <span className="text-xs text-muted-foreground">exames registrados</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{casuisticaSummary.totalDiagnosticos} diagnósticos únicos</div>
                      {interestingCases.length > 0 && (
                        <div className="flex items-center gap-1.5">
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
                </div>

                <Separator className="my-3" />

                {/* NPS block */}
                <div>
                  {npsSummary ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-baseline gap-1">
                        <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                        <span className={`text-xl font-bold ${
                          npsSummary.nps >= 50 ? 'text-[hsl(var(--success))]' :
                          npsSummary.nps >= 0 ? 'text-[hsl(var(--warning))]' : 'text-destructive'
                        }`}>{npsSummary.nps}</span>
                        <span className="text-xs text-muted-foreground">NPS</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {npsSummary.promoters} prom. · {npsSummary.detractors} detr.
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem dados de NPS.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 1.5 — Destaques */}
          <DestaquesCard
            repasseData={repasseRaw}
            npsData={npsData}
            casuisticaData={casuisticaData}
            totalExames={kpis.totalExames}
          />

          {/* Row 2 — Context & Tools (1:2 proportion) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card: Minha Imag (1/3) */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Minha Imag
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Próximo feriado */}
                {nextFeriado && (
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Próximo Feriado</p>
                    <p className="text-sm font-medium">{nextFeriado.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {format(parseISO(nextFeriado.date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Radioburger */}
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Radioburger</p>
                  {radioburgerDaysUntil !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-primary">em {radioburgerDaysUntil} dias</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Evento já realizado</p>
                  )}
                </div>

                <Separator />

                {/* Último artigo */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Último Artigo</p>
                  {latestArticle ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-2">{latestArticle.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{latestArticle.subgroup}</Badge>
                        <a href={latestArticle.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          ler <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum artigo disponível.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card: Ferramentas & IA (2/3) */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" />Ferramentas & IA</span>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary" onClick={() => navigate('/ferramentas-ia')}>
                    ver todas →
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 2x2 tool grid */}
                <div className="grid grid-cols-2 gap-2">
                  {tools.map(tool => {
                    const Icon = tool.icon;
                    return (
                      <Button
                        key={tool.path}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-auto py-2.5 px-3"
                        onClick={() => navigate(tool.path)}
                      >
                        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-xs truncate">{tool.label}</span>
                      </Button>
                    );
                  })}
                </div>

                <Separator />

                {/* AI features highlight */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                  <p className="text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5" />
                    Inteligência Artificial
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-2 h-auto py-2 px-3 bg-primary/5 hover:bg-primary/10"
                      onClick={() => navigate('/ferramentas-ia')}
                    >
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-xs">Discussão de HD</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-2 h-auto py-2 px-3 bg-primary/5 hover:bg-primary/10"
                      onClick={() => navigate('/ferramentas-ia')}
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-xs">Revisão de Laudo</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
