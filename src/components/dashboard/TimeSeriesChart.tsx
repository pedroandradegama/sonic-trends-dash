import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Area, ComposedChart } from 'recharts';

export type ChartMetric = 'repasse' | 'exames' | 'ticketMedio' | 'percentualParticular';

interface TimeSeriesChartProps {
  data: Array<{
    month: string;
    exames: number;
    repasse: number;
    ticketMedio: number;
    percentualParticular?: number;
  }>;
  selectedMetric?: ChartMetric;
}

export function TimeSeriesChart({ data, selectedMetric = 'repasse' }: TimeSeriesChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getMetricConfig = (metric: ChartMetric) => {
    switch (metric) {
      case 'exames':
        return { name: 'Exames', formatter: formatNumber, color: 'hsl(var(--primary))' };
      case 'repasse':
        return { name: 'Repasse', formatter: formatCurrency, color: 'hsl(var(--primary))' };
      case 'ticketMedio':
        return { name: 'Ticket Médio', formatter: formatCurrency, color: 'hsl(var(--primary))' };
      case 'percentualParticular':
        return { name: '% Particular', formatter: formatPercent, color: 'hsl(var(--primary))' };
      default:
        return { name: 'Repasse', formatter: formatCurrency, color: 'hsl(var(--primary))' };
    }
  };

  const metricConfig = getMetricConfig(selectedMetric);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold text-foreground">{label}</p>
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Exames:</span> {formatNumber(data.exames)}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Repasse:</span> {formatCurrency(data.repasse)}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Ticket Médio:</span> {formatCurrency(data.ticketMedio)}
            </p>
            {data.percentualParticular !== undefined && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">% Particular:</span> {formatPercent(data.percentualParticular)}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={metricConfig.formatter}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend formatter={() => metricConfig.name} />
          <Area
            type="monotone"
            dataKey={selectedMetric}
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorMetric)"
            name={metricConfig.name}
          />
          <Line 
            type="monotone" 
            dataKey={selectedMetric}
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'white' }}
            name={metricConfig.name}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
