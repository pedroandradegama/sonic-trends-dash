import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Holidays
export function useAdminHolidays() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-holidays'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('admin_holidays').select('*').order('date');
      if (error) throw error;
      return data as { id: string; date: string; name: string; created_at: string }[];
    },
  });

  const add = useMutation({
    mutationFn: async (h: { date: string; name: string }) => {
      const { error } = await (supabase as any).from('admin_holidays').insert(h);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-holidays'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('admin_holidays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-holidays'] }),
  });

  return { holidays: query.data || [], loading: query.isLoading, add, remove };
}

// Radioburger dates
export function useAdminRadioburger() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-radioburger'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('admin_radioburger_dates').select('*').order('date');
      if (error) throw error;
      return data as { id: string; date: string; description: string | null; created_at: string }[];
    },
  });

  const add = useMutation({
    mutationFn: async (h: { date: string; description?: string }) => {
      const { error } = await (supabase as any).from('admin_radioburger_dates').insert(h);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-radioburger'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('admin_radioburger_dates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-radioburger'] }),
  });

  return { dates: query.data || [], loading: query.isLoading, add, remove };
}

// Agenda email recipients
export function useAdminAgendaEmails() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-agenda-emails'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('admin_agenda_emails').select('*').order('name');
      if (error) throw error;
      return data as { id: string; email: string; name: string | null; created_at: string }[];
    },
  });

  const add = useMutation({
    mutationFn: async (h: { email: string; name?: string }) => {
      const { error } = await (supabase as any).from('admin_agenda_emails').insert(h);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-agenda-emails'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('admin_agenda_emails').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-agenda-emails'] }),
  });

  return { emails: query.data || [], loading: query.isLoading, add, remove };
}

// Shared interesting cases (all users can view)
export function useSharedCases() {
  return useQuery({
    queryKey: ['shared-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interesting_cases')
        .select('*')
        .eq('shared_with_team', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
