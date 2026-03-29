import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFnConfig } from '@/hooks/useFnConfig';
import {
  FnCalendarShift, FnShiftType, CalendarDayData, MonthSummary,
  SHIFT_SLOT_INDICES, SHIFT_HOURS, VoiceAction,
} from '@/types/financialNavigator';

const KEY = {
  shifts: (uid: string) => ['fn_calendar_shifts', uid],
};

export function useFnCalendar() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id ?? '';
  const { services } = useFnConfig();
  const qc = useQueryClient();

  const { data: allShifts = [], isLoading } = useQuery({
    queryKey: KEY.shifts(uid),
    enabled: !!uid,
    queryFn: async (): Promise<FnCalendarShift[]> => {
      const { data, error } = await (supabase as any)
        .from('fn_calendar_shifts')
        .select('*')
        .eq('user_id', uid)
        .order('shift_date');
      if (error) throw error;
      return data as FnCalendarShift[];
    },
  });

  const getShiftsForDate = useCallback(
    (date: string) => allShifts.filter(s => s.shift_date === date),
    [allShifts]
  );

  const getShiftsForMonth = useCallback(
    (year: number, month: number) =>
      allShifts.filter(s => {
        const d = new Date(s.shift_date + 'T12:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [allShifts]
  );

  const buildDayData = useCallback(
    (date: string): CalendarDayData => {
      const shifts = getShiftsForDate(date);
      const slotOccupancy: (FnCalendarShift | null)[] = [null, null, null, null];
      let hasConflict = false;

      shifts.forEach(shift => {
        const indices = SHIFT_SLOT_INDICES[shift.shift_type];
        indices.forEach(i => {
          if (slotOccupancy[i] !== null) hasConflict = true;
          else slotOccupancy[i] = shift;
        });
      });

      let totalValue = 0;
      let totalHours = 0;
      shifts.forEach(shift => {
        const svc = services.find(s => s.id === shift.service_id);
        totalValue += svc?.shiftValues?.[shift.shift_type] ?? 0;
        totalHours += SHIFT_HOURS[shift.shift_type];
      });

      return { date, shifts, slotOccupancy, hasConflict, totalValue, totalHours };
    },
    [getShiftsForDate, services]
  );

  const buildMonthSummary = useCallback(
    (year: number, month: number): MonthSummary => {
      const shifts = getShiftsForMonth(year, month);
      const summary: MonthSummary = {
        totalGross: 0,
        totalHours: 0,
        shiftCount: shifts.length,
        byService: {},
        byShiftType: {} as Record<FnShiftType, number>,
        conflictDays: [],
      };

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayData = buildDayData(dateStr);
        if (dayData.hasConflict) summary.conflictDays.push(dateStr);
      }

      shifts.forEach(shift => {
        const svc = services.find(s => s.id === shift.service_id);
        const val = svc?.shiftValues?.[shift.shift_type] ?? 0;
        const hrs = SHIFT_HOURS[shift.shift_type];

        summary.totalGross += val;
        summary.totalHours += hrs;
        summary.byShiftType[shift.shift_type] =
          (summary.byShiftType[shift.shift_type] ?? 0) + val;

        if (!summary.byService[shift.service_id]) {
          summary.byService[shift.service_id] = { gross: 0, hours: 0, shifts: 0 };
        }
        summary.byService[shift.service_id].gross += val;
        summary.byService[shift.service_id].hours += hrs;
        summary.byService[shift.service_id].shifts += 1;
      });

      return summary;
    },
    [getShiftsForMonth, buildDayData, services]
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY.shifts(uid) });

  const saveDayShifts = useMutation({
    mutationFn: async ({
      date, serviceId, shiftTypes,
    }: {
      date: string;
      serviceId: string;
      shiftTypes: FnShiftType[];
    }) => {
      if (!uid) throw new Error('unauthenticated');
      await (supabase as any)
        .from('fn_calendar_shifts')
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
        status: 'projetado',
      }));
      const { error } = await (supabase as any).from('fn_calendar_shifts').insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const applyVoiceActions = useMutation({
    mutationFn: async (actions: VoiceAction[]) => {
      if (!uid) throw new Error('unauthenticated');
      const validActions = actions.filter(a => a.service_id && a.shift_date && a.shift_type);
      if (validActions.length === 0) return;

      for (const action of validActions) {
        await (supabase as any)
          .from('fn_calendar_shifts')
          .delete()
          .eq('user_id', uid)
          .eq('shift_date', action.shift_date)
          .eq('service_id', action.service_id!)
          .eq('shift_type', action.shift_type);
      }

      const rows = validActions.map(a => ({
        user_id: uid,
        service_id: a.service_id!,
        shift_date: a.shift_date,
        shift_type: a.shift_type,
        status: 'projetado',
      }));
      const { error } = await (supabase as any).from('fn_calendar_shifts').insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const clearDayShifts = useMutation({
    mutationFn: async (date: string) => {
      if (!uid) throw new Error('unauthenticated');
      const { error } = await (supabase as any)
        .from('fn_calendar_shifts')
        .delete()
        .eq('user_id', uid)
        .eq('shift_date', date);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateShiftStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('fn_calendar_shifts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', uid);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    allShifts,
    isLoading,
    getShiftsForDate,
    getShiftsForMonth,
    buildDayData,
    buildMonthSummary,
    saveDayShifts,
    applyVoiceActions,
    clearDayShifts,
    updateShiftStatus,
  };
}
