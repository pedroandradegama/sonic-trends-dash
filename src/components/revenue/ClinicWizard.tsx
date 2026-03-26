import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ShiftType, SHIFT_LABELS, AGENDA_SHIFTS, PLANTAO_SHIFTS,
  SHIFT_COLORS, SERVICE_PALETTE, DEFAULT_SHIFT_VALUES,
} from '@/types/revenue';
import { ChevronRight, ChevronLeft, Building2, Check } from 'lucide-react';

type Regime = 'pj' | 'clt';

interface WizardData {
  name: string;
  regime: Regime;
  enabledShifts: ShiftType[];
  shiftValues: Record<ShiftType, number>;
  shiftHours: Record<ShiftType, { start: string; end: string }>;
  deltaMonths: number;
  monthlyGross: number;
  monthlyNet: number;
}

const DEFAULT_HOURS: Record<ShiftType, { start: string; end: string }> = {
  manha: { start: '07:00', end: '12:00' },
  tarde: { start: '13:00', end: '18:00' },
  noite: { start: '19:00', end: '23:00' },
  p6:    { start: '07:00', end: '13:00' },
  p12:   { start: '07:00', end: '19:00' },
  p24:   { start: '07:00', end: '07:00' },
};

interface Props {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
  serviceCount: number;
}

