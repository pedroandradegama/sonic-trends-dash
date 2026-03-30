import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { MonthProjectionPoint, FnService, FnProjectionPrefs } from '@/types/financialNavigator';

interface Props {
  points: MonthProjectionPoint[];
  services: FnService[];
  prefs: FnProjectionPrefs;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((a: number, p: any) => a + (p.value ?? 0), 0);
  return (
    <div className="bg-background border border-border rounded-lg p-3 text-xs shadow-sm min-w-[160px]">
      <p className="font-medium mb-2">{label}</p>
      {payload
        .filter((p: any) => p.value > 0)
        .map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ background: p.fill }}
              />
              {p.name}
            </span>
            <span className="font-medium">R$ {Math.round(p.value).toLocaleString('pt-BR')}</span>
          </div>
        ))}
      {payload.filter((p: any) => p.value > 0).length > 1 && (
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">R$ {Math.round(total).toLocaleString('pt-BR')}</span>
        </div>
      )}
    </div>
  );
};

export function FnProjectionChart({ points, services, prefs }: Props) {
  const data = points.map(pt => {
    const row: Record<string, any> = {
      label: pt.label,
      isCurrent: pt.isCurrent,
      isPast: pt.isPast,
    };
    services.forEach(svc => {
      const gross = pt.grossByService[svc.id] ?? 0;
      row[svc.id] = prefs.show_net
        ? Math.round(gross * (1 - prefs.tax_rate / 100))
        : gross;
    });
    return row;
  });

  const activeServices = services.filter(svc =>
    points.some(pt => (pt.grossByService[svc.id] ?? 0) > 0)
  );

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {activeServices.map(svc => (
          <span key={svc.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: svc.color }}
            />
            {svc.name}
          </span>
        ))}
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,0,0,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={v => v === 0 ? '0' : `R$${Math.round(v / 1000)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

            <ReferenceLine
              x={points[2].label}
              stroke="rgba(0,0,0,0.15)"
              strokeDasharray="4 3"
              strokeWidth={1}
            />

            {activeServices.map((svc, svcIdx) => (
              <Bar
                key={svc.id}
                dataKey={svc.id}
                name={svc.name}
                stackId="a"
                fill={svc.color}
                radius={svcIdx === activeServices.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={svc.color}
                    opacity={entry.isPast ? 0.45 : 1}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-1">
        Linha tracejada = mês atual · Barras mais claras = meses passados
      </p>
    </div>
  );
}
