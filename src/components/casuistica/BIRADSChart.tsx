import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Cell } from 'recharts';

interface BIRADSChartProps {
  data: Array<{ categoria: string; percent: number }>;
  showHistoricalAverage?: boolean;
  showReferenceValue?: boolean;
  examType?: 'mamografia' | 'ultrassom' | 'ambos';
  referenceType?: 'literatura' | 'imag';
  imagReferences?: Record<string, number>;
}

export function BIRADSChart({ 
  data, 
  showHistoricalAverage = false, 
  showReferenceValue = false, 
  examType = 'ambos',
  referenceType = 'literatura',
  imagReferences
}: BIRADSChartProps) {
  // Valores de referência do BI-RADS para Mamografia (Literatura)
  const mamografiaRef: Record<string, number> = {
    'BI-RADS 0': 7.5,  // 5-10%
    'BI-RADS 1': 50,   // 40-60%
    'BI-RADS 2': 25,   // 20-30%
    'BI-RADS 3': 7.5,  // 5-10%
    'BI-RADS 4': 1.5,  // 1-2%
    'BI-RADS 5': 0.5,  // <0,5%
  };

  // Valores de referência do BI-RADS para Ultrassonografia de Mamas (Literatura)
  const ultrassomRef: Record<string, number> = {
    'BI-RADS 0': 0.5,  // <1%
    'BI-RADS 1': 32.5, // 30-35%
    'BI-RADS 2': 27.5, // 25-30%
    'BI-RADS 3': 22.5, // 20-25%
    'BI-RADS 4': 7.5,  // 5-10%
    'BI-RADS 5': 1.5,  // 1-2%
  };

  // Seleciona os valores de referência baseado no tipo
  const getReferenceValues = () => {
    if (referenceType === 'imag' && imagReferences) {
      return imagReferences;
    }
    return examType === 'mamografia' ? mamografiaRef : examType === 'ultrassom' ? ultrassomRef : mamografiaRef;
  };

  const referenceValues = getReferenceValues();
  const referenceLabel = referenceType === 'imag' ? 'IMAG (%)' : 'Literatura (%)';

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
              if (name === 'Seus dados (%)') return [`${(value as number).toFixed(1)}%`, 'Seus dados'];
              if (name === referenceLabel) return [`${(value as number).toFixed(1)}%`, referenceType === 'imag' ? 'Referência IMAG' : 'Valor de Referência'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar 
            dataKey="percent" 
            fill="hsl(var(--medical-teal))" 
            name="Seus dados (%)"
            radius={[4, 4, 0, 0]}
          />
          {showReferenceValue && (
            <Bar 
              dataKey="referencia" 
              fill={referenceType === 'imag' ? 'hsl(var(--primary))' : 'hsl(var(--warning))'}
              name={referenceLabel}
              radius={[4, 4, 0, 0]}
              opacity={0.6}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
