import { Activity, DollarSign, TrendingUp, Users, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ExamChart } from '@/components/dashboard/ExamChart';
import { ProductChart } from '@/components/dashboard/ProductChart';
import { DataTable } from '@/components/dashboard/DataTable';
import { useDashboardData } from '@/hooks/useDashboardData';

const Index = () => {
  const { data, loading, error, monthlyData, productData, metrics } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-destructive mb-4">Erro ao carregar dados</div>
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
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8 text-medical-blue" />
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard Médico - Imag
            </h1>
          </div>
          <p className="text-muted-foreground">
            Acompanhe os dados evolutivos dos exames ultrassonográficos
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Exames"
            value={formatNumber(metrics.totalExames)}
            change={`${metrics.crescimento > 0 ? '+' : ''}${metrics.crescimento.toFixed(1)}%`}
            changeType={metrics.crescimento > 0 ? 'positive' : metrics.crescimento < 0 ? 'negative' : 'neutral'}
            description="vs mês anterior"
            icon={Activity}
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(metrics.ticketMedio)}
            icon={DollarSign}
          />
          <MetricCard
            title="Repasse Total"
            value={formatCurrency(metrics.totalRepasse)}
            icon={TrendingUp}
          />
          <MetricCard
            title="Médicos Ativos"
            value={formatNumber(metrics.medicoCount)}
            icon={Users}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border bg-gradient-to-br from-card to-muted/20 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExamChart data={monthlyData} />
            </CardContent>
          </Card>

          <Card className="border-border bg-gradient-to-br from-card to-muted/20 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Análise por Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductChart data={productData} />
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable data={data.slice(0, 20)} />
      </div>
    </div>
  );
};

export default Index;
