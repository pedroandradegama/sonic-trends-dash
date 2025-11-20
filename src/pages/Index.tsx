import { useState, useMemo } from 'react';
import { useIntegratedDashboard } from '@/hooks/useIntegratedDashboard';
import { useRepassePeriod } from '@/hooks/useDataPeriod';
import { useAuth } from '@/contexts/AuthContext';
import { KPICard } from '@/components/kpis/KPICard';
import { PeriodFilter, PeriodType } from '@/components/filters/PeriodFilter';
import { DataPeriodInfo } from '@/components/filters/DataPeriodInfo';
import { ExamFilter } from '@/components/filters/ExamFilter';
import { ConvenioFilter } from '@/components/filters/ConvenioFilter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Activity, DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { startOfDay, endOfDay, subDays, startOfMonth, startOfYear, parse } from 'date-fns';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { ProductChart } from '@/components/dashboard/ProductChart';
import { ConvenioChart } from '@/components/dashboard/ConvenioChart';
import imagLogo from '@/assets/imag-logo.png';

export default function Index() {
  const { signOut, user } = useAuth();
  const { minDate, maxDate, loading: periodLoading } = useRepassePeriod();
  const [period, setPeriod] = useState<PeriodType>('mtd');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [customMonth, setCustomMonth] = useState<string>();
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedConvenios, setSelectedConvenios] = useState<string[]>([]);

  // Calculate date range based on period
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

  const filters = useMemo(() => ({
    startDate: dateRange?.start,
    endDate: dateRange?.end,
    exames: selectedExams.length > 0 ? selectedExams : undefined,
    convenios: selectedConvenios.length > 0 ? selectedConvenios : undefined,
  }), [dateRange, selectedExams, selectedConvenios]);

  const { 
    loading, 
    error, 
    kpis, 
    availableExames, 
    availableConvenios,
    timeSeriesData,
    examDistribution,
    convenioDistribution
  } = useIntegratedDashboard(filters);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical-blue"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <img src={imagLogo} alt="IMAG - Medicina Diagnóstica" className="h-12" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  Dashboard IMAG
                </h1>
                <p className="text-muted-foreground">
                  Bem-vindo, {user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="default" size="sm">
                <Link to="/">Repasse</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/casuistica">Casuística</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/nps">NPS</Link>
              </Button>
              <Button onClick={signOut} variant="outline" size="sm">
                Sair
              </Button>
            </div>
          </header>

          {/* Filters */}
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
                <ExamFilter
                  selectedExams={selectedExams}
                  onExamsChange={setSelectedExams}
                  availableExams={availableExames}
                />
                <ConvenioFilter
                  selectedConvenios={selectedConvenios}
                  onConveniosChange={setSelectedConvenios}
                  availableConvenios={availableConvenios}
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imag-primary mx-auto"></div>
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            </div>
          ) : error ? (
            <Card className="border-imag-error">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-imag-error">Erro ao carregar dados</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Exames"
                  value={formatNumber(kpis.totalExames)}
                  subtitle="Total no período"
                  trend={{
                    value: kpis.totalExamesVariation,
                    isPositive: kpis.totalExamesVariation >= 0
                  }}
                  icon={<Activity className="h-5 w-5 text-imag-primary" />}
                  tooltip="Total de exames realizados no período selecionado"
                />
                <KPICard
                  title="Repasse Total"
                  value={formatCurrency(kpis.repasseTotal)}
                  trend={{
                    value: kpis.repasseTotalVariation,
                    isPositive: kpis.repasseTotalVariation >= 0
                  }}
                  icon={<DollarSign className="h-5 w-5 text-imag-primary" />}
                  tooltip="Soma total dos repasses recebidos no período"
                />
                <KPICard
                  title="Ticket Médio"
                  value={formatCurrency(kpis.ticketMedio)}
                  subtitle="Por exame"
                  icon={<TrendingUp className="h-5 w-5 text-imag-primary" />}
                  tooltip="Valor médio de repasse por exame (Repasse Total ÷ Total de Exames)"
                />
                <KPICard
                  title="Particular"
                  value={`${kpis.percentualParticular.toFixed(1)}%`}
                  subtitle={`${kpis.percentualParticularRepasse.toFixed(1)}% em R$`}
                  icon={<PieChart className="h-5 w-5 text-imag-primary" />}
                  tooltip="Percentual de exames particulares por volume e por valor de repasse"
                />
              </div>

              {/* Evolução Temporal */}
              <Card className="bg-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Evolução Temporal</CardTitle>
                  <CardDescription>Exames e Repasse ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <TimeSeriesChart data={timeSeriesData} />
                </CardContent>
              </Card>

              {/* Distribuição por Tipo de Exame */}
              <Card className="bg-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Distribuição por Tipo de Exame</CardTitle>
                  <CardDescription>Top 10 exames por volume ou valor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductChart data={examDistribution} />
                </CardContent>
              </Card>

              {/* Convênios */}
              <Card className="bg-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Top 10 Convênios</CardTitle>
                  <CardDescription>Principais convênios por volume ou valor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ConvenioChart data={convenioDistribution} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}