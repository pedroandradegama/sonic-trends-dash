import { useEffect, useState } from 'react';
import { DollarSign, Calendar as CalendarIcon, Clock, TrendingUp, Target, Wallet, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RPHIntelligenceBlock } from './RPHIntelligenceBlock';
import { FnProjectionFilters } from './FnProjectionFilters';
import { FnMetricsGrid } from './FnMetricsGrid';
import { FnProjectionChart } from './FnProjectionChart';
import { FnReceiptTimeline } from './FnReceiptTimeline';
import { FnReceiptLineChart } from './FnReceiptLineChart';
import { FnMethodBreakdown } from './FnMethodBreakdown';
import { FnProvisionCard } from './FnProvisionCard';
import { FnAdjustmentsLog } from './FnAdjustmentsLog';
import { FnActualVsProjected } from './FnActualVsProjected';
import { useFnProjection } from '@/hooks/useFnProjection';
import { useFnConfig } from '@/hooks/useFnConfig';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

const BRL = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

export function Block3Page() {
  const { prefs, metrics, projectionPoints, adjustments, block2Progress, isLoading: projLoading, savePrefs } =
    useFnProjection();
  const { services, doctorProfile, isLoading: configLoading } = useFnConfig();
  const { profile, loading: profileLoading } = useUserProfile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

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

  const isLoading = configLoading || profileLoading || projLoading;
  const hasData = projectionPoints.some(p => p.totalGross > 0) || services.some(s =>
    s.regime === 'clt' || s.regime === 'residencia' || s.regime === 'pro_labore' || s.regime === 'distribuicao_lucros'
  );

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
    <div className="space-y-7">
      {/* ── Filtros ─────────────────────────────── */}
      <div className={cn('transition-all duration-500', mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')}>
        <FnProjectionFilters prefs={prefs} services={services} onSave={savePrefs.mutate} />
      </div>

      {/* ── Hero insight cards ───────────────────── */}
      <div className={cn(
        'grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-500 delay-100',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-emerald-50/30 dark:to-emerald-950/10 p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 dark:bg-emerald-900/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 font-body">Receita Média / Mês</p>
              <p className="text-3xl font-bold font-display tracking-tight">{BRL(metrics.avgMonthlyGross)}</p>
              <p className="text-xs text-muted-foreground mt-1 font-body">8 meses projetados</p>
            </div>
            <div className="rounded-xl p-2.5 bg-emerald-100/60 dark:bg-emerald-900/30">
              <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-violet-50/30 dark:to-violet-950/10 p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/30 dark:bg-violet-900/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 font-body">Carga Horária / Mês</p>
              <p className="text-3xl font-bold font-display tracking-tight">{metrics.totalHoursCurrentMonth}h</p>
              <p className="text-xs text-muted-foreground mt-1 font-body">mês atual</p>
            </div>
            <div className="rounded-xl p-2.5 bg-violet-100/60 dark:bg-violet-900/30">
              <CalendarIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-amber-50/30 dark:to-amber-950/10 p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 dark:bg-amber-900/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 font-body">Valor / Hora (efetivo)</p>
              <p className="text-3xl font-bold font-display tracking-tight">R$ {metrics.effectiveHourlyRate}</p>
              <p className="text-xs text-muted-foreground mt-1 font-body">inclui deslocamento</p>
            </div>
            <div className="rounded-xl p-2.5 bg-amber-100/60 dark:bg-amber-900/30">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Conteúdo principal ─────────────────── */}
      <div className={cn(
        'grid grid-cols-1 lg:grid-cols-3 gap-5 transition-all duration-500 delay-200',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      )}>
        <div className="lg:col-span-2 space-y-6">
          {/* Indicadores */}
          <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground font-display">Indicadores detalhados</p>
            </div>
            <FnMetricsGrid metrics={metrics} prefs={prefs} commuteHoursMonth={metrics.commuteHoursMonth} />
          </section>

          {/* Gráfico de produção */}
          <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground font-display">Produção mês a mês</p>
            </div>
            <FnProjectionChart points={projectionPoints} services={services} prefs={prefs} />
          </section>

          {/* Timeline de recebimento */}
          <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
            <FnReceiptTimeline
              receiptsByMonth={metrics.receiptsByMonth}
              services={services}
              projectionPoints={projectionPoints}
              prefs={prefs}
            />
          </section>

          {/* Fluxo de recebimento */}
          <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
            <FnReceiptLineChart
              receiptsByMonth={metrics.receiptsByMonth}
              services={services}
              projectionPoints={projectionPoints}
              prefs={prefs}
            />
          </section>

          {/* Projetado vs Realizado */}
          <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
            <FnActualVsProjected />
          </section>

          {/* RPH Intelligence */}
          <RPHIntelligenceBlock
            avgRPH={metrics.totalHoursCurrentMonth > 0 ? metrics.currentMonthGross / metrics.totalHoursCurrentMonth : 0}
            currentMonthGross={metrics.currentMonthGross}
            totalHours={metrics.totalHoursCurrentMonth}
            effectiveHourlyRate={metrics.effectiveHourlyRate}
            previousMonthGross={projectionPoints[1]?.totalGross}
            previousMonthHours={projectionPoints[1]?.totalHours}
          />
        </div>

        <div className="space-y-6">
          {/* Breakdown por método */}
          <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground font-display">Por método</p>
            </div>
            <FnMethodBreakdown
              hoursByMethod={metrics.hoursByMethod}
              grossByMethod={metrics.grossByMethod}
              prefs={prefs}
            />
          </section>

          {(doctorProfile?.include_13th || doctorProfile?.include_vacation) && metrics.provisionAmount > 0 && (
            <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-5 shadow-sm">
              <FnProvisionCard
                provisionAmount={metrics.provisionAmount}
                include13th={doctorProfile?.include_13th ?? false}
                includeVacation={doctorProfile?.include_vacation ?? false}
                netMonthly={metrics.currentMonthNet}
              />
            </section>
          )}

          {adjustments.length > 0 && (
            <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-5 shadow-sm">
              <FnAdjustmentsLog adjustments={adjustments} services={services} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