export function ClinicWizard({ onComplete, onCancel, serviceCount }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    name: '',
    regime: 'pj',
    enabledShifts: [],
    shiftValues: { ...DEFAULT_SHIFT_VALUES },
    shiftHours: { ...DEFAULT_HOURS },
    deltaMonths: 1,
    monthlyGross: 0,
    monthlyNet: 0,
  });

  const allShifts: ShiftType[] = [...AGENDA_SHIFTS, ...PLANTAO_SHIFTS];

  const toggleShift = (st: ShiftType) => {
    setData(prev => ({
      ...prev,
      enabledShifts: prev.enabledShifts.includes(st)
        ? prev.enabledShifts.filter(s => s !== st)
        : [...prev.enabledShifts, st],
    }));
  };

  const steps = data.regime === 'pj'
    ? ['Nome e Regime', 'Turnos', 'Valores e Horários', 'Recebimento']
    : ['Nome e Regime', 'Turnos', 'Remuneração e Horários', 'Recebimento'];

  const canNext = () => {
    if (step === 0) return data.name.trim().length > 0;
    if (step === 1) return data.enabledShifts.length > 0;
    if (step === 2) {
      if (data.regime === 'clt') return data.monthlyGross > 0;
      return data.enabledShifts.every(s => data.shiftValues[s] > 0);
    }
    return true;
  };

  const handleFinish = () => {
    onComplete(data);
  };

  const color = SERVICE_PALETTE[serviceCount % SERVICE_PALETTE.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-border">
        {/* Progress */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div key={i} className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-muted'
              )} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {steps[step]}
          </p>
        </div>

        <div className="px-6 pb-6 min-h-[260px]">
          {/* Step 0: Name + Regime */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome da clínica</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={data.name}
                    onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                    placeholder="Ex: Hospital São Lucas"
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Regime</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['pj', 'clt'] as Regime[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setData(d => ({ ...d, regime: r }))}
                      className={cn(
                        'py-4 rounded-xl border-2 transition-all text-center',
                        data.regime === r
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <span className="text-lg font-semibold">{r.toUpperCase()}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r === 'pj' ? 'Pessoa Jurídica' : 'Consolidação das Leis'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Select shifts */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <p className="text-sm text-muted-foreground">Selecione os esquemas de trabalho</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-2">Agenda</p>
              <div className="grid grid-cols-3 gap-2">
                {AGENDA_SHIFTS.map(st => {
                  const active = data.enabledShifts.includes(st);
                  const colors = SHIFT_COLORS[st];
                  return (
                    <button
                      key={st}
                      onClick={() => toggleShift(st)}
                      className={cn(
                        'py-3 px-2 rounded-xl border-2 text-center transition-all relative',
                        active ? 'shadow-sm' : 'border-border hover:border-primary/20'
                      )}
                      style={active ? { borderColor: colors.border, background: colors.bg } : {}}
                    >
                      {active && <Check className="absolute top-1.5 right-1.5 h-3.5 w-3.5" style={{ color: colors.text }} />}
                      <span className="text-sm font-medium" style={active ? { color: colors.text } : {}}>
                        {SHIFT_LABELS[st]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Plantão</p>
              <div className="grid grid-cols-3 gap-2">
                {PLANTAO_SHIFTS.map(st => {
                  const active = data.enabledShifts.includes(st);
                  const colors = SHIFT_COLORS[st];
                  return (
                    <button
                      key={st}
                      onClick={() => toggleShift(st)}
                      className={cn(
                        'py-3 px-2 rounded-xl border-2 text-center transition-all relative',
                        active ? 'shadow-sm' : 'border-border hover:border-primary/20'
                      )}
                      style={active ? { borderColor: colors.border, background: colors.bg } : {}}
                    >
                      {active && <Check className="absolute top-1.5 right-1.5 h-3.5 w-3.5" style={{ color: colors.text }} />}
                      <span className="text-sm font-medium" style={active ? { color: colors.text } : {}}>
                        {SHIFT_LABELS[st]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Values/Hours (PJ) or Monthly (CLT) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              {data.regime === 'clt' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Bruto mensal (R$)</label>
                    <Input
                      type="number"
                      value={data.monthlyGross || ''}
                      onChange={e => setData(d => ({ ...d, monthlyGross: Number(e.target.value) || 0 }))}
                      placeholder="15000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Líquido mensal (R$)</label>
                    <Input
                      type="number"
                      value={data.monthlyNet || ''}
                      onChange={e => setData(d => ({ ...d, monthlyNet: Number(e.target.value) || 0 }))}
                      placeholder="12000"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {data.enabledShifts.map(st => {
                  const colors = SHIFT_COLORS[st];
                  return (
                    <div key={st} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center rounded-lg border border-border p-2.5"
                      style={{ borderLeftWidth: 3, borderLeftColor: colors.border }}>
                      <div>
                        <span className="text-xs font-medium">{SHIFT_LABELS[st]}</span>
                        {data.regime === 'pj' && (
                          <div className="mt-1">
                            <Input
                              type="number"
                              value={data.shiftValues[st] || ''}
                              onChange={e => setData(d => ({
                                ...d,
                                shiftValues: { ...d.shiftValues, [st]: Number(e.target.value) || 0 }
                              }))}
                              placeholder="R$"
                              className="h-7 text-xs"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Início</label>
                        <Input
                          type="time"
                          value={data.shiftHours[st]?.start ?? '08:00'}
                          onChange={e => setData(d => ({
                            ...d,
                            shiftHours: { ...d.shiftHours, [st]: { ...d.shiftHours[st], start: e.target.value } }
                          }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Término</label>
                        <Input
                          type="time"
                          value={data.shiftHours[st]?.end ?? '12:00'}
                          onChange={e => setData(d => ({
                            ...d,
                            shiftHours: { ...d.shiftHours, [st]: { ...d.shiftHours[st], end: e.target.value } }
                          }))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Delta */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <p className="text-sm text-muted-foreground">
                Em quanto tempo você recebe após a prestação do serviço?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 0, label: 'Imediato' },
                  { v: 1, label: 'Mês + 1' },
                  { v: 2, label: 'Mês + 2' },
                  { v: 3, label: 'Mês + 3' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setData(d => ({ ...d, deltaMonths: opt.v }))}
                    className={cn(
                      'py-4 rounded-xl border-2 text-center transition-all',
                      data.deltaMonths === opt.v
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
            {step === 0 ? 'Cancelar' : <><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</>}
          </Button>
          {step < steps.length - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleFinish}>
              <Check className="h-4 w-4 mr-1" /> Criar clínica
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
