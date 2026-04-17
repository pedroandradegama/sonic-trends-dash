import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface CommuteEntry {
  id: string;
  user_id: string;
  label: string;
  origin_description: string | null;
  destination_description: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
  duration_minutes: number | null;
  distance_km: number | null;
  days_of_week: number[];
  time_of_day: string | null;
  source: 'manual' | 'google_maps' | 'voice';
  raw_transcript: string | null;
  is_work_commute: boolean;
  service_id: string | null;
  created_at: string;
}

const KEY = (uid: string) => ['commute_entries', uid];

export function useCommuteEntries() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id ?? '';
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: KEY(uid),
    enabled: !!uid,
    queryFn: async (): Promise<CommuteEntry[]> => {
      const { data, error } = await (supabase as any)
        .from('commute_entries')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CommuteEntry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: Partial<CommuteEntry> & { label: string }) => {
      const { error } = await (supabase as any)
        .from('commute_entries')
        .insert({ ...entry, user_id: uid });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(uid) }),
  });

  const createMany = useMutation({
    mutationFn: async (rows: (Partial<CommuteEntry> & { label: string })[]) => {
      const payload = rows.map(r => ({ ...r, user_id: uid }));
      const { error } = await (supabase as any).from('commute_entries').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(uid) }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('commute_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', uid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(uid) }),
  });

  // Aproximação: 4.33 semanas/mês × ocorrências semanais
  const getMonthlyMinutes = (filter?: (e: CommuteEntry) => boolean) => {
    return entries
      .filter(e => filter ? filter(e) : true)
      .reduce((sum, e) => {
        const occurrencesPerWeek = (e.days_of_week ?? []).length;
        const minutes = e.duration_minutes ?? 0;
        return sum + minutes * occurrencesPerWeek * 4.33;
      }, 0);
  };

  return {
    entries,
    isLoading,
    createEntry,
    createMany,
    deleteEntry,
    getMonthlyMinutes,
    workEntries: entries.filter(e => e.is_work_commute),
    personalEntries: entries.filter(e => !e.is_work_commute),
  };
}
