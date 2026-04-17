import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  FnDoctorProfile, FnService, FnShiftValue, FnServiceExpense,
  FnShiftType, FN_DEFAULT_SHIFT_VALUES, FN_SERVICE_PALETTE,
} from '@/types/financialNavigator';

const KEYS = {
  profile: (uid: string) => ['fn_profile', uid],
  services: (uid: string) => ['fn_services', uid],
  progress: (uid: string) => ['fn_progress', uid],
};

export function useFnConfig() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id ?? '';
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEYS.profile(uid) });
    qc.invalidateQueries({ queryKey: KEYS.services(uid) });
    qc.invalidateQueries({ queryKey: KEYS.progress(uid) });
  };

  // ── Doctor Profile ──────────────────────────────────────────────────────────

  const { data: doctorProfile, isLoading: loadingProfile } = useQuery({
    queryKey: KEYS.profile(uid),
    enabled: !!uid,
    queryFn: async (): Promise<FnDoctorProfile | null> => {
      const { data } = await (supabase as any)
        .from('fn_doctor_profile')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      return data as FnDoctorProfile | null;
    },
  });

  const saveProfile = useMutation({
    mutationFn: async (p: Partial<FnDoctorProfile>) => {
      const { error } = await (supabase as any)
        .from('fn_doctor_profile')
        .upsert({ ...p, user_id: uid, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ── Services ────────────────────────────────────────────────────────────────

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: KEYS.services(uid),
    enabled: !!uid,
    queryFn: async (): Promise<FnService[]> => {
      const { data: svcs, error } = await (supabase as any)
        .from('fn_services')
        .select('*')
        .eq('user_id', uid)
        .order('sort_order');
      if (error) throw error;

      const { data: vals } = await (supabase as any)
        .from('fn_shift_values')
        .select('*')
        .eq('user_id', uid);

      const { data: expenses } = await (supabase as any)
        .from('fn_service_expenses')
        .select('*')
        .eq('user_id', uid);

      return (svcs ?? []).map((svc: any) => ({
        ...svc,
        shiftValues: Object.fromEntries(
          (Object.keys(FN_DEFAULT_SHIFT_VALUES) as FnShiftType[]).map(st => {
            const found = (vals ?? []).find(
              (v: any) => v.service_id === svc.id && v.shift_type === st
            );
            return [st, found?.value_brl ?? FN_DEFAULT_SHIFT_VALUES[st]];
          })
        ) as Record<FnShiftType, number>,
        expenses: (expenses ?? []).filter(
          (e: any) => e.service_id === svc.id
        ),
      })) as FnService[];
    },
  });

  const buildServicePayload = (service: Partial<FnService>) => ({
    name: service.name ?? 'Novo serviço',
    color: service.color ?? FN_SERVICE_PALETTE[services.length % FN_SERVICE_PALETTE.length],
    sort_order: service.sort_order ?? services.length,
    is_active: service.is_active ?? true,
    address: service.address ?? null,
    lat: service.lat ?? null,
    lng: service.lng ?? null,
    place_id: service.place_id ?? null,
    regime: service.regime ?? 'pj_turno',
    primary_method: service.primary_method ?? null,
    method_mix: service.method_mix ?? null,
    payment_delta: service.payment_delta ?? 1,
    fiscal_mode: service.fiscal_mode ?? 'A',
    fiscal_pct_total: service.fiscal_pct_total ?? 15,
    fiscal_pct_base: service.fiscal_pct_base ?? 10,
    fiscal_fixed_costs: service.fiscal_fixed_costs ?? 0,
    fixed_monthly_salary: service.fixed_monthly_salary ?? null,
    required_hours_month: service.required_hours_month ?? null,
    fixed_monthly_value: service.fixed_monthly_value ?? null,
    monthly_hours: service.monthly_hours ?? null,
    is_taxed: service.is_taxed ?? false,
    tax_pct: service.tax_pct ?? 0,
    distribution_frequency: service.distribution_frequency ?? null,
    distribution_months: service.distribution_months ?? null,
  });

  const upsertService = useMutation({
    mutationFn: async ({
      service,
      shiftValues,
      expenses,
    }: {
      service: Partial<FnService>;
      shiftValues?: Record<FnShiftType, number>;
      expenses?: Omit<FnServiceExpense, 'id' | 'service_id' | 'user_id'>[];
    }) => {
      let svcId = service.id;

      if (!svcId) {
        const { data, error } = await (supabase as any)
          .from('fn_services')
          .insert({ user_id: uid, ...buildServicePayload(service) })
          .select()
          .single();
        if (error) throw error;
        svcId = data.id;
      } else {
        const { error } = await (supabase as any)
          .from('fn_services')
          .update({ ...buildServicePayload(service), updated_at: new Date().toISOString() })
          .eq('id', svcId)
          .eq('user_id', uid);
        if (error) throw error;
      }

      if (shiftValues && svcId) {
        const rows = (Object.entries(shiftValues) as [FnShiftType, number][]).map(
          ([st, val]) => ({ service_id: svcId!, user_id: uid, shift_type: st, value_brl: val })
        );
        await (supabase as any).from('fn_shift_values').upsert(rows, {
          onConflict: 'service_id,shift_type',
        });
      }

      if (expenses && svcId) {
        await (supabase as any)
          .from('fn_service_expenses')
          .delete()
          .eq('service_id', svcId)
          .eq('user_id', uid);
        if (expenses.length > 0) {
          await (supabase as any).from('fn_service_expenses').insert(
            expenses.map(e => ({ ...e, service_id: svcId!, user_id: uid }))
          );
        }
      }

      // Auto-calculate commute if service has lat/lng AND home is set
      if (svcId && service.lat && service.lng && doctorProfile?.home_lat && doctorProfile?.home_lng) {
        try {
          const { data: cm } = await supabase.functions.invoke('calculate-commute', {
            body: {
              origin_lat: doctorProfile.home_lat,
              origin_lng: doctorProfile.home_lng,
              dest_lat: service.lat,
              dest_lng: service.lng,
            },
          });
          if (cm?.minutes != null) {
            await (supabase as any).from('fn_services').update({
              commute_minutes: cm.minutes,
              commute_km: cm.km,
            }).eq('id', svcId);

            await (supabase as any).from('commute_entries').upsert({
              user_id: uid,
              service_id: svcId,
              label: service.name ?? 'Trabalho',
              origin_description: 'Casa',
              destination_description: service.name ?? null,
              origin_lat: doctorProfile.home_lat,
              origin_lng: doctorProfile.home_lng,
              dest_lat: service.lat,
              dest_lng: service.lng,
              duration_minutes: cm.minutes,
              distance_km: cm.km,
              days_of_week: [1, 2, 3, 4, 5],
              source: 'google_maps',
              is_work_commute: true,
            }, { onConflict: 'service_id' });
          }
        } catch (err) {
          console.warn('[useFnConfig] commute calculation failed', err);
        }
      }
    },
    onSuccess: invalidate,
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('fn_services')
        .delete()
        .eq('id', id)
        .eq('user_id', uid);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ── Onboarding progress ─────────────────────────────────────────────────────

  const { data: progress } = useQuery({
    queryKey: KEYS.progress(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('fn_onboarding_progress')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      return data ?? { block1_pct: 0, block2_pct: 0, block3_pct: 0, block4_pct: 0 };
    },
  });

  // Calcula progresso do Bloco 1 automaticamente
  const block1Progress = (() => {
    if (!doctorProfile && services.length === 0) return 0;
    let score = 0;
    if (doctorProfile?.home_address) score += 20;
    if (doctorProfile?.monthly_net_goal && doctorProfile.monthly_net_goal > 0) score += 20;
    if (services.length > 0) score += 30;
    const svcsWithFiscal = services.filter(s => s.fiscal_mode).length;
    if (svcsWithFiscal === services.length && services.length > 0) score += 30;
    return Math.min(100, score);
  })();

  return {
    doctorProfile,
    services,
    progress: { ...(progress ?? {}), block1_pct: block1Progress },
    isLoading: loadingProfile || loadingServices,
    saveProfile,
    upsertService,
    deleteService,
  };
}
