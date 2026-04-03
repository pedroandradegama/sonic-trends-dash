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
  const { services, doctorProfile } = useFnConfig();
  const { profile } = useUserProfile();

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

  const hasData = projectionPoints.some(p => p.totalGross > 0);

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
    <div className="space-y-5">
      <FnProjectionFilters prefs={prefs} services={services} onSave={savePrefs.mutate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <FnMetricsGrid metrics={metrics} prefs={prefs} />
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
