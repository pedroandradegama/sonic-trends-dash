import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { MedicoNPS } from '@/hooks/useNPSByMedico';

interface NPSChartProps {
  data: MedicoNPS[];
}

export function NPSChart({ data }: NPSChartProps) {
  const chartData = data.map((item) => ({
    medico: item.medico.length > 20 ? item.medico.substring(0, 20) + '...' : item.medico,
    NPS: item.nps,
    fullName: item.medico,
  }));

  const getBarColor = (nps: number) => {
    if (nps >= 75) return 'hsl(142, 76%, 36%)';
    if (nps >= 50) return 'hsl(142, 71%, 45%)';
    if (nps >= 0) return 'hsl(45, 93%, 47%)';
    if (nps >= -50) return 'hsl(27, 96%, 61%)';
    return 'hsl(0, 84%, 60%)';
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="medico" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            domain={[-100, 100]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card p-3 border rounded-lg shadow-lg">
                    <p className="font-semibold text-foreground mb-1">{data.fullName}</p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">NPS: </span>
                      <span className="font-bold text-foreground">{data.NPS}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar dataKey="NPS" name="NPS Score" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.NPS)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
