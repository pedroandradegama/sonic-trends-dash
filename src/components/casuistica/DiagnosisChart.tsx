import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ReferenceLine } from 'recharts';

interface DiagnosisChartProps {
  data: Array<{ diagnostico: string; count: number }>;
  showHistoricalAverage?: boolean;
}

export function DiagnosisChart({ data, showHistoricalAverage = false }: DiagnosisChartProps) {
  const chartData = data.map(d => ({ diagnostico: d.diagnostico, count: d.count }));
  
  // Calcular média histórica
  const average = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.count, 0) / chartData.length 
    : 0;

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="diagnostico" 
            className="text-muted-foreground"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={90}
          />
          <YAxis 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
            allowDecimals={false}
          />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)'
            }}
            formatter={(value) => [value as number, 'Quantidade']}
          />
          <Legend />
          <Bar 
            dataKey="count" 
            fill="hsl(var(--medical-teal))" 
            name="Diagnósticos"
            radius={[4, 4, 0, 0]}
          />
          {showHistoricalAverage && average > 0 && (
            <ReferenceLine
              y={average}
              stroke="hsl(var(--medical-blue))"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{ 
                value: `Média: ${average.toFixed(0)}`, 
                position: 'insideTopRight', 
                fill: 'hsl(var(--medical-blue))',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
