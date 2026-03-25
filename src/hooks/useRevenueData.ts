import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  RevenueService, RevenueShift, RevenuePreferences,
  ShiftType, DEFAULT_SHIFT_VALUES, SERVICE_PALETTE,
} from '@/types/revenue';

const QUERY_KEYS = {
  services: (uid: string) => ['revenue_services', uid],
  shifts: (uid: string) => ['revenue_shifts', uid],
  prefs: (uid: string) => ['revenue_prefs', uid],
};

export function useRevenueData() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id;
  const qc = useQueryClient();

  const { data: rawServices = [], isLoading: loadingSvcs } = useQuery({
    queryKey: QUERY_KEYS.services(uid ?? ''),
    enabled: !!uid,
    queryFn: async () => {
      const { data: svcs, error } = await (supabase as any)
        .from('revenue_services')
        .select('*')
        .eq('user_id', uid!)
        .order('sort_order');
      if (error) throw error;

      const { data: vals } = await (supabase as any)
        .from('revenue_shift_values')
        .select('*')
        .eq('user_id', uid!);

      return (svcs ?? []).map((svc: any) => ({
        ...svc,
        shiftValues: Object.fromEntries(
          (['manha','tarde','noite','p6','p12','p24'] as ShiftType[]).map(st => {
            const found = (vals ?? []).find((v: any) => v.service_id === svc.id && v.shift_type === st);
            return [st, found?.value_brl ?? DEFAULT_SHIFT_VALUES[st]];
          })
        ) as Record<ShiftType, number>,
      })) as RevenueService[];
    },
  });

  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: QUERY_KEYS.shifts(uid ?? ''),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('revenue_shifts')
        .select('*')
        .eq('user_id', uid!);
      if (error) throw error;
      return data as RevenueShift[];
    },
  });

  const { data: prefs = { tax_rate: 27, show_net: false } } = useQuery({
    queryKey: QUERY_KEYS.prefs(uid ?? ''),
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('revenue_preferences')
        .select('*')
        .eq('user_id', uid!)
        .maybeSingle();
      return (data as RevenuePreferences | null) ?? { tax_rate: 27, show_net: false };
    },
  });

  const invalidate = useCallback(() => {
    if (!uid) return;
    qc.invalidateQueries({ queryKey: QUERY_KEYS.services(uid) });
    qc.invalidateQueries({ queryKey: QUERY_KEYS.shifts(uid) });
  }, [uid, qc]);

  const saveShiftsForDay = useMutation({
    mutationFn: async ({
      date, shiftTypes, serviceId,
    }: { date: string; shiftTypes: ShiftType[]; serviceId: string }) => {
      if (!uid) throw new Error('not authenticated');
      await (supabase as any)
        .from('revenue_shifts')
        .delete()
        .eq('user_id', uid)
        .eq('shift_date', date)
        .eq('service_id', serviceId);

      if (shiftTypes.length === 0) return;

      const rows = shiftTypes.map(st => ({
        user_id: uid,
        service_id: serviceId,
        shift_date: date,
        shift_type: st,
        status: 'projetado' as const,
      }));
      const { error } = await (supabase as any).from('revenue_shifts').insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const clearDay = useMutation({
    mutationFn: async (date: string) => {
      if (!uid) throw new Error('not authenticated');
      const { error } = await (supabase as any)
        .from('revenue_shifts')
        .delete()
        .eq('user_id', uid)
        .eq('shift_date', date);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const upsertService = useMutation({
    mutationFn: async ({
      service, shiftValues,
    }: { service: Partial<RevenueService>; shiftValues?: Record<ShiftType, number> }) => {
      if (!uid) throw new Error('not authenticated');
      let svcId = service.id;

      if (!svcId) {
        const idx = rawServices.length;
        const { data, error } = await (supabase as any)
          .from('revenue_services')
          .insert({
            user_id: uid,
            name: service.name ?? 'Nova clínica',
            color: service.color ?? SERVICE_PALETTE[idx % SERVICE_PALETTE.length],
            delta_months: service.delta_months ?? 1,
            sort_order: idx,
          })
          .select()
          .single();
        if (error) throw error;
        svcId = data.id;
      } else {
        const { error } = await (supabase as any)
          .from('revenue_services')
          .update({
            name: service.name,
            color: service.color,
            delta_months: service.delta_months,
            updated_at: new Date().toISOString(),
          })
          .eq('id', svcId)
          .eq('user_id', uid);
        if (error) throw error;
      }

      if (shiftValues && svcId) {
        const rows = (Object.entries(shiftValues) as [ShiftType, number][]).map(([st, val]) => ({
          service_id: svcId!,
          user_id: uid,
          shift_type: st,
          value_brl: val,
        }));
        await (supabase as any).from('revenue_shift_values').upsert(rows, {
          onConflict: 'service_id,shift_type',
        });
      }
    },
    onSuccess: invalidate,
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      if (!uid) throw new Error('not authenticated');
      const { error } = await (supabase as any)
        .from('revenue_services')
        .delete()
        .eq('id', id)
        .eq('user_id', uid);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const savePrefs = useMutation({
    mutationFn: async (p: RevenuePreferences) => {
      if (!uid) throw new Error('not authenticated');
      const { error } = await (supabase as any).from('revenue_preferences').upsert(
        { user_id: uid, ...p, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.prefs(uid ?? '') }),
  });

  const getShiftsForDate = useCallback(
    (date: string) => shifts.filter(s => s.shift_date === date),
    [shifts]
  );

  const getMonthShifts = useCallback(
    (year: number, month: number) =>
      shifts.filter(s => {
        const d = new Date(s.shift_date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [shifts]
  );

  return {
    services: rawServices,
    shifts,
    prefs,
    isLoading: loadingSvcs || loadingShifts,
    saveShiftsForDay,
    clearDay,
    upsertService,
    deleteService,
    savePrefs,
    getShiftsForDate,
    getMonthShifts,
  };
}
