import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDoctorPreferences } from '@/hooks/useDoctorPreferences';
import { useIntegratedDashboard } from '@/hooks/useIntegratedDashboard';
import { useCasuisticaData } from '@/hooks/useCasuisticaData';
import { useNPSData } from '@/hooks/useNPSData';
import { useInterestingCases } from '@/hooks/useInterestingCases';
import {
  User,
  DollarSign,
  BarChart3,
  ThumbsUp,
  Wrench,
  ArrowRight,
  Baby,
  Stethoscope,
  BookOpen,
  ChevronRight,
  Bookmark,
  FlaskConical,
  Droplets,
} from 'lucide-react';

const SCHEDULING_LABELS: Record<string, string> = {
  combo: 'Combo',
  rotatividade: 'Rotatividade',
};

export function HomeSummary() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { preferences } = useDoctorPreferences();
  const { kpis, loading: dashLoading, examDistribution } = useIntegratedDashboard();
  const { data: casuisticaData, loading: casLoading } = useCasuisticaData();
  const { data: npsData, loading: npsLoading } = useNPSData();
  const { cases: interestingCases, loading: casesLoading } = useInterestingCases();

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

  // Repasse top exams
  const topExams = useMemo(() => {
    return examDistribution.slice(0, 5);
  }, [examDistribution]);

  // Casuística summary
  const casuisticaSummary = useMemo(() => {
    if (!casuisticaData || casuisticaData.length === 0) return null;

    // Count unique diagnoses (from Comentário field)
    const diagnosticos = new Set(
      casuisticaData
        .map(r => r['Comentário'])
        .filter((v): v is string => !!v && v.trim().length > 0)
    );

    // Count unique products
    const totalExames = casuisticaData.length;

    return {
      totalExames,
      totalDiagnosticos: diagnosticos.size,
    };
  }, [casuisticaData]);

  // NPS summary
  const npsSummary = useMemo(() => {
    if (!npsData || npsData.length === 0) return null;

    const scores = npsData
      .map(r => r.nota_real)
      .filter((n): n is number => typeof n === 'number' && n >= 0 && n <= 10);

    if (scores.length === 0) return null;

    const promoters = scores.filter(n => n >= 9).length;
    const detractors = scores.filter(n => n <= 6).length;
    const npsPercentual = ((promoters - detractors) / scores.length) * 100;

    return {
      nps: Math.round(npsPercentual),
      total: scores.length,
      promoters,
      detractors,
    };
  }, [npsData]);

  const tools = [
    { label: 'US Pediátrico — Percentis', icon: Baby, path: '/ferramentas/percentis-us' },
    { label: 'ACR TI-RADS (2017)', icon: Stethoscope, path: '/ferramentas/ti-rads' },
    { label: 'Medidas Adulto', icon: BookOpen, path: '/ferramentas/medidas-adulto' },
    { label: 'Prova Motora VB', icon: FlaskConical, path: '/ferramentas/prova-motora-vb' },
    { label: 'Vol. Vesical Ped.', icon: Droplets, path: '/ferramentas/volume-vesical-ped' },
  ];

  const isLoading = dashLoading || casLoading || npsLoading || casesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {profile ? `Olá, Dr(a). ${profile.medico_nome.split(' ')[0]}` : 'Home'}
        </h1>
        <p className="text-muted-foreground mt-1">Resumo do seu portal</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Perfil */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/perfil')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Perfil
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {perfilSummary ? (
                <div className="flex flex-wrap gap-1.5">
                  {perfilSummary.map((item, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Configure suas preferências.</p>
              )}
            </CardContent>
          </Card>

          {/* Repasse */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Repasse
                </span>
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
                  {topExams.slice(0, 3).map((e) => (
                    <Badge key={e.exame} variant="outline" className="text-xs truncate max-w-[140px]">
                      {e.exame}: {e.quantidade}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Casuística */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/casuistica')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Casuística
                </span>
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
                  <div className="text-xs text-muted-foreground">
                    {casuisticaSummary.totalDiagnosticos} diagnósticos únicos
                  </div>
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
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/nps')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                  NPS
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {npsSummary ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      npsSummary.nps >= 50 ? 'text-[hsl(var(--success))]' :
                      npsSummary.nps >= 0 ? 'text-[hsl(var(--warning))]' :
                      'text-destructive'
                    }`}>
                      {npsSummary.nps}
                    </span>
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
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow group md:col-span-2 xl:col-span-2"
            onClick={() => navigate('/ferramentas')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  Ferramentas
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.path}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(tool.path);
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {tool.label}
                      <ArrowRight className="h-3 w-3" />
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
