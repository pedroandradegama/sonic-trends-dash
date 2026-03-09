import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LIMITS = { individual: 20, board: 10 } as const;

export type ConsultMode = 'individual' | 'board';

export function useMagiaUsage() {
  const { user } = useAuth();
  const [individualUsed, setIndividualUsed] = useState(0);
  const [boardUsed, setBoardUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('tool_usage_log')
      .select('payload')
      .eq('user_id', user.id)
      .eq('tool_key', 'magia_hd')
      .gte('created_at', startOfMonth);

    if (error) {
      console.error('Erro ao buscar uso:', error);
      setLoading(false);
      return;
    }

    let indCount = 0;
    let boardCount = 0;
    (data || []).forEach((row: any) => {
      const mode = row.payload?.consult_mode;
      if (mode === 'board') boardCount++;
      else indCount++;
    });

    setIndividualUsed(indCount);
    setBoardUsed(boardCount);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const canUse = (mode: ConsultMode) => {
    if (mode === 'individual') return individualUsed < LIMITS.individual;
    return boardUsed < LIMITS.board;
  };

  const remaining = (mode: ConsultMode) => {
    if (mode === 'individual') return LIMITS.individual - individualUsed;
    return LIMITS.board - boardUsed;
  };

  return {
    individualUsed,
    boardUsed,
    loading,
    canUse,
    remaining,
    limits: LIMITS,
    refetch: fetchUsage,
  };
}
