import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ReferenceLine } from 'recharts';

interface BIRADSChartProps {
  data: Array<{ categoria: string; percent: number }>;
  showHistoricalAverage?: boolean;
  showReferenceValue?: boolean;
}

export function BIRADSChart({ data, showHistoricalAverage = false, showReferenceValue = false }: BIRADSChartProps) {
  // Valores de referência do BI-RADS (baseados em literatura)
  const referenceValues: Record<string, number> = {
    'BI-RADS 0': 8.5, // 5-12% média
    'BI-RADS 1': 40, // parte dos 80-90%
    'BI-RADS 2': 45, // parte dos 80-90%
    'BI-RADS 3': 1, // 0.5-2%
    'BI-RADS 4': 0.5, // 0.3-1%
    'BI-RADS 5': 0.2, // 0.3-1%
  };
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
            formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Percentual']}
          />
          <Legend />
          <Bar 
            dataKey="percent" 
            fill="hsl(var(--medical-teal))" 
            name="Distribuição (%)"
            radius={[4, 4, 0, 0]}
          />
          {showHistoricalAverage && data.map((item, index) => {
            const avg = item.percent; // Aqui seria a média histórica calculada
            return (
              <ReferenceLine
                key={`avg-${index}`}
                y={avg}
                stroke="hsl(var(--medical-blue))"
                strokeDasharray="3 3"
                label={{ value: `Média: ${avg.toFixed(1)}%`, position: 'insideTopRight', fill: 'hsl(var(--medical-blue))' }}
              />
            );
          })}
          {showReferenceValue && (
            <>
              {Object.entries(referenceValues).map(([cat, val]) => (
                <ReferenceLine
                  key={`ref-${cat}`}
                  y={val}
                  stroke="hsl(var(--warning))"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                />
              ))}
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
