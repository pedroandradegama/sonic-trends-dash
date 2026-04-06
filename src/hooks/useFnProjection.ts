import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFnConfig } from '@/hooks/useFnConfig';
import { useFnCalendar } from '@/hooks/useFnCalendar';
import {
  FnProjectionPrefs, MonthProjectionPoint, ProjectionMetrics,
  FnShiftAdjustment, WorkMethod,
  SHIFT_HOURS, calcBenefitProvision,
} from '@/types/financialNavigator';

const KEYS = {
  prefs:       (uid: string) => ['fn_proj_prefs', uid],
  adjustments: (uid: string) => ['fn_adjustments', uid],
  commute:     (uid: string) => ['fn_commute_totals', uid],
};

const MONTHS_SHORT = [
  'jan','fev','mar','abr','mai','jun',
  'jul','ago','set','out','nov','dez',
];

export function useFnProjection() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id ?? '';
  const { services, doctorProfile } = useFnConfig();
  const { getShiftsForMonth } = useFnCalendar();
  const qc = useQueryClient();

  // ── Preferences ─────────────────────────────────────────────────────────────

  const { data: prefs = {
    show_net: false, tax_rate: 27,
    filter_service: 'all', filter_regime: 'all', filter_method: 'all',
  } as FnProjectionPrefs } = useQuery({
    queryKey: KEYS.prefs(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('fn_projection_prefs')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      return (data as FnProjectionPrefs | null) ?? {
        show_net: false, tax_rate: 27,
        filter_service: 'all', filter_regime: 'all', filter_method: 'all',
      };
    },
  });

  const savePrefs = useMutation({
    mutationFn: async (p: Partial<FnProjectionPrefs>) => {
      const { error } = await (supabase as any)
        .from('fn_projection_prefs')
        .upsert({ ...prefs, ...p, user_id: uid, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.prefs(uid) }),
  });

  // ── Adjustments ──────────────────────────────────────────────────────────────

  const { data: adjustments = [] } = useQuery({
    queryKey: KEYS.adjustments(uid),
    enabled: !!uid,
    queryFn: async (): Promise<FnShiftAdjustment[]> => {
      const { data } = await (supabase as any)
        .from('fn_shift_adjustments')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      return (data ?? []) as FnShiftAdjustment[];
    },
  });

  const addAdjustment = useMutation({
    mutationFn: async (adj: Omit<FnShiftAdjustment, 'id' | 'created_at'>) => {
      const { error } = await (supabase as any)
        .from('fn_shift_adjustments')
        .insert({ ...adj, user_id: uid });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.adjustments(uid) }),
  });

  // ── Commute totals (from cache) ───────────────────────────────────────────────

  const { data: commuteTotals = {} } = useQuery({
    queryKey: KEYS.commute(uid),
    enabled: !!uid,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data } = await (supabase as any)
        .from('fn_commute_cache')
        .select('service_id, slot_type, duration_min')
        .eq('user_id', uid);
      if (!data) return {};
      const totals: Record<string, { sum: number; count: number }> = {};
      data.forEach((row: any) => {
        if (!totals[row.service_id]) totals[row.service_id] = { sum: 0, count: 0 };
        totals[row.service_id].sum += row.duration_min ?? 0;
        totals[row.service_id].count += 1;
      });
      return Object.fromEntries(
        Object.entries(totals).map(([id, { sum, count }]) => [id, sum / count])
      );
    },
  });

  // ── Auto-fetch commute times for services with coordinates ────────────────
  const fetchedCommuteRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!uid || services.length === 0) return;

    const servicesToFetch = services.filter(
      svc => svc.lat && svc.lng && !fetchedCommuteRef.current.has(svc.id)
    );
    if (servicesToFetch.length === 0) return;

    const slotTypes = ['slot1', 'slot2', 'slot3', 'slot4'];

    servicesToFetch.forEach(svc => {
      fetchedCommuteRef.current.add(svc.id);
      slotTypes.forEach(async (slot) => {
        try {
          await supabase.functions.invoke('fn-commute-time', {
            body: { service_id: svc.id, slot_type: slot },
          });
        } catch {
          // silently ignore
        }
      });
    });

    const timer = setTimeout(() => {
      qc.invalidateQueries({ queryKey: KEYS.commute(uid) });
    }, 8000);
    return () => clearTimeout(timer);
  }, [uid, services, qc]);

  // ── Core projection calculation ───────────────────────────────────────────────

  const calcMonthGross = useCallback(
    (year: number, month: number): Record<string, number> => {
      const shifts = getShiftsForMonth(year, month);
      const result: Record<string, number> = {};

      shifts.forEach(shift => {
        const svc = services.find(s => s.id === shift.service_id);
        if (!svc) return;

        if (prefs.filter_service !== 'all' && svc.id !== prefs.filter_service) return;
        if (prefs.filter_regime !== 'all' && svc.regime !== prefs.filter_regime) return;
        if (prefs.filter_method !== 'all' && svc.primary_method !== prefs.filter_method) return;

        const val = svc.shiftValues?.[shift.shift_type] ?? 0;
        result[svc.id] = (result[svc.id] ?? 0) + val;
      });

      return result;
    },
    [getShiftsForMonth, services, prefs]
  );

  const applyNet = useCallback(
    (gross: number): number => {
      if (!prefs.show_net) return gross;
      return Math.round(gross * (1 - prefs.tax_rate / 100));
    },
    [prefs.show_net, prefs.tax_rate]
  );

  const projectionPoints = useMemo((): MonthProjectionPoint[] => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    return Array.from({ length: 8 }, (_, i) => {
      const offset = i - 2;
      let m = curMonth + offset;
      let y = curYear;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }

      const grossByService = calcMonthGross(y, m);
      const totalGross = Object.values(grossByService).reduce((a, v) => a + v, 0);
      const totalNet = applyNet(totalGross);

      const monthShifts = getShiftsForMonth(y, m);
      const totalHours = monthShifts.reduce(
        (acc, s) => acc + (SHIFT_HOURS[s.shift_type] ?? 0), 0
      );

      let expectedReceipts = 0;
      services.forEach(svc => {
        if (svc.payment_delta > 0) {
          let srcM = m - svc.payment_delta;
          let srcY = y;
          while (srcM < 0) { srcM += 12; srcY--; }
          const srcGross = calcMonthGross(srcY, srcM)[svc.id] ?? 0;
          expectedReceipts += applyNet(srcGross);
        } else {
          expectedReceipts += applyNet(grossByService[svc.id] ?? 0);
        }
      });

      return {
        label: `${MONTHS_SHORT[m]}/${String(y).slice(2)}`,
        year: y,
        month: m,
        isPast: offset < 0,
        isCurrent: offset === 0,
        grossByService,
        totalGross,
        totalNet,
        totalHours,
        expectedReceipts,
      };
    });
  }, [calcMonthGross, applyNet, getShiftsForMonth, services]);

  const metrics = useMemo((): ProjectionMetrics => {
    const curPoint = projectionPoints[2];
    const nxtPoint = projectionPoints[3];

    const pointsWithData = projectionPoints.filter(p => p.totalGross > 0);
    const avgMonthlyGross = pointsWithData.length > 0
      ? Math.round(pointsWithData.reduce((a, p) => a + p.totalGross, 0) / pointsWithData.length)
      : 0;

    const curShifts = getShiftsForMonth(curPoint.year, curPoint.month);

    const hoursByMethod: Record<WorkMethod, number> = {
      us_geral: 0, us_vascular: 0, mamografia: 0,
      tc: 0, rm: 0, puncao: 0, misto: 0,
    };
    const grossByMethod: Record<WorkMethod, number> = { ...hoursByMethod };

    curShifts.forEach(shift => {
      const svc = services.find(s => s.id === shift.service_id);
      if (!svc?.primary_method || svc.primary_method === 'misto') {
        if (svc?.method_mix) {
          const hrs = SHIFT_HOURS[shift.shift_type];
          const val = svc.shiftValues?.[shift.shift_type] ?? 0;
          Object.entries(svc.method_mix).forEach(([method, pct]) => {
            const m = method as WorkMethod;
            hoursByMethod[m] = (hoursByMethod[m] ?? 0) + hrs * ((pct as number) / 100);
            grossByMethod[m] = (grossByMethod[m] ?? 0) + val * ((pct as number) / 100);
          });
        } else {
          hoursByMethod['misto'] += SHIFT_HOURS[shift.shift_type];
          grossByMethod['misto'] += svc?.shiftValues?.[shift.shift_type] ?? 0;
        }
      } else {
        const method = svc.primary_method;
        hoursByMethod[method] += SHIFT_HOURS[shift.shift_type];
        grossByMethod[method] += svc.shiftValues?.[shift.shift_type] ?? 0;
      }
    });

    let commuteHours = 0;
    curShifts.forEach(shift => {
      const avgCommute = commuteTotals[shift.service_id] ?? 0;
      commuteHours += (avgCommute * 2) / 60;
    });
    const effectiveHours = curPoint.totalHours + commuteHours;
    const effectiveHourlyRate = effectiveHours > 0
      ? Math.round(curPoint.totalNet / effectiveHours)
      : 0;

    const provisionAmount = doctorProfile
      ? calcBenefitProvision(
          curPoint.totalNet,
          doctorProfile.include_13th,
          doctorProfile.include_vacation,
        )
      : 0;

    const receiptsByMonth: Record<string, number> = {};
    services.forEach(svc => {
      projectionPoints.forEach(pt => {
        const gross = pt.grossByService[svc.id] ?? 0;
        if (gross === 0) return;
        let rm = pt.month + svc.payment_delta;
        let ry = pt.year;
        while (rm > 11) { rm -= 12; ry++; }
        const key = `${ry}-${String(rm + 1).padStart(2, '0')}`;
        receiptsByMonth[key] = (receiptsByMonth[key] ?? 0) + applyNet(gross);
      });
    });

    return {
      currentMonthGross: curPoint.totalGross,
      currentMonthNet: curPoint.totalNet,
      nextMonthGross: nxtPoint.totalGross,
      nextMonthNet: nxtPoint.totalNet,
      avgMonthlyGross,
      totalHoursCurrentMonth: curPoint.totalHours,
      effectiveHourlyRate,
      provisionAmount,
      hoursByMethod,
      grossByMethod,
      receiptsByMonth,
      commuteHoursMonth: commuteHours,
    };
  }, [projectionPoints, services, getShiftsForMonth, commuteTotals, doctorProfile, applyNet]);

  const block2Progress = useMemo(() => {
    const now = new Date();
    const curShifts = getShiftsForMonth(now.getFullYear(), now.getMonth());
    let score = 0;
    if (curShifts.length > 0) score += 40;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const uniqueDays = new Set(curShifts.map(s => s.shift_date)).size;
    if (uniqueDays >= Math.round(daysInMonth * 0.3)) score += 30;
    if (services.length > 0) score += 30;
    return Math.min(100, score);
  }, [getShiftsForMonth, services]);

  return {
    prefs,
    projectionPoints,
    metrics,
    adjustments,
    block2Progress,
    savePrefs,
    addAdjustment,
  };
}
