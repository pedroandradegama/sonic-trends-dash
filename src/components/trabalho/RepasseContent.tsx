import { useState, useMemo } from 'react';
import { useIntegratedDashboard } from '@/hooks/useIntegratedDashboard';
import { useRepassePeriod } from '@/hooks/useDataPeriod';
import { useUserProfile } from '@/hooks/useUserProfile';
import { KPICard } from '@/components/kpis/KPICard';
import { PeriodFilter, PeriodType } from '@/components/filters/PeriodFilter';
import { DataPeriodInfo } from '@/components/filters/DataPeriodInfo';
import { ExamFilter } from '@/components/filters/ExamFilter';
import { ConvenioFilter } from '@/components/filters/ConvenioFilter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { startOfDay, endOfDay, subDays, startOfMonth, startOfYear, parse } from 'date-fns';
import { TimeSeriesChart, ChartMetric } from '@/components/dashboard/TimeSeriesChart';
import { ProductChart } from '@/components/dashboard/ProductChart';
import { ConvenioChart } from '@/components/dashboard/ConvenioChart';

export function RepasseContent() {
  const { profile } = useUserProfile();
  const { minDate, maxDate, loading: periodLoading } = useRepassePeriod();
  const [period, setPeriod] = useState<PeriodType>('mtd');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [customMonth, setCustomMonth] = useState<string>();
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedConvenios, setSelectedConvenios] = useState<string[]>([]);
  const [selectedChartMetric, setSelectedChartMetric] = useState<ChartMetric>('repasse');

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case '7d': return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case 'mtd': return { start: startOfMonth(now), end: endOfDay(now) };
      case 'ytd': return { start: startOfYear(now), end: endOfDay(now) };
      case 'month':
        if (customMonth) {
          const monthDate = parse(customMonth, 'yyyy-MM', new Date());
          return { start: startOfMonth(monthDate), end: endOfDay(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)) };
        }
        return { start: startOfMonth(now), end: endOfDay(now) };
      case 'custom':
        return startDate && endDate ? { start: startDate, end: endDate } : undefined;
      default: return undefined;
    }
  }, [period, startDate, endDate, customMonth]);

  const effectiveMedicoNome = profile?.medico_nome;

  const filters = useMemo(() => ({
    startDate: dateRange?.start,
    endDate: dateRange?.end,
    exames: selectedExams.length > 0 ? selectedExams : undefined,
    convenios: selectedConvenios.length > 0 ? selectedConvenios : undefined,
    medicoNome: effectiveMedicoNome,
  }), [dateRange, selectedExams, selectedConvenios, effectiveMedicoNome]);

  const { loading, error, kpis, availableExames, availableConvenios, timeSeriesData, examDistribution, convenioDistribution } = useIntegratedDashboard(filters);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center">
          <h3 className="text-lg font-semibold text-destructive">Erro ao carregar dados</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Selecione o período e os filtros desejados</span>
            <DataPeriodInfo minDate={minDate} maxDate={maxDate} loading={periodLoading} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 flex-wrap">
            <PeriodFilter period={period} onPeriodChange={setPeriod} startDate={startDate} endDate={endDate} onDateRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }} customMonth={customMonth} onCustomMonthChange={setCustomMonth} dataMinDate={minDate} dataMaxDate={maxDate} />
            <ExamFilter selectedExams={selectedExams} onExamsChange={setSelectedExams} availableExams={availableExames} />
            <ConvenioFilter selectedConvenios={selectedConvenios} onConveniosChange={setSelectedConvenios} availableConvenios={availableConvenios} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { metric: 'exames' as ChartMetric, title: 'Exames', value: formatNumber(kpis.totalExames), trend: kpis.totalExamesVariation, icon: <Activity className="h-5 w-5 text-primary" />, tooltip: 'Total de exames realizados no período' },
          { metric: 'repasse' as ChartMetric, title: 'Repasse Total', value: formatCurrency(kpis.repasseTotal), trend: kpis.repasseTotalVariation, icon: <DollarSign className="h-5 w-5 text-primary" />, tooltip: 'Soma total dos repasses no período' },
          { metric: 'ticketMedio' as ChartMetric, title: 'Ticket Médio', value: formatCurrency(kpis.ticketMedio), icon: <TrendingUp className="h-5 w-5 text-primary" />, tooltip: 'Valor médio por exame' },
          { metric: 'percentualParticular' as ChartMetric, title: 'Particular', value: `${kpis.percentualParticular.toFixed(1)}%`, icon: <PieChart className="h-5 w-5 text-primary" />, tooltip: '% de exames particulares' },
        ].map(kpi => (
          <div key={kpi.metric} onClick={() => setSelectedChartMetric(kpi.metric)} className={`cursor-pointer transition-all ${selectedChartMetric === kpi.metric ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
            <KPICard title={kpi.title} value={kpi.value} subtitle={selectedChartMetric === kpi.metric ? '✓ Exibindo no gráfico' : 'Clique para exibir no gráfico'} trend={kpi.trend !== undefined ? { value: kpi.trend, isPositive: kpi.trend >= 0 } : undefined} icon={kpi.icon} tooltip={kpi.tooltip} />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Evolução Temporal</CardTitle></CardHeader>
        <CardContent><TimeSeriesChart data={timeSeriesData} selectedMetric={selectedChartMetric} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Distribuição por Tipo de Exame</CardTitle><CardDescription>Top 10 exames por volume ou valor</CardDescription></CardHeader>
        <CardContent><ProductChart data={examDistribution} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top 10 Convênios</CardTitle></CardHeader>
        <CardContent><ConvenioChart data={convenioDistribution} /></CardContent>
      </Card>
    </div>
  );
}
