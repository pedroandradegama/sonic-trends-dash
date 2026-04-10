import { useEffect } from 'react';
import { FnProjectionFilters } from './FnProjectionFilters';
import { FnMetricsGrid } from './FnMetricsGrid';
import { FnProjectionChart } from './FnProjectionChart';
import { FnReceiptTimeline } from './FnReceiptTimeline';
import { FnReceiptLineChart } from './FnReceiptLineChart';
import { FnMethodBreakdown } from './FnMethodBreakdown';
import { FnProvisionCard } from './FnProvisionCard';
import { FnAdjustmentsLog } from './FnAdjustmentsLog';
import { useFnProjection } from '@/hooks/useFnProjection';
import { useFnConfig } from '@/hooks/useFnConfig';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export function Block3Page() {
  const { prefs, metrics, projectionPoints, adjustments, block2Progress, savePrefs } =
    useFnProjection();
  const { services, doctorProfile, isLoading: configLoading } = useFnConfig();
  const { profile, loading: profileLoading } = useUserProfile();

  // Persist block2 progress whenever it changes
  useEffect(() => {
    if (!profile?.user_id) return;
    (supabase as any)
      .from('fn_onboarding_progress')
      .upsert(
        { user_id: profile.user_id, block2_pct: block2Progress, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .then(() => {});
  }, [block2Progress, profile?.user_id]);

  const isLoading = configLoading || profileLoading;
  const hasData = projectionPoints.some(p => p.totalGross > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="py-10 text-center space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Nenhum turno registrado ainda.
        </p>
        <p className="text-xs text-muted-foreground">
          Vá ao Bloco 2 — Agendas e adicione seus turnos para ver a projeção financeira.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FnProjectionFilters prefs={prefs} services={services} onSave={savePrefs.mutate} />

      {/* Insight cards like Projeção page */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Receita Média / Mês</p>
              <p className="text-2xl font-bold font-display">{BRL(metrics.avgMonthlyGross)}</p>
            </div>
            <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Carga Horária / Mês</p>
              <p className="text-2xl font-bold font-display">{metrics.totalHoursCurrentMonth}h</p>
              <p className="text-xs text-muted-foreground mt-0.5">mês atual</p>
            </div>
            <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-950/30">
              <CalendarIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Valor / Hora (efetivo)</p>
              <p className="text-2xl font-bold font-display">R$ {metrics.effectiveHourlyRate}</p>
              <p className="text-xs text-muted-foreground mt-0.5">inclui deslocamento</p>
            </div>
            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-3">Indicadores detalhados</p>
            <FnMetricsGrid metrics={metrics} prefs={prefs} commuteHoursMonth={metrics.commuteHoursMonth} />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-4">Produção mês a mês</p>
            <FnProjectionChart points={projectionPoints} services={services} prefs={prefs} />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <FnReceiptTimeline
              receiptsByMonth={metrics.receiptsByMonth}
              services={services}
              projectionPoints={projectionPoints}
              prefs={prefs}
            />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <FnReceiptLineChart
              receiptsByMonth={metrics.receiptsByMonth}
              services={services}
              projectionPoints={projectionPoints}
              prefs={prefs}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <FnMethodBreakdown
              hoursByMethod={metrics.hoursByMethod}
              grossByMethod={metrics.grossByMethod}
              prefs={prefs}
            />
          </div>
          {(doctorProfile?.include_13th || doctorProfile?.include_vacation) && metrics.provisionAmount > 0 && (
            <FnProvisionCard
              provisionAmount={metrics.provisionAmount}
              include13th={doctorProfile?.include_13th ?? false}
              includeVacation={doctorProfile?.include_vacation ?? false}
              netMonthly={metrics.currentMonthNet}
            />
          )}
          {adjustments.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <FnAdjustmentsLog adjustments={adjustments} services={services} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
