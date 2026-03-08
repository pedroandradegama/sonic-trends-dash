import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ConvenioNPS } from '@/hooks/useNPSByConvenio';

interface NPSConvenioChartProps {
  data: ConvenioNPS[];
}

export function NPSConvenioChart({ data }: NPSConvenioChartProps) {
  const chartData = data.map((item) => ({
    convenio: item.convenio.length > 20 ? item.convenio.substring(0, 20) + '...' : item.convenio,
    nps: Number(item.nps.toFixed(1)),
    totalRespostas: item.totalRespostas,
  }));

  const getBarColor = (nps: number) => {
    if (nps >= 75) return 'hsl(152 60% 40%)'; // Excelente - verde (success)
    if (nps >= 50) return 'hsl(195 47% 34%)'; // Muito bom - azul petróleo (primary)
    if (nps >= 0) return 'hsl(38 92% 50%)'; // Regular - amarelo (warning)
    return 'hsl(0 72% 51%)'; // Crítico - vermelho (destructive)
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="convenio" 
          angle={-45} 
          textAnchor="end" 
          height={100}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={[-100, 100]}
          label={{ value: 'NPS Score', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                  <p className="font-semibold text-foreground">{data.convenio}</p>
                  <p className="text-sm text-muted-foreground">NPS: {data.nps}</p>
                  <p className="text-sm text-muted-foreground">Respostas: {data.totalRespostas}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar dataKey="nps" name="NPS Score">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.nps)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
