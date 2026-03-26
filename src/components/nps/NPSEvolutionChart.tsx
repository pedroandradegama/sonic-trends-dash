import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NPSEvolutionData {
  month: string;
  nps: number;
  totalRespostas: number;
  notaMedia: number;
}

interface NPSEvolutionChartProps {
  data: NPSEvolutionData[];
}

export function NPSEvolutionChart({ data }: NPSEvolutionChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthLabel: format(parseISO(item.month + '-01'), 'MMM/yy', { locale: ptBR }),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="monthLabel" 
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          domain={[70, 100]}
          ticks={[70, 75, 80, 85, 90, 95, 100]}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          label={{ 
            value: 'NPS Score', 
            angle: -90, 
            position: 'insideLeft',
            style: { fill: 'hsl(var(--muted-foreground))' }
          }}
        />
        <ReferenceLine y={85} stroke="hsl(var(--primary))" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Média', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                  <p className="font-semibold text-foreground">{item.monthLabel}</p>
                  <p className="text-sm text-primary">NPS: {item.nps.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Nota Média: {item.notaMedia.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Respostas: {item.totalRespostas}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="nps" 
          name="NPS Score"
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
          activeDot={{ r: 8, fill: 'hsl(var(--primary))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
