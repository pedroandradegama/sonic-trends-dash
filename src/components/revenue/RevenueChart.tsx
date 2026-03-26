import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  ShiftType, SHIFT_LABELS,
  AGENDA_SHIFTS, PLANTAO_SHIFTS, FilterType, ValType,
} from '@/types/revenue';
import { useRevenueData } from '@/hooks/useRevenueData';
import { BarChart3, TrendingUp } from 'lucide-react';

type Props = ReturnType<typeof useRevenueData>;
type ChartMode = 'bar' | 'line';

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function fmt(v: number) {
  if (v === 0) return 'R$ 0';
  if (v >= 1000) return `R$ ${(Math.round(v / 100) / 10).toFixed(1)}k`;
  return `R$ ${v}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((a: number, p: any) => a + (p.value ?? 0), 0);
  return (
    <div className="bg-background border border-border rounded-lg p-3 text-xs shadow-sm">
      <p className="font-medium mb-1.5">{label}</p>
      {payload.map((p: any) => p.value > 0 && (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: p.fill || p.stroke }} />
          {p.name}: R$ {p.value.toLocaleString('pt-BR')}
        </p>
      ))}
      {payload.length > 1 && (
        <p className="font-medium mt-1.5 pt-1.5 border-t border-border">
          Total: R$ {total.toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
};

export function RevenueChart(props: Props) {
  const { services, shifts, prefs, savePrefs } = props;
  const [filterSvc, setFilterSvc] = useState<string>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [valType, setValType] = useState<ValType>(prefs.show_net ? 'liquido' : 'bruto');
  const [taxRate, setTaxRate] = useState(prefs.tax_rate);
  const [chartMode, setChartMode] = useState<ChartMode>('bar');

  const applyTax = (v: number) =>
    valType === 'liquido' ? Math.round(v * (1 - taxRate / 100)) : v;

  const handleTaxChange = (v: number) => {
    setTaxRate(v);
    savePrefs.mutate({ tax_rate: v, show_net: valType === 'liquido' });
  };

  const handleValTypeChange = (vt: ValType) => {
    setValType(vt);
    savePrefs.mutate({ tax_rate: taxRate, show_net: vt === 'liquido' });
  };

  // Build months range: -2 to +5 from now
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const offset = i - 2;
      let m = now.getMonth() + offset;
      let y = now.getFullYear();
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }
      return { y, m, label: `${MONTHS_SHORT[m]}/${String(y).slice(2)}` };
    });
  }, []);

  // Chart data: project revenue into the month when it's RECEIVED (shift_date + delta_months)
  const chartData = useMemo(() => {
    // Filter shifts
    const filteredShifts = shifts.filter(s => {
      if (filterSvc !== 'all' && s.service_id !== filterSvc) return false;
      if (filterType === 'agenda' && !AGENDA_SHIFTS.includes(s.shift_type)) return false;
      if (filterType === 'plantao' && !PLANTAO_SHIFTS.includes(s.shift_type)) return false;
      return true;
    });

    // Build a map: monthKey -> { svcId -> revenue }
    const revenueByMonth: Record<string, Record<string, number>> = {};
    months.forEach(({ y, m }) => {
      revenueByMonth[`${y}-${m}`] = {};
    });

    filteredShifts.forEach(s => {
      const svc = services.find(sv => sv.id === s.service_id);
      if (!svc) return;
      const val = applyTax(svc.shiftValues?.[s.shift_type] ?? 0);
      if (val === 0) return;

      // Calculate receipt month based on delta
      const shiftDate = new Date(s.shift_date);
      let receiptMonth = shiftDate.getMonth() + (svc.delta_months ?? 0);
      let receiptYear = shiftDate.getFullYear();
      while (receiptMonth > 11) { receiptMonth -= 12; receiptYear++; }
      while (receiptMonth < 0) { receiptMonth += 12; receiptYear--; }

      const key = `${receiptYear}-${receiptMonth}`;
      if (revenueByMonth[key]) {
        revenueByMonth[key][svc.id] = (revenueByMonth[key][svc.id] ?? 0) + val;
      }
    });

    return months.map(({ y, m, label }) => {
      const key = `${y}-${m}`;
      const svcRevenue = revenueByMonth[key] ?? {};
      const row: Record<string, number | string> = { label };
      let total = 0;
      services.forEach(svc => {
        const v = svcRevenue[svc.id] ?? 0;
        row[svc.id] = v;
        total += v;
      });
      row._total = total;
      return row;
    });
  }, [months, shifts, services, filterSvc, filterType, valType, taxRate]);

  // Active services in chart data
  const activeServices = useMemo(() =>
    services.filter(svc => chartData.some(r => (r[svc.id] as number) > 0)),
    [services, chartData]
  );

  return (
    <div>
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-3 mb-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'all', name: 'Todas as clínicas', color: '' }, ...services].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterSvc(s.id)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                filterSvc === s.id
                  ? 'bg-muted border-border font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted/50'
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['all','agenda','plantao'] as FilterType[]).map(ft => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                filterType === ft
                  ? 'bg-muted border-border font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted/50'
              )}
            >
              {ft === 'all' ? 'Todos' : ft === 'agenda' ? 'Agenda' : 'Plantão'}
            </button>
          ))}

          <div className="h-4 w-px bg-border mx-1" />

          {(['bruto','liquido'] as ValType[]).map(vt => (
            <button
              key={vt}
              onClick={() => handleValTypeChange(vt)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                valType === vt
                  ? 'bg-muted border-border font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted/50'
              )}
            >
              {vt === 'bruto' ? 'Bruto' : 'Líquido'}
            </button>
          ))}

          {valType === 'liquido' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Carga</span>
              <input
                type="number"
                min={0} max={99} step={1}
                value={taxRate}
                onChange={e => handleTaxChange(Number(e.target.value))}
                className="w-14 text-xs text-right px-2 py-1 border border-border rounded-lg bg-background"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setChartMode('bar')}
              className={cn('p-1.5 rounded-lg transition-colors',
                chartMode === 'bar' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50')}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartMode('line')}
              className={cn('p-1.5 rounded-lg transition-colors',
                chartMode === 'line' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50')}
            >
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      {chartMode === 'bar' && activeServices.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {activeServices.map(svc => (
            <span key={svc.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: svc.color }} />
              {svc.name}
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="w-full" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '0' : `R$${Math.round(v / 1000)}k`} width={48} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              {activeServices.map((svc, i) => (
                <Bar key={svc.id} dataKey={svc.id} name={svc.name} stackId="a"
                  fill={svc.color}
                  radius={i === activeServices.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '0' : `R$${Math.round(v / 1000)}k`} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="_total" name="Total"
                stroke="hsl(195, 47%, 34%)" strokeWidth={2.5}
                dot={{ fill: 'hsl(195, 47%, 34%)', r: 4 }}
                activeDot={{ r: 6 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
