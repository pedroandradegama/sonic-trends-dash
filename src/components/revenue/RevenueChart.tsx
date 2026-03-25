import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  ShiftType, SHIFT_LABELS,
  AGENDA_SHIFTS, PLANTAO_SHIFTS, FilterType, ValType,
} from '@/types/revenue';
import { useRevenueData } from '@/hooks/useRevenueData';

type Props = ReturnType<typeof useRevenueData>;

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const ALL_SHIFTS: ShiftType[] = ['manha','tarde','noite','p6','p12','p24'];

const CHART_COLORS: Record<ShiftType, string> = {
  manha: '#85B7EB',
  tarde: '#FAC775',
  noite: '#AFA9EC',
  p6:   '#5DCAA5',
  p12:  '#1D9E75',
  p24:  '#F09595',
};

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
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: p.fill }} />
          {SHIFT_LABELS[p.dataKey as ShiftType]}: R$ {p.value.toLocaleString('pt-BR')}
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
  const { services, getMonthShifts, prefs, savePrefs } = props;
  const [filterSvc, setFilterSvc] = useState<string>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [valType, setValType] = useState<ValType>(prefs.show_net ? 'liquido' : 'bruto');
  const [taxRate, setTaxRate] = useState(prefs.tax_rate);

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

  const visibleShifts = useMemo(() =>
    ALL_SHIFTS.filter(s => {
      if (filterType === 'agenda') return AGENDA_SHIFTS.includes(s);
      if (filterType === 'plantao') return PLANTAO_SHIFTS.includes(s);
      return true;
    }), [filterType]);

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

  const chartData = useMemo(() =>
    months.map(({ y, m, label }) => {
      const monthShifts = getMonthShifts(y, m).filter(s => {
        if (filterSvc !== 'all' && s.service_id !== filterSvc) return false;
        if (filterType === 'agenda' && !AGENDA_SHIFTS.includes(s.shift_type)) return false;
        if (filterType === 'plantao' && !PLANTAO_SHIFTS.includes(s.shift_type)) return false;
        return true;
      });

      const row: Record<string, number | string> = { label };
      visibleShifts.forEach(st => { row[st] = 0; });

      monthShifts.forEach(s => {
        const svc = services.find(sv => sv.id === s.service_id);
        const val = applyTax(svc?.shiftValues?.[s.shift_type] ?? 0);
        row[s.shift_type] = ((row[s.shift_type] as number) ?? 0) + val;
      });
      return row;
    }), [months, getMonthShifts, services, filterSvc, filterType, visibleShifts, valType, taxRate]);

  const nowIdx = 2;
  const curTotal = (Object.values(chartData[nowIdx]).filter(v => typeof v === 'number') as number[]).reduce((a, v) => a + v, 0);
  const nextTotal = (Object.values(chartData[nowIdx + 1]).filter(v => typeof v === 'number') as number[]).reduce((a, v) => a + v, 0);
  const allTotals = chartData.map(row =>
    (Object.entries(row).filter(([k]) => k !== 'label').map(([,v]) => v as number)).reduce((a, v) => a + v, 0)
  );
  const avg = Math.round(allTotals.filter(v => v > 0).reduce((a, v) => a + v, 0) / (allTotals.filter(v => v > 0).length || 1));

  return (
    <div>
      {/* Service filter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[{ id: 'all', name: 'Todas as clínicas' }, ...services].map((s) => (
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

      {/* Type filter */}
      <div className="flex gap-1.5 mb-3">
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
      </div>

      {/* Bruto / Líquido toggle */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {(['bruto','liquido'] as ValType[]).map(vt => (
          <button
            key={vt}
            onClick={() => handleValTypeChange(vt)}
            className={cn(
              'px-3 py-1 text-xs rounded-lg border transition-colors',
              valType === vt
                ? 'bg-muted border-border font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:bg-muted/50'
            )}
          >
            Valor {vt}
          </button>
        ))}
        {valType === 'liquido' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Carga tributária</span>
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
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-muted rounded-lg px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            {MONTHS_SHORT[new Date().getMonth()]}
          </p>
          <p className="text-base font-medium">R$ {curTotal.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">próximo mês</p>
          <p className="text-base font-medium">R$ {nextTotal.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            {valType === 'liquido' ? `líquido (${taxRate}%)` : 'média bruta'}
          </p>
          <p className="text-base font-medium text-[hsl(var(--success))]">
            R$ {avg.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {visibleShifts.map(st => (
          <span key={st} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[st] }} />
            {SHIFT_LABELS[st]}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v === 0 ? '0' : `R$${Math.round(v / 1000)}k`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            {visibleShifts.map((st, i) => (
              <Bar
                key={st}
                dataKey={st}
                name={SHIFT_LABELS[st]}
                stackId="a"
                fill={CHART_COLORS[st]}
                radius={i === visibleShifts.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
