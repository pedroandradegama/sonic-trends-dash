import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface ExamChartProps {
  data: Array<{
    month: string;
    value: number;
  }>;
  selectedMetric?: 'exames' | 'ticket' | 'repasse';
}

export function ExamChart({ data, selectedMetric = 'exames' }: ExamChartProps) {
  // Format values based on metric type
  const formatValue = (value: number) => {
    if (selectedMetric === 'repasse' || selectedMetric === 'ticket') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    return new Intl.NumberFormat('pt-BR').format(value);
  };
  
  // Get Y-axis domain based on metric type
  const getYAxisDomain = () => {
    if (!data || data.length === 0) return [0, 100];
    
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    if (selectedMetric === 'repasse') {
      // For currency values, round to nearest thousand
      const roundedMax = Math.ceil(maxValue / 1000) * 1000;
      return [0, roundedMax];
    } else if (selectedMetric === 'ticket') {
      // For ticket values, round to nearest hundred
      const roundedMax = Math.ceil(maxValue / 100) * 100;
      return [0, roundedMax];
    } else {
      // For exam counts, round to nearest 10
      const roundedMax = Math.ceil(maxValue / 10) * 10;
      return [0, roundedMax];
    }
  };
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
            domain={getYAxisDomain()}
            tickFormatter={formatValue}
          />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)'
            }}
            formatter={(value) => [formatValue(Number(value)), 'Valor']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--medical-blue))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--medical-blue))', strokeWidth: 2, r: 4 }}
            name="Valor"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}