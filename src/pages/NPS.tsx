import { useState, useMemo } from 'react';
import { useNPSByMedico } from '@/hooks/useNPSByMedico';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { PeriodFilter, PeriodType } from '@/components/filters/PeriodFilter';
import { NPSMedicoCard } from '@/components/nps/NPSMedicoCard';
import { NPSChart } from '@/components/nps/NPSChart';
import { startOfDay, endOfDay, subDays, startOfMonth, startOfYear, parse } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function NPS() {
  const { signOut, user } = useAuth();
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
            <Link to="/">Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/casuistica">Casuística</Link>
          </Button>
          <Button variant="destructive" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o período para análise</CardDescription>
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

      {/* Chart */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de NPS</CardTitle>
            <CardDescription>
              Visualização comparativa do NPS de cada médico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NPSChart data={data} />
          </CardContent>
        </Card>
      )}

      {/* Cards Grid */}
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
    </div>
  );
}
