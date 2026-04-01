import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import { KpiSnapshot } from '@/types/financialNavigator';

interface Props { snapshots: KpiSnapshot[] }

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function formatMonth(dateStr: string): string {
  const [, m] = dateStr.split('-').map(Number);
  return MONTHS_SHORT[m - 1];
}

function SparkCard({
  label, data, dataKey, color, formatter,
}: {
  label: string; data: any[]; dataKey: string; color: string;
  formatter: (v: number) => string;
}) {
  const last = data[data.length - 1]?.[dataKey] ?? 0;
  const prev = data[data.length - 2]?.[dataKey] ?? 0;
  const delta = last - prev;
  const pct = prev > 0 ? Math.round((delta / prev) * 100) : 0;

  return (
    <div className="bg-muted rounded-xl p-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 font-body">
        {label}
      </p>
      <p className="text-base font-medium text-foreground font-display">{formatter(last)}</p>
      {prev > 0 && (
        <p className={`text-[10px] mb-2 font-body ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {delta >= 0 ? '+' : ''}{pct}% vs. mês anterior
        </p>
      )}
      <div style={{ height: 48 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="month" hide />
            <Tooltip
              formatter={(v: number) => [formatter(v), label]}
              labelFormatter={(l) => l}
              contentStyle={{
                fontSize: 11, borderRadius: 8,
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function FnKpiSparklines({ snapshots }: Props) {
  const data = snapshots.map(s => ({
    month: formatMonth(s.snapshot_month),
    gross: s.total_gross, net: s.total_net,
    rate: s.effective_rate, hours: s.total_hours,
  }));

  const fmtBRL = (v: number) => `R$${Math.round(v / 1000)}k`;
  const fmtRate = (v: number) => `R$${Math.round(v)}/h`;
  const fmtH = (v: number) => `${Math.round(v)}h`;

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3 font-body">Evolução histórica</p>
      <div className="grid grid-cols-2 gap-2">
        <SparkCard label="Bruto mensal"   data={data} dataKey="gross" color="#378ADD" formatter={fmtBRL} />
        <SparkCard label="Líquido mensal" data={data} dataKey="net"   color="#1D9E75" formatter={fmtBRL} />
        <SparkCard label="R$/h efetivo"   data={data} dataKey="rate"  color="#7F77DD" formatter={fmtRate} />
        <SparkCard label="Horas/mês"      data={data} dataKey="hours" color="#BA7517" formatter={fmtH} />
      </div>
    </div>
  );
}
