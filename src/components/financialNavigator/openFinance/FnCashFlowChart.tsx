import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useFnOpenFinance } from '@/hooks/useFnOpenFinance';

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export function FnCashFlowChart() {
  const { summaries } = useFnOpenFinance();

  const data = [...summaries]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map(s => {
      const [y, m] = s.month.split('-').map(Number);
      return {
        label: `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}`,
        receita: Math.round(s.total_income),
        gastos: Math.round(s.total_spending),
      };
    });

  if (data.length === 0) return (
    <p className="text-sm text-muted-foreground text-center py-6">
      Dados insuficientes — aguarde a sincronização das transações.
    </p>
  );

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-4">Receita × Gastos</p>
      <div className="flex gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />Receita real
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />Gastos
        </span>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false} tickLine={false}
              width={52}
              tickFormatter={v => v === 0 ? '0' : `R$${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={(v: number) => [`R$ ${Math.round(v).toLocaleString('pt-BR')}`, '']}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="receita" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" fill="#F09595" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
