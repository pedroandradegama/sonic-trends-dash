import { useState, useMemo } from 'react';
import { useNPSByMedico } from '@/hooks/useNPSByMedico';
import { useNPSByConvenio } from '@/hooks/useNPSByConvenio';
import { useNPSPeriod } from '@/hooks/useDataPeriod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { PeriodFilter, PeriodType } from '@/components/filters/PeriodFilter';
import { DataPeriodInfo } from '@/components/filters/DataPeriodInfo';
import { NPSMedicoCard } from '@/components/nps/NPSMedicoCard';
import { NPSChart } from '@/components/nps/NPSChart';
import { NPSConvenioChart } from '@/components/nps/NPSConvenioChart';
import { NPSConvenioCard } from '@/components/nps/NPSConvenioCard';
import { startOfDay, endOfDay, subDays, startOfMonth, startOfYear, parse } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NPS() {
  const { signOut, user } = useAuth();
  const { minDate, maxDate, loading: periodLoading } = useNPSPeriod();
  const [period, setPeriod] = useState<PeriodType>('mtd');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [customMonth, setCustomMonth] = useState<string>();

  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case '7d':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case 'mtd':
        return { start: startOfMonth(now), end: endOfDay(now) };
      case 'ytd':
        return { start: startOfYear(now), end: endOfDay(now) };
      case 'month':
        if (customMonth) {
          const monthDate = parse(customMonth, 'yyyy-MM', new Date());
          return { 
            start: startOfMonth(monthDate), 
            end: endOfDay(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0))
          };
        }
        return { start: startOfMonth(now), end: endOfDay(now) };
      case 'custom':
        return startDate && endDate ? { start: startDate, end: endDate } : undefined;
      default:
        return undefined;
    }
  }, [period, startDate, endDate, customMonth]);

  const { data, loading, error } = useNPSByMedico(dateRange?.start, dateRange?.end);
  const { data: convenioData, loading: convenioLoading, error: convenioError } = useNPSByConvenio(dateRange?.start, dateRange?.end);

  // Calcular NPS médio geral
  const npsGeral = useMemo(() => {
    if (data.length === 0) return { nps: 0, notaMedia: 0, totalRespostas: 0 };
    
    const totalRespostas = data.reduce((sum, m) => sum + m.totalRespostas, 0);
    const totalPromotores = data.reduce((sum, m) => sum + m.promotores, 0);
    const totalDetratores = data.reduce((sum, m) => sum + m.detratores, 0);
    const somaNotas = data.reduce((sum, m) => sum + (m.notaMedia * m.totalRespostas), 0);
    
    const percentualPromotores = (totalPromotores / totalRespostas) * 100;
    const percentualDetratores = (totalDetratores / totalRespostas) * 100;
    const nps = percentualPromotores - percentualDetratores;
    const notaMedia = somaNotas / totalRespostas;
    
    return { nps, notaMedia, totalRespostas };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          Erro ao carregar dados: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">NPS por Médico</h1>
          <p className="text-muted-foreground mt-1">
            Olá, {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Repasse</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/casuistica">Casuística</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/nps">NPS</Link>
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Selecione o período para análise</span>
            <DataPeriodInfo minDate={minDate} maxDate={maxDate} loading={periodLoading} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PeriodFilter
            period={period}
            onPeriodChange={setPeriod}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            customMonth={customMonth}
            onCustomMonthChange={setCustomMonth}
          />
        </CardContent>
      </Card>

      {/* NPS Geral */}
      {data.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">NPS Médio Geral</CardTitle>
            <CardDescription>Resultado consolidado de todos os médicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{npsGeral.nps.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-1">NPS Score</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{npsGeral.notaMedia.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Nota Média</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{npsGeral.totalRespostas}</p>
                <p className="text-sm text-muted-foreground mt-1">Total de Respostas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs para Médico e Convênio */}
      <Tabs defaultValue="medico" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="medico">Por Médico</TabsTrigger>
          <TabsTrigger value="convenio">Por Convênio</TabsTrigger>
        </TabsList>

        {/* Tab Por Médico */}
        <TabsContent value="medico" className="space-y-6">
          {data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparativo de NPS por Médico</CardTitle>
                <CardDescription>
                  Visualização comparativa do NPS de cada médico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NPSChart data={data} />
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Detalhamento por Médico ({data.length})
            </h2>
            {data.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum dado encontrado para o período selecionado.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((medico) => (
                  <NPSMedicoCard key={medico.medico} data={medico} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Por Convênio */}
        <TabsContent value="convenio" className="space-y-6">
          {convenioData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparativo de NPS por Convênio</CardTitle>
                <CardDescription>
                  Visualização comparativa do NPS de cada convênio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NPSConvenioChart data={convenioData} />
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Detalhamento por Convênio ({convenioData.length})
            </h2>
            {convenioData.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum dado encontrado para o período selecionado.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {convenioData.map((convenio) => (
                  <NPSConvenioCard key={convenio.convenio} data={convenio} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
