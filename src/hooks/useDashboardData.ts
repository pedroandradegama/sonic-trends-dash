import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  'Dt. Atendimento': string;
  'Produto': string;
  'Qtde': string;
  'Convênio': string;
  'Médico': string;
  'Vl. Repasse': string;
  'Porcentagem Repasse': string;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: dashboardData, error } = await supabase
        .from('Dashboard')
        .select('*')
        .order('Dt. Atendimento', { ascending: false });

      if (error) throw error;

      setData(dashboardData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Processa dados para gráficos evolutivos
  const getMonthlyData = () => {
    const monthlyStats = new Map();

    data.forEach(row => {
      if (!row['Dt. Atendimento']) return;

      try {
        const date = parseISO(row['Dt. Atendimento']);
        const monthKey = format(startOfMonth(date), 'yyyy-MM');
        const monthLabel = format(date, 'MMM/yy', { locale: ptBR });

        if (!monthlyStats.has(monthKey)) {
          monthlyStats.set(monthKey, {
            month: monthLabel,
            quantidade: 0,
            repasse: 0,
            count: 0
          });
        }

        const stats = monthlyStats.get(monthKey);
        const quantidade = parseInt(row['Qtde'] || '0');
        const repasse = parseFloat(row['Vl. Repasse']?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');

        stats.quantidade += quantidade;
        stats.repasse += repasse;
        stats.count += 1;
      } catch (e) {
        console.warn('Erro ao processar data:', row['Dt. Atendimento']);
      }
    });

    return Array.from(monthlyStats.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Últimos 6 meses
  };

  // Processa dados por produto
  const getProductData = () => {
    const productStats = new Map();

    data.forEach(row => {
      const produto = row['Produto'] || 'Não informado';
      
      if (!productStats.has(produto)) {
        productStats.set(produto, {
          produto,
          quantidade: 0,
          repasse: 0,
          count: 0
        });
      }

      const stats = productStats.get(produto);
      const quantidade = parseInt(row['Qtde'] || '0');
      const repasse = parseFloat(row['Vl. Repasse']?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');

      stats.quantidade += quantidade;
      stats.repasse += repasse;
      stats.count += 1;
    });

    const totalExames = Array.from(productStats.values()).reduce((sum, p) => sum + p.quantidade, 0);

    return Array.from(productStats.values())
      .map(product => ({
        ...product,
        repasse: product.count > 0 ? product.repasse / product.count : 0,
        percentual: totalExames > 0 ? (product.quantidade / totalExames) * 100 : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  };

  // Calcula métricas principais
  const getMetrics = () => {
    const totalExames = data.reduce((sum, row) => sum + parseInt(row['Qtde'] || '0'), 0);
    const totalRepasse = data.reduce((sum, row) => {
      const repasse = parseFloat(row['Vl. Repasse']?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
      return sum + repasse;
    }, 0);

    const ticketMedio = data.length > 0 ? totalRepasse / data.length : 0;
    const medicoCount = new Set(data.map(row => row['Médico'])).size;

    // Calcular crescimento do mês anterior
    const currentMonth = startOfMonth(new Date());
    const lastMonth = startOfMonth(subMonths(currentMonth, 1));

    const currentMonthData = data.filter(row => {
      if (!row['Dt. Atendimento']) return false;
      try {
        const date = parseISO(row['Dt. Atendimento']);
        return date >= currentMonth;
      } catch {
        return false;
      }
    });

    const lastMonthData = data.filter(row => {
      if (!row['Dt. Atendimento']) return false;
      try {
        const date = parseISO(row['Dt. Atendimento']);
        return date >= lastMonth && date < currentMonth;
      } catch {
        return false;
      }
    });

    const currentMonthExames = currentMonthData.reduce((sum, row) => sum + parseInt(row['Qtde'] || '0'), 0);
    const lastMonthExames = lastMonthData.reduce((sum, row) => sum + parseInt(row['Qtde'] || '0'), 0);

    const crescimento = lastMonthExames > 0 
      ? ((currentMonthExames - lastMonthExames) / lastMonthExames) * 100
      : 0;

    return {
      totalExames,
      totalRepasse,
      ticketMedio,
      medicoCount,
      crescimento
    };
  };

  return {
    data,
    loading,
    error,
    monthlyData: getMonthlyData(),
    productData: getProductData(),
    metrics: getMetrics(),
    refetch: fetchData
  };
}