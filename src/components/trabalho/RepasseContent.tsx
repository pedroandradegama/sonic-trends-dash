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
import { Activity, DollarSign, TrendingUp, PieChart, TrendingDown, Minus, Info } from 'lucide-react';
import { startOfDay, endOfDay, subDays, startOfMonth, startOfYear, parse } from 'date-fns';
import { TimeSeriesChart, ChartMetric } from '@/components/dashboard/TimeSeriesChart';
import { ProductChart } from '@/components/dashboard/ProductChart';
import { ConvenioChart } from '@/components/dashboard/ConvenioChart';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
      case 'all': return undefined;
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

  const formatTrend = (trendValue: number) => {
    if (trendValue === 0) return "0%";
    const sign = trendValue > 0 ? "+" : "";
    return `${sign}${trendValue.toFixed(1)}%`;
  };

  const kpiItems = [
    { metric: 'repasse' as ChartMetric, title: 'Repasse Total', value: formatCurrency(kpis.repasseTotal), trend: kpis.repasseTotalVariation, icon: <DollarSign className="h-5 w-5" />, tooltip: 'Soma total dos repasses no período', featured: true },
    { metric: 'exames' as ChartMetric, title: 'Exames', value: formatNumber(kpis.totalExames), trend: kpis.totalExamesVariation, icon: <Activity className="h-5 w-5 text-primary" />, tooltip: 'Total de exames realizados no período', featured: false },
    { metric: 'ticketMedio' as ChartMetric, title: 'Ticket Médio', value: formatCurrency(kpis.ticketMedio), icon: <TrendingUp className="h-5 w-5 text-primary" />, tooltip: 'Valor médio por exame', featured: false },
    { metric: 'percentualParticular' as ChartMetric, title: 'Particular', value: `${kpis.percentualParticular.toFixed(1)}%`, icon: <PieChart className="h-5 w-5 text-primary" />, tooltip: '% de exames particulares', featured: false },
  ];

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
        {kpiItems.map(kpi => {
          if (kpi.featured) {
            // Featured "Repasse Total" card with petrol blue styling (like MemberGetMember)
            const isSelected = selectedChartMetric === kpi.metric;
            return (
              <div
                key={kpi.metric}
                onClick={() => setSelectedChartMetric(kpi.metric)}
                className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[hsl(190,60%,70%)] ring-offset-2' : ''}`}
              >
                <Card className="relative overflow-hidden border-0 bg-[hsl(195,50%,16%)] text-white hover:shadow-lg">
                  {/* Decorative gradient orbs */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[radial-gradient(circle,hsl(193,44%,42%,0.3)_0%,transparent_70%)] pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-[radial-gradient(circle,hsl(195,47%,34%,0.25)_0%,transparent_70%)] pointer-events-none" />
                  <div className="absolute top-1/2 right-0 w-56 h-56 -translate-y-1/2 translate-x-1/3 rounded-full bg-[radial-gradient(circle,hsl(190,45%,50%,0.12)_0%,transparent_60%)] pointer-events-none" />
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full border border-white/[0.08] pointer-events-none" />

                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-white/15 rounded-lg">
                        <DollarSign className="h-5 w-5 text-[hsl(190,60%,70%)]" />
                      </div>
                      <div className="flex items-center gap-2">
                        {kpi.trend !== undefined && (
                          <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trend >= 0 ? 'text-[hsl(152,60%,65%)]' : 'text-[hsl(0,72%,70%)]'}`}>
                            {kpi.trend === 0 ? <Minus className="h-4 w-4" /> : kpi.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {formatTrend(kpi.trend)}
                          </div>
                        )}
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-white/50 hover:text-white/80 transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-sm">{kpi.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-white/60 text-sm mb-1">{kpi.title}</h3>
                      <p className="text-2xl font-bold text-white mb-1">{kpi.value}</p>
                      <p className="text-sm text-white/50">
                        {isSelected ? '✓ Exibindo no gráfico' : 'Clique para exibir no gráfico'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          }

          // Regular KPI cards
          return (
            <div key={kpi.metric} onClick={() => setSelectedChartMetric(kpi.metric)} className={`cursor-pointer transition-all ${selectedChartMetric === kpi.metric ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
              <KPICard title={kpi.title} value={kpi.value} subtitle={selectedChartMetric === kpi.metric ? '✓ Exibindo no gráfico' : 'Clique para exibir no gráfico'} trend={kpi.trend !== undefined ? { value: kpi.trend, isPositive: kpi.trend >= 0 } : undefined} icon={kpi.icon} tooltip={kpi.tooltip} />
            </div>
          );
        })}
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
