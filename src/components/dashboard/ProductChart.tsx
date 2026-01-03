import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ProductChartProps {
  data: Array<{
    exame: string;
    quantidade: number;
    valor: number;
  }>;
}

export function ProductChart({ data }: ProductChartProps) {
  const [viewMode, setViewMode] = useState<'quantidade' | 'valor'>('quantidade');

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

  const chartData = data.slice(0, 10).map(d => ({
    exame: d.exame,
    value: viewMode === 'quantidade' ? d.quantidade : d.valor
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
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number"
              className="text-muted-foreground"
              tick={{ fontSize: 12 }}
              tickFormatter={viewMode === 'valor' ? formatCurrency : formatNumber}
            />
            <YAxis 
              type="category"
              dataKey="exame" 
              className="text-muted-foreground"
              tick={{ fontSize: 10 }}
              width={180}
              tickFormatter={(value) => value.length > 30 ? value.substring(0, 30) + '...' : value}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-card)'
              }}
              formatter={(value) => [
                viewMode === 'valor' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                viewMode === 'valor' ? 'Valor' : 'Quantidade'
              ]}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              fill="hsl(var(--primary))" 
              name={viewMode === 'valor' ? 'Valor' : 'Quantidade'}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}