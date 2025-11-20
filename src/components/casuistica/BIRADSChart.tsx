import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Cell } from 'recharts';

interface BIRADSChartProps {
  data: Array<{ categoria: string; percent: number }>;
  showHistoricalAverage?: boolean;
  showReferenceValue?: boolean;
  examType?: 'mamografia' | 'ultrassom' | 'ambos';
}

export function BIRADSChart({ data, showHistoricalAverage = false, showReferenceValue = false, examType = 'ambos' }: BIRADSChartProps) {
  // Valores de referência do BI-RADS para Mamografia (baseados em literatura)
  const mamografiaRef: Record<string, number> = {
    'BI-RADS 0': 10, // 8-12% média para mamografia
    'BI-RADS 1': 35, // parte dos 75-85%
    'BI-RADS 2': 45, // parte dos 75-85%
    'BI-RADS 3': 5, // 3-7%
    'BI-RADS 4': 3, // 2-4%
    'BI-RADS 5': 2, // 1-3%
  };

  // Valores de referência do BI-RADS para Ultrassonografia de Mamas (baseados em literatura)
  const ultrassomRef: Record<string, number> = {
    'BI-RADS 0': 5, // 3-7% média para ultrassom
    'BI-RADS 1': 40, // parte dos 85-95%
    'BI-RADS 2': 50, // parte dos 85-95%
    'BI-RADS 3': 3, // 1-5%
    'BI-RADS 4': 1.5, // 0.5-2%
    'BI-RADS 5': 0.5, // 0.2-1%
  };

  const referenceValues = examType === 'mamografia' ? mamografiaRef : examType === 'ultrassom' ? ultrassomRef : mamografiaRef;

  // Combinar dados com valores de referência
  const chartData = data.map(item => ({
    ...item,
    referencia: showReferenceValue ? referenceValues[item.categoria] : undefined,
  }));
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="categoria" 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)'
            }}
            formatter={(value, name) => {
              if (name === 'Distribuição (%)') return [`${(value as number).toFixed(1)}%`, 'Distribuição'];
              if (name === 'Referência (%)') return [`${(value as number).toFixed(1)}%`, 'Valor de Referência'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar 
            dataKey="percent" 
            fill="hsl(var(--medical-teal))" 
            name="Distribuição (%)"
            radius={[4, 4, 0, 0]}
          />
          {showReferenceValue && (
            <Bar 
              dataKey="referencia" 
              fill="hsl(var(--warning))" 
              name="Referência (%)"
              radius={[4, 4, 0, 0]}
              opacity={0.6}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
