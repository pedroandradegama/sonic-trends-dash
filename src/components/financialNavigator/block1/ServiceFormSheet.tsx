import { useEffect, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicAddressInput } from '../ClinicAddressInput';
import { FiscalConfigSection } from './FiscalConfigSection';
import { ShiftValuesSection } from './ShiftValuesSection';
import { ExpensesSection } from './ExpensesSection';
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

const ALL_REGIMES: WorkRegime[] = ['pj_turno','pj_producao','clt','residencia','fellowship'];
const ALL_METHODS: WorkMethod[] = ['us_geral','us_vascular','mamografia','tc','rm','puncao','misto'];

export function ServiceFormSheet({ open, onOpenChange, service }: Props) {
  const { upsertService, services } = useFnConfig();
  const isNew = !service;

  const [form, setForm] = useState<Partial<FnService>>({});
  const [shiftValues, setShiftValues] = useState<Record<FnShiftType, number>>(
    { ...FN_DEFAULT_SHIFT_VALUES }
  );
  const [expenses, setExpenses] = useState<
    Omit<FnServiceExpense, 'id' | 'service_id' | 'user_id'>[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setForm(service);
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
          </TabsList>

          {/* ABA GERAL */}
          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-[1fr_48px] gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do serviço / clínica</Label>
                <Input
                  value={form.name ?? ''}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: IMAG, Hospital São Lucas..."
                />
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
              <ClinicAddressInput
                value={form.address}
                onSelect={r => setForm(f => ({
                  ...f,
                  address: r.address,
                  lat: r.lat,
                  lng: r.lng,
                  place_id: r.place_id,
                }))}
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
