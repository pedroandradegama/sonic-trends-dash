import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface ProductChartProps {
  data: Array<{
    produto: string;
    quantidade: number;
    repasse: number;
    percentual: number;
  }>;
}

export function ProductChart({ data }: ProductChartProps) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="produto" 
            className="text-muted-foreground"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)'
            }}
            formatter={(value, name) => {
              if (name === 'repasse') return [`R$ ${value}`, 'Repasse Médio'];
              if (name === 'quantidade') return [value, 'Quantidade'];
              if (name === 'percentual') return [`${value}%`, 'Percentual'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar 
            dataKey="quantidade" 
            fill="hsl(var(--medical-blue))" 
            name="Quantidade"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="repasse" 
            fill="hsl(var(--medical-success))" 
            name="Repasse Médio (R$)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}