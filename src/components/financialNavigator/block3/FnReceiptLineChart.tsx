import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { FnService, FnProjectionPrefs, MonthProjectionPoint } from '@/types/financialNavigator';

interface Props {
  receiptsByMonth: Record<string, number>;
  services: FnService[];
  projectionPoints: MonthProjectionPoint[];
  prefs: FnProjectionPrefs;
}

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg p-3 text-xs shadow-sm min-w-[140px]">
      <p className="font-medium mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.stroke }} />
            {p.name}
          </span>
          <span className="font-medium">R$ {Math.round(p.value).toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
};

export function FnReceiptLineChart({ receiptsByMonth, services, projectionPoints, prefs }: Props) {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Build per-service receipt timeline
  const allKeys = new Set<string>();
  const receiptsByService: Record<string, Record<string, number>> = {};

  services.forEach(svc => {
    receiptsByService[svc.id] = {};
    projectionPoints.forEach(pt => {
      const gross = pt.grossByService[svc.id] ?? 0;
      if (gross === 0) return;
      let rm = pt.month + svc.payment_delta;
      let ry = pt.year;
      while (rm > 11) { rm -= 12; ry++; }
      const key = `${ry}-${String(rm + 1).padStart(2, '0')}`;
      allKeys.add(key);
      const net = prefs.show_net ? Math.round(gross * (1 - prefs.tax_rate / 100)) : gross;
      receiptsByService[svc.id][key] = (receiptsByService[svc.id][key] ?? 0) + net;
    });
  });

  const sortedKeys = Array.from(allKeys).sort();
  if (sortedKeys.length === 0) return null;

  const data = sortedKeys.map(key => {
    const [y, m] = key.split('-').map(Number);
    const label = `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}`;
    const row: Record<string, any> = { label, key, total: receiptsByMonth[key] ?? 0 };
    services.forEach(svc => {
      row[svc.id] = receiptsByService[svc.id]?.[key] ?? 0;
    });
    return row;
  });

  const activeServices = services.filter(svc =>
    data.some(d => (d[svc.id] ?? 0) > 0)
  );

  const currentLabel = data.find(d => d.key === currentKey)?.label;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Fluxo de recebimento</p>
        <div className="flex flex-wrap gap-3">
          {activeServices.map(svc => (
            <span key={svc.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: svc.color }} />
              {svc.name}
            </span>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
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
            <Tooltip content={<CustomTooltip />} />

            {currentLabel && (
              <ReferenceLine
                x={currentLabel}
                stroke="rgba(0,0,0,0.15)"
                strokeDasharray="4 3"
                strokeWidth={1}
              />
            )}

            {activeServices.map(svc => (
              <Line
                key={svc.id}
                type="monotone"
                dataKey={svc.id}
                name={svc.name}
                stroke={svc.color}
                strokeWidth={2}
                dot={{ r: 3, fill: svc.color }}
                activeDot={{ r: 5 }}
              />
            ))}

            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="hsl(195 47% 34%)"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-1">
        Linha tracejada = total consolidado · Linha vertical = mês atual
      </p>
    </div>
  );
}