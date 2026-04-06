import React, { useEffect, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePresetClinics } from '@/hooks/usePresetClinics';
import { FiscalConfigSection } from './FiscalConfigSection';
import { ShiftValuesSection } from './ShiftValuesSection';
import { ExpensesSection } from './ExpensesSection';
import { RecurrenceRulesSection } from './RecurrenceRulesSection';
import { useFnConfig } from '@/hooks/useFnConfig';
import {
  FnService, FnServiceExpense, FnShiftType,
  WorkRegime, WorkMethod, FiscalMode,
  REGIME_LABELS, METHOD_LABELS, FN_DEFAULT_SHIFT_VALUES, FN_SERVICE_PALETTE,
} from '@/types/financialNavigator';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: FnService | null;
}

const ALL_REGIMES: WorkRegime[] = ['pj_turno','pj_producao','clt','residencia','fellowship','pro_labore','distribuicao_lucros'];
const ALL_METHODS: WorkMethod[] = ['us_geral','us_vascular','mamografia','tc','rm','puncao','misto'];

export function ServiceFormSheet({ open, onOpenChange, service }: Props) {
  const { upsertService, services } = useFnConfig();
  const { data: presets = [] } = usePresetClinics();
  const isNew = !service;

  const [form, setForm] = useState<Partial<FnService>>({});
  const [nameQuery, setNameQuery] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const nameWrapRef = React.useRef<HTMLDivElement>(null);
  const [shiftValues, setShiftValues] = useState<Record<FnShiftType, number>>(
    { ...FN_DEFAULT_SHIFT_VALUES }
  );
  const [expenses, setExpenses] = useState<
    Omit<FnServiceExpense, 'id' | 'service_id' | 'user_id'>[]
  >([]);
  const [saving, setSaving] = useState(false);

  const filteredPresets = nameQuery.length >= 1
    ? presets.filter(c =>
        c.name.toLowerCase().includes(nameQuery.toLowerCase()) ||
        (c.short_name?.toLowerCase().includes(nameQuery.toLowerCase()) ?? false)
      ).slice(0, 6)
    : [];

  useEffect(() => {
    if (service) {
      setForm(service);
      setNameQuery(service.name);
      if (service.shiftValues) setShiftValues(service.shiftValues);
      if (service.expenses) {
        setExpenses(service.expenses.map(({ label, amount_brl, frequency }) =>
          ({ label, amount_brl, frequency })
        ));
      }
    } else {
      setForm({
        name: '',
        color: FN_SERVICE_PALETTE[services.length % FN_SERVICE_PALETTE.length],
        regime: 'pj_turno',
        payment_delta: 1,
        fiscal_mode: 'A',
        fiscal_pct_total: 15,
      });
      setNameQuery('');
      setShiftValues({ ...FN_DEFAULT_SHIFT_VALUES });
      setExpenses([]);
    }
  }, [service, open]);

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    await upsertService.mutateAsync({ service: form, shiftValues, expenses });
    setSaving(false);
    onOpenChange(false);
  };

  const needsShiftValues =
    form.regime === 'pj_turno' || form.regime === 'pj_producao';
  const needsExpenses =
    (form.regime === 'pj_turno' || form.regime === 'pj_producao') &&
    (form.fiscal_mode === 'B' || form.fiscal_mode === 'C');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92vh] overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display">{isNew ? 'Novo serviço' : `Editar — ${service?.name}`}</SheetTitle>
          <SheetDescription className="font-body">
            Configure os dados do local onde você trabalha.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="geral" className="flex-1">Geral</TabsTrigger>
            {needsShiftValues && (
              <TabsTrigger value="valores" className="flex-1">Valores/turno</TabsTrigger>
            )}
            <TabsTrigger value="fiscal" className="flex-1">Fiscal</TabsTrigger>
            {needsExpenses && (
              <TabsTrigger value="despesas" className="flex-1">Despesas</TabsTrigger>
            )}
            {!isNew && (
              <TabsTrigger value="recorrencia" className="flex-1">Recorrência</TabsTrigger>
            )}
          </TabsList>

          {/* ABA GERAL */}
          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-[1fr_48px] gap-2">
              <div className="space-y-1.5 relative" ref={nameWrapRef}>
                <Label className="text-xs">Nome do serviço / clínica</Label>
                <Input
                  value={nameQuery}
                  onChange={e => {
                    setNameQuery(e.target.value);
                    setForm(f => ({ ...f, name: e.target.value }));
                    setShowPresets(true);
                  }}
                  onFocus={() => nameQuery.length >= 1 && setShowPresets(true)}
                  placeholder="Ex: IMAG, Hospital São Lucas..."
                  autoComplete="off"
                />
                {showPresets && filteredPresets.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {filteredPresets.map((clinic) => (
                      <button
                        key={clinic.id}
                        type="button"
                        onMouseDown={() => {
                          setNameQuery(clinic.name);
                          setShowPresets(false);
                          setForm(f => ({
                            ...f,
                            name: clinic.name,
                            address: `${clinic.address}, ${clinic.city} - ${clinic.state}`,
                            lat: clinic.lat ?? 0,
                            lng: clinic.lng ?? 0,
                            place_id: clinic.place_id ?? '',
                          }));
                        }}
                        className="w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors hover:bg-muted"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{clinic.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {clinic.address}, {clinic.city}
                          </p>
                        </div>
                        {clinic.short_name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0 self-center">
                            {clinic.short_name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cor</Label>
                <input
                  type="color"
                  value={form.color ?? '#378ADD'}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="h-10 w-12 rounded-lg border border-border cursor-pointer p-0.5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Endereço da clínica</Label>
              <Input
                value={form.address ?? ''}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Preenchido automaticamente ao selecionar uma clínica"
                className="text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Regime de trabalho</Label>
                <Select
                  value={form.regime}
                  onValueChange={v => setForm(f => ({ ...f, regime: v as WorkRegime }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_REGIMES.map(r => (
                      <SelectItem key={r} value={r}>{REGIME_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pagamento</Label>
                <Select
                  value={String(form.payment_delta ?? 1)}
                  onValueChange={v => setForm(f => ({ ...f, payment_delta: Number(v) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Imediato</SelectItem>
                    <SelectItem value="1">M+1</SelectItem>
                    <SelectItem value="2">M+2</SelectItem>
                    <SelectItem value="3">M+3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Método predominante</Label>
              <Select
                value={form.primary_method ?? ''}
                onValueChange={v => setForm(f => ({ ...f, primary_method: v as WorkMethod }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {ALL_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CLT / Residência: campos extras */}
            {(form.regime === 'clt' || form.regime === 'residencia') && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                <div className="space-y-1.5">
                  <Label className="text-xs">Salário fixo mensal (R$)</Label>
                  <Input
                    type="number"
                    value={form.fixed_monthly_salary ?? ''}
                    onChange={e => setForm(f => ({
                      ...f, fixed_monthly_salary: Number(e.target.value)
                    }))}
                    placeholder="Ex: 12000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Carga obrigatória (h/mês)</Label>
                  <Input
                    type="number"
                    value={form.required_hours_month ?? ''}
                    onChange={e => setForm(f => ({
                      ...f, required_hours_month: Number(e.target.value)
                    }))}
                    placeholder="Ex: 160"
                  />
                </div>
              </div>
            )}

            {/* Pró-labore: campos extras */}
            {form.regime === 'pro_labore' && (
              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor mensal bruto (R$)</Label>
                    <Input
                      type="number"
                      value={form.fixed_monthly_value ?? ''}
                      onChange={e => setForm(f => ({ ...f, fixed_monthly_value: Number(e.target.value) }))}
                      placeholder="Ex: 5000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Carga horária estimada (h/mês)</Label>
                    <Input
                      type="number"
                      value={form.monthly_hours ?? ''}
                      onChange={e => setForm(f => ({ ...f, monthly_hours: Number(e.target.value) }))}
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_taxed ?? false}
                    onCheckedChange={v => setForm(f => ({ ...f, is_taxed: v }))}
                  />
                  <Label className="text-xs">É tributado?</Label>
                </div>
                {form.is_taxed && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Percentual de desconto (%)</Label>
                    <Input
                      type="number"
                      value={form.tax_pct ?? ''}
                      onChange={e => setForm(f => ({ ...f, tax_pct: Number(e.target.value) }))}
                      placeholder="Ex: 11"
                    />
                    <p className="text-[10px] text-muted-foreground">Use a alíquota efetiva total (IR + INSS se aplicável)</p>
                  </div>
                )}
              </div>
            )}

            {/* Distribuição de lucros: campos extras */}
            {form.regime === 'distribuicao_lucros' && (
              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor esperado por distribuição (R$)</Label>
                  <Input
                    type="number"
                    value={form.fixed_monthly_value ?? ''}
                    onChange={e => setForm(f => ({ ...f, fixed_monthly_value: Number(e.target.value) }))}
                    placeholder="Ex: 30000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Frequência</Label>
                  <Select
                    value={form.distribution_frequency ?? 'monthly'}
                    onValueChange={v => {
                      const freq = v as FnService['distribution_frequency'];
                      const defaults: Record<string, number[]> = {
                        biannual: [6, 12],
                        annual: [12],
                      };
                      setForm(f => ({
                        ...f,
                        distribution_frequency: freq,
                        distribution_months: defaults[v] ?? f.distribution_months,
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="biannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="irregular">Irregular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(form.distribution_frequency === 'biannual' || form.distribution_frequency === 'annual') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Meses de distribuição</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => {
                        const monthNum = i + 1;
                        const selected = form.distribution_months?.includes(monthNum) ?? false;
                        return (
                          <label key={m} className="flex items-center gap-1 text-xs">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={(checked) => {
                                setForm(f => {
                                  const curr = f.distribution_months ?? [];
                                  return {
                                    ...f,
                                    distribution_months: checked
                                      ? [...curr, monthNum].sort((a, b) => a - b)
                                      : curr.filter(x => x !== monthNum),
                                  };
                                });
                              }}
                            />
                            {m}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_taxed ?? false}
                    onCheckedChange={v => setForm(f => ({ ...f, is_taxed: v }))}
                  />
                  <Label className="text-xs">É tributado?</Label>
                </div>
                {form.is_taxed && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Percentual de desconto (%)</Label>
                    <Input
                      type="number"
                      value={form.tax_pct ?? ''}
                      onChange={e => setForm(f => ({ ...f, tax_pct: Number(e.target.value) }))}
                      placeholder="Ex: 0"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Dividendos são isentos no Simples/LP até R$ 50k/mês. Defina 0% se aplicável ao seu caso.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ABA VALORES POR TURNO */}
          {needsShiftValues && (
            <TabsContent value="valores">
              <ShiftValuesSection
                values={shiftValues}
                onChange={setShiftValues}
              />
            </TabsContent>
          )}

          {/* ABA FISCAL */}
          <TabsContent value="fiscal">
            <FiscalConfigSection
              regime={form.regime ?? 'pj_turno'}
              fiscalMode={(form.fiscal_mode ?? 'A') as FiscalMode}
              fiscalPctTotal={form.fiscal_pct_total ?? 15}
              fiscalPctBase={form.fiscal_pct_base ?? 10}
              fiscalFixedCosts={form.fiscal_fixed_costs ?? 0}
              onChange={updates => setForm(f => ({ ...f, ...updates }))}
            />
          </TabsContent>

          {/* ABA DESPESAS */}
          {needsExpenses && (
            <TabsContent value="despesas">
              <ExpensesSection
                expenses={expenses}
                onChange={setExpenses}
              />
            </TabsContent>
          )}

          {/* ABA RECORRÊNCIA */}
          {!isNew && service && (
            <TabsContent value="recorrencia">
              <RecurrenceRulesSection
                serviceId={service.id}
                serviceName={service.name}
                serviceColor={service.color}
              />
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-6 space-y-2">
          <Button className="w-full" onClick={handleSave} disabled={saving || !form.name?.trim()}>
            {saving ? 'Salvando...' : isNew ? 'Adicionar serviço' : 'Salvar alterações'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
