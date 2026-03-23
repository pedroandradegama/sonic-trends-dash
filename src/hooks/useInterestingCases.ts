import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InterestingCase {
  id: string;
  user_id: string;
  patient_name: string;
  exam_date: string;
  diagnostic_hypothesis: string | null;
  wants_followup: boolean;
  followup_days: number | null;
  shared_with_team: boolean;
  request_opinion: boolean;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export function useInterestingCases() {
  const [cases, setCases] = useState<InterestingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('interesting_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar casos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const addCase = async (newCase: {
    patient_name: string;
    exam_date: string;
    diagnostic_hypothesis?: string;
    wants_followup: boolean;
    followup_days?: number;
    shared_with_team?: boolean;
    request_opinion?: boolean;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase.from('interesting_cases').insert([{
      user_id: user.id,
      patient_name: newCase.patient_name,
      exam_date: newCase.exam_date,
      diagnostic_hypothesis: newCase.diagnostic_hypothesis || null,
      wants_followup: newCase.wants_followup,
      followup_days: newCase.wants_followup ? newCase.followup_days : null,
      shared_with_team: newCase.shared_with_team || false,
      request_opinion: newCase.request_opinion || false,
    }]);

    if (error) throw error;
    await fetchCases();
  };

  const deleteCase = async (id: string) => {
    const { error } = await supabase
      .from('interesting_cases')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchCases();
  };

  return { cases, loading, error, addCase, deleteCase, refetch: fetchCases };
}
