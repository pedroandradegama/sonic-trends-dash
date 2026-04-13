import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFnInsights } from '@/hooks/useFnInsights';
import { useFnConfig } from '@/hooks/useFnConfig';
import { FnSemaforoCard } from './FnSemaforoCard';
import { FnKpiSparklines } from './FnKpiSparklines';
import { FnPjPfSimulation } from './FnPjPfSimulation';
import { FnServiceEvalSection } from './FnServiceEvalSection';
import { FnEvalReminder } from './FnEvalReminder';
import { FnFinancialFaq } from './FnFinancialFaq';
import { cn } from '@/lib/utils';
import { AlertTriangle, BarChart3, ClipboardCheck, Calculator, MessageCircleQuestion } from 'lucide-react';

export function Block4Page() {
  const { profile } = useUserProfile();
  const {
    semaforo, snapshots, compositeScores, servicesNeedingEval,
    block3Progress, block4Progress, upsertSnapshot,
  } = useFnInsights();
  const { services, doctorProfile } = useFnConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { upsertSnapshot.mutate(); }, []);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!profile?.user_id) return;
    (supabase as any).from('fn_onboarding_progress').upsert(
      {
        user_id: profile.user_id,
        block3_pct: block3Progress,
        block4_pct: block4Progress,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    ).then(() => {});
  }, [block3Progress, block4Progress, profile?.user_id]);

  return (
    <div className="space-y-7">
      {/* ── Alertas ─────────────────────────── */}
      {servicesNeedingEval.length > 0 && (
        <div className={cn(
          'transition-all duration-500',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        )}>
          <FnEvalReminder services={servicesNeedingEval} />
        </div>
      )}

      {/* ── Semáforo + KPIs ────────────────── */}
      <div className={cn(
        'grid grid-cols-1 lg:grid-cols-2 gap-5 transition-all duration-500 delay-100',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground font-display">Semáforo Financeiro</p>
          </div>
          <FnSemaforoCard
            semaforo={semaforo}
            goal={doctorProfile?.monthly_net_goal ?? 0}
          />
        </section>

        {snapshots.length >= 2 && (
          <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground font-display">Evolução dos KPIs</p>
            </div>
            <FnKpiSparklines snapshots={snapshots} />
          </section>
        )}
      </div>

      {/* ── Avaliação de Serviços ──────────── */}
      <section className={cn(
        'rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm transition-all duration-500 delay-200',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      )}>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground font-display">Avaliação dos Serviços</p>
        </div>
        <FnServiceEvalSection
          services={services}
          compositeScores={compositeScores}
        />
      </section>

      {/* ── Simulação PJ vs PF ─────────────── */}
      {services.length > 0 && (
        <section className={cn(
          'rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm transition-all duration-500 delay-300',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        )}>
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground font-display">Simulação PJ vs PF</p>
          </div>
          <FnPjPfSimulation
            services={services}
            doctorProfile={doctorProfile}
          />
        </section>
      )}

      {/* ── Consultor Financeiro IA ───────── */}
      <section className={cn(
        'rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm transition-all duration-500 delay-[400ms]',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      )}>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircleQuestion className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground font-display">Consultor Financeiro IA</p>
        </div>
        <FnFinancialFaq />
      </section>
    </div>
  );
}
