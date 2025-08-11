import { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ExamChart } from '@/components/dashboard/ExamChart';
import { ProductChart } from '@/components/dashboard/ProductChart';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function Index() {
  const { data, loading, error, monthlyData, productData, metrics } = useDashboardData();
  const { signOut, user } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState<'exames' | 'ticket' | 'repasse'>('exames');
  const [selectedConvenio, setSelectedConvenio] = useState<string>('todos');

  // Get unique convenios for filter
  const convenios = ['todos', ...Array.from(new Set(data?.map(item => item.Convênio).filter(Boolean) || []))];

  // Filter data based on selected convenio
  const filteredData = selectedConvenio === 'todos' 
    ? data 
    : data?.filter(item => item.Convênio === selectedConvenio) || [];

  // Calculate filtered metrics
  const filteredMetrics = {
    totalExames: filteredData?.reduce((sum, row) => sum + parseFloat(row['Qtde']?.replace(/[^\d.,]/g, '').replace(',', '.') || '0'), 0) || 0,
    totalRepasse: filteredData?.reduce((sum, row) => {
      const repasse = parseFloat(row['Vl. Repasse']?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
      return sum + repasse;
    }, 0) || 0,
    get ticketMedio() {
      return this.totalExames > 0 ? this.totalRepasse / this.totalExames : 0;
    },
    crescimento: metrics?.crescimento || 0
  };

  // Filter monthly data based on selected convenio
  const filteredMonthlyData = selectedConvenio === 'todos' 
    ? monthlyData 
    : monthlyData?.map(month => {
        // Filter data for this specific month and convenio
        const monthDate = new Date(month.month + ', 2024');
        const monthNumber = monthDate.getMonth();
        const yearNumber = monthDate.getFullYear();
        
        const filteredData = data?.filter(item => {
          if (item.Convênio !== selectedConvenio) return false;
          
          // Parse the date correctly (assuming format DD/MM/YYYY)
          const [day, monthStr, year] = item['Dt. Atendimento']?.split('/') || [];
          if (!day || !monthStr || !year) return false;
          
          const itemDate = new Date(parseInt(year), parseInt(monthStr) - 1, parseInt(day));
          return itemDate.getMonth() === monthNumber && itemDate.getFullYear() === yearNumber;
        }) || [];
        
        const quantidade = filteredData.reduce((sum, item) => {
          return sum + parseInt(item.Qtde || '0');
        }, 0);
        
        const repasse = filteredData.reduce((sum, item) => {
          const value = parseFloat(item['Vl. Repasse']?.replace(/[R$\s.]/g, '').replace(',', '.') || '0');
          return sum + value;
        }, 0);
        
        return {
          ...month,
          quantidade,
          repasse,
          ticket: quantidade > 0 ? repasse / quantidade : 0
        };
      });

  const getChartData = () => {
    if (!filteredMonthlyData) return [];
    
    return filteredMonthlyData.map(item => ({
      month: item.month,
      value: selectedMetric === 'exames' ? item.quantidade : 
             selectedMetric === 'ticket' ? item.ticket :
             item.repasse
    }));
  };

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
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue/5 to-medical-success/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard Médico
            </h1>
            <p className="text-muted-foreground text-lg">
              Bem-vindo, {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary" aria-pressed={true} aria-label="Exibir Dashboard de Repasse">
              <Link to="/">Repasse</Link>
            </Button>
            <Button asChild variant="outline" aria-pressed={false} aria-label="Exibir Dashboard de Casuística">
              <Link to="/casuistica">Casuística</Link>
            </Button>
            <Button onClick={signOut} variant="outline">
              Sair
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total de Exames"
            value={formatNumber(filteredMetrics.totalExames)}
            description="Exames realizados no período"
            icon="📊"
            onClick={() => setSelectedMetric('exames')}
            isSelected={selectedMetric === 'exames'}
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(filteredMetrics.ticketMedio)}
            description="Valor médio por exame"
            icon="💰"
            onClick={() => setSelectedMetric('ticket')}
            isSelected={selectedMetric === 'ticket'}
          />
          <MetricCard
            title="Repasse Total"
            value={formatCurrency(filteredMetrics.totalRepasse)}
            description="Total de repasses recebidos"
            icon="💳"
            onClick={() => setSelectedMetric('repasse')}
            isSelected={selectedMetric === 'repasse'}
            trend={filteredMetrics.crescimento}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>
                {selectedMetric === 'exames' ? 'Quantidade de exames' :
                 selectedMetric === 'ticket' ? 'Ticket médio' :
                 'Repasse total'} ao longo do tempo
              </CardDescription>
              <div className="flex gap-4 items-center">
                <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por convênio" />
                  </SelectTrigger>
                  <SelectContent>
                    {convenios.map(convenio => (
                      <SelectItem key={convenio} value={convenio}>
                        {convenio === 'todos' ? 'Todos os convênios' : convenio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ExamChart data={getChartData()} selectedMetric={selectedMetric} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Análise por Produto</CardTitle>
              <CardDescription>Distribuição de exames por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductChart data={productData || []} />
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Exames Recentes</CardTitle>
            <CardDescription>Últimos exames realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable data={data?.slice(0, 10) || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}