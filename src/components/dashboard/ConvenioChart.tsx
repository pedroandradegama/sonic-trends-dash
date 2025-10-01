import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ConvenioChartProps {
  data: Array<{
    convenio: string;
    quantidade: number;
    valor: number;
  }>;
}

export function ConvenioChart({ data }: ConvenioChartProps) {
  const [viewMode, setViewMode] = useState<'quantidade' | 'valor'>('valor');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Top 10 convenios
  const top10 = data.slice(0, 10);

  const chartData = top10.map(d => ({
    convenio: d.convenio.length > 25 ? d.convenio.substring(0, 25) + '...' : d.convenio,
    quantidade: d.quantidade,
    valor: d.valor
  }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'quantidade' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('quantidade')}
        >
          Volume
        </Button>
        <Button
          variant={viewMode === 'valor' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('valor')}
        >
          Valor (R$)
        </Button>
      </div>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="convenio" 
              className="text-muted-foreground"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              className="text-muted-foreground"
              tick={{ fontSize: 12 }}
              tickFormatter={viewMode === 'valor' ? formatCurrency : formatNumber}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-card)'
              }}
              formatter={(value, name) => {
                if (name === 'Quantidade') return [formatNumber(Number(value)), name];
                if (name === 'Valor') return [formatCurrency(Number(value)), name];
                return [value, name];
              }}
            />
            <Legend />
            {viewMode === 'quantidade' ? (
              <Bar 
                dataKey="quantidade" 
                fill="hsl(var(--primary))" 
                name="Quantidade"
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <Bar 
                dataKey="valor" 
                fill="hsl(var(--chart-2))" 
                name="Valor"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
