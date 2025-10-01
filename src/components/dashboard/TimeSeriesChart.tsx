import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface TimeSeriesChartProps {
  data: Array<{
    month: string;
    exames: number;
    repasse: number;
    ticketMedio: number;
  }>;
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
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

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={formatNumber}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrency}
          />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)'
            }}
            formatter={(value, name) => {
              if (name === 'Exames') return [formatNumber(Number(value)), name];
              if (name === 'Repasse') return [formatCurrency(Number(value)), name];
              return [value, name];
            }}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="exames" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            name="Exames"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="repasse" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
            name="Repasse"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
