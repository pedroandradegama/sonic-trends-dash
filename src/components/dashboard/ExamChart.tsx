import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface ExamChartProps {
  data: Array<{
    month: string;
    quantidade: number;
    repasse: number;
  }>;
}

export function ExamChart({ data }: ExamChartProps) {
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
          />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="quantidade" 
            stroke="hsl(var(--medical-blue))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--medical-blue))', strokeWidth: 2, r: 4 }}
            name="Quantidade de Exames"
          />
          <Line 
            type="monotone" 
            dataKey="repasse" 
            stroke="hsl(var(--medical-success))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--medical-success))', strokeWidth: 2, r: 4 }}
            name="Valor Repasse (R$)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}