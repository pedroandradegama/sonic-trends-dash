import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TiradsRule {
  id: string;
  category_group: string;
  option_key: string;
  option_label: string;
  points: number;
}

export interface TiradsThreshold {
  id: string;
  tr_level: string;
  follow_up_min_cm: number | null;
  fna_min_cm: number | null;
  follow_up_schedule: string | null;
  note: string | null;
}

export function useTiradsRules() {
  const [data, setData] = useState<TiradsRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: rules, error } = await supabase
        .from('tirads_rules')
        .select('*')
        .order('category_group')
        .order('points');
      if (error) throw error;
      setData((rules as TiradsRule[]) || []);
    } catch (err) {
      console.error('Erro ao buscar tirads_rules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading };
}

export function useTiradsThresholds() {
  const [data, setData] = useState<TiradsThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: thresholds, error } = await supabase
        .from('tirads_thresholds')
        .select('*')
        .order('tr_level');
      if (error) throw error;
      setData((thresholds as TiradsThreshold[]) || []);
    } catch (err) {
      console.error('Erro ao buscar tirads_thresholds:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading };
}
