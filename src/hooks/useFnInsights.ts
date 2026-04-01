import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFnConfig } from '@/hooks/useFnConfig';
import { useFnProjection } from '@/hooks/useFnProjection';
import {
  FnServiceEvaluation, CompositeScore, KpiSnapshot,
  EVAL_DIMENSIONS,
} from '@/types/financialNavigator';

const KEYS = {
  evaluations: (uid: string) => ['fn_evaluations', uid],
  snapshots:   (uid: string) => ['fn_snapshots', uid],
};

function computeComposite(
  eval_: FnServiceEvaluation
): { financial: number; work: number; logistics: number; composite: number } {
  const financialKeys = EVAL_DIMENSIONS.filter(d => d.group === 'financial').map(d => d.key);
  const workKeys = EVAL_DIMENSIONS.filter(d => d.group === 'work').map(d => d.key);
  const logisticsKeys = EVAL_DIMENSIONS.filter(d => d.group === 'logistics').map(d => d.key);

  const avg = (keys: string[]) => {
    const vals = keys.map(k => eval_[k] as number).filter(v => v != null && !isNaN(v));
    if (vals.length === 0) return 0;
    return vals.reduce((a, v) => a + v, 0) / vals.length;
  };

  const financial = avg(financialKeys);
  const work = avg(workKeys);
  const logistics = avg(logisticsKeys);

  const wF = (eval_.weight_financial ?? 50) / 100;
  const wW = (eval_.weight_work ?? 35) / 100;
  const wL = (eval_.weight_logistics ?? 15) / 100;

  const composite = financial * wF + work * wW + logistics * wL;

  return {
    financial: Math.round(financial * 10) / 10,
    work: Math.round(work * 10) / 10,
    logistics: Math.round(logistics * 10) / 10,
    composite: Math.round(composite * 10) / 10,
  };
}

export function useFnInsights() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id ?? '';
  const { services, doctorProfile } = useFnConfig();
  const { metrics, projectionPoints } = useFnProjection();
  const qc = useQueryClient();

  const { data: evaluations = [], isLoading: loadingEvals } = useQuery({
    queryKey: KEYS.evaluations(uid),
    enabled: !!uid,
    queryFn: async (): Promise<FnServiceEvaluation[]> => {
      const { data, error } = await (supabase as any)
        .from('fn_service_evaluations')
        .select('*')
        .eq('user_id', uid)
        .order('evaluated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FnServiceEvaluation[];
    },
  });

  const saveEvaluation = useMutation({
    mutationFn: async (eval_: Omit<FnServiceEvaluation, 'id'>) => {
      const { error } = await (supabase as any)
        .from('fn_service_evaluations')
        .insert({ ...eval_, user_id: uid });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.evaluations(uid) }),
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: KEYS.snapshots(uid),
    enabled: !!uid,
    queryFn: async (): Promise<KpiSnapshot[]> => {
      const { data } = await (supabase as any)
        .from('fn_kpi_snapshots')
        .select('*')
        .eq('user_id', uid)
        .order('snapshot_month', { ascending: true })
        .limit(24);
      return (data ?? []) as KpiSnapshot[];
    },
  });

  const upsertSnapshot = useMutation({
    mutationFn: async () => {
      if (!uid || metrics.currentMonthGross === 0) return;
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { error } = await (supabase as any)
        .from('fn_kpi_snapshots')
        .upsert({
          user_id: uid,
          snapshot_month: monthStr,
          total_gross: Math.round(metrics.currentMonthGross),
          total_net: Math.round(metrics.currentMonthNet),
          total_hours: Math.round(metrics.totalHoursCurrentMonth * 10) / 10,
          effective_rate: metrics.effectiveHourlyRate,
          shift_count: 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,snapshot_month' });
      if (error) throw error;
    },
  });

  const compositeScores = useMemo((): CompositeScore[] => {
    return services.map(svc => {
      const latest = evaluations.find(e => e.service_id === svc.id);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const prev = evaluations
        .filter(e => e.service_id === svc.id && new Date(e.evaluated_at) <= sixMonthsAgo)
        .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())[0];

      if (!latest) {
        return {
          service_id: svc.id, service_name: svc.name, color: svc.color,
          financial_score: 0, work_score: 0, logistics_score: 0, composite: 0,
        };
      }

      const current = computeComposite(latest);
      const prevScore = prev ? computeComposite(prev).composite : undefined;

      return {
        service_id: svc.id, service_name: svc.name, color: svc.color,
        financial_score: current.financial, work_score: current.work,
        logistics_score: current.logistics, composite: current.composite,
        prev_composite: prevScore,
        delta: prevScore !== undefined ? current.composite - prevScore : undefined,
        evaluated_at: latest.evaluated_at,
      };
    });
  }, [evaluations, services]);

  const semaforo = useMemo(() => {
    const goal = doctorProfile?.monthly_net_goal ?? 0;
    if (goal === 0) return { status: 'no_goal' as const, pct: 0, delta: 0 };
    const actual = metrics.currentMonthNet;
    const pct = Math.round((actual / goal) * 100);
    return {
      status: pct >= 100 ? 'green' as const : pct >= 85 ? 'amber' as const : 'red' as const,
      pct, delta: actual - goal,
    };
  }, [doctorProfile, metrics]);

  const servicesNeedingEval = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return services.filter(svc => {
      const latest = evaluations.find(e => e.service_id === svc.id);
      if (!latest) return true;
      return new Date(latest.evaluated_at) < sixMonthsAgo;
    });
  }, [services, evaluations]);

  const block3Progress = useMemo(() => {
    const pts = projectionPoints.filter(p => p.totalGross > 0).length;
    let score = 0;
    if (pts >= 1) score += 50;
    if (pts >= 4) score += 30;
    if (metrics.effectiveHourlyRate > 0) score += 20;
    return Math.min(100, score);
  }, [projectionPoints, metrics]);

  const block4Progress = useMemo(() => {
    let score = 0;
    if (compositeScores.some(s => s.composite > 0)) score += 40;
    if (snapshots.length >= 2) score += 30;
    if (semaforo.status !== 'no_goal') score += 30;
    return Math.min(100, score);
  }, [compositeScores, snapshots, semaforo]);

  return {
    evaluations, compositeScores, snapshots, semaforo,
    servicesNeedingEval, block3Progress, block4Progress,
    isLoading: loadingEvals, saveEvaluation, upsertSnapshot,
  };
}
