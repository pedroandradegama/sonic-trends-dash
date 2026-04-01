import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFnInsights } from '@/hooks/useFnInsights';
import { useFnConfig } from '@/hooks/useFnConfig';
import { FnSemaforoCard } from './FnSemaforoCard';
import { FnKpiSparklines } from './FnKpiSparklines';
import { FnPjPfSimulation } from './FnPjPfSimulation';
import { FnServiceEvalSection } from './FnServiceEvalSection';
import { FnEvalReminder } from './FnEvalReminder';

export function Block4Page() {
  const { profile } = useUserProfile();
  const {
    semaforo, snapshots, compositeScores, servicesNeedingEval,
    block3Progress, block4Progress, upsertSnapshot,
  } = useFnInsights();
  const { services, doctorProfile } = useFnConfig();

  useEffect(() => { upsertSnapshot.mutate(); }, []);

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
    <div className="space-y-6">
      {servicesNeedingEval.length > 0 && (
        <FnEvalReminder services={servicesNeedingEval} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FnSemaforoCard
          semaforo={semaforo}
          goal={doctorProfile?.monthly_net_goal ?? 0}
        />

        {snapshots.length >= 2 && (
          <FnKpiSparklines snapshots={snapshots} />
        )}
      </div>

      <FnServiceEvalSection
        services={services}
        compositeScores={compositeScores}
      />

      {services.length > 0 && (
        <FnPjPfSimulation
          services={services}
          doctorProfile={doctorProfile}
        />
      )}
    </div>
  );
}
