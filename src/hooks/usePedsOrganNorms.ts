import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganNorm {
  id: string;
  organ_key: string;
  age_min_mo: number;
  age_max_mo: number;
  mean_mm: number | null;
  sd_mm: number | null;
  min_mm: number | null;
  max_mm: number | null;
  p5_mm: number;
  p95_mm: number;
  low_suggested_mm: number;
  up_suggested_mm: number;
  source: string;
  table_ref: string;
}

export function usePedsOrganNorms() {
  return useQuery({
    queryKey: ['peds-organ-norms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peds_us_organ_norms')
        .select('*')
        .order('organ_key')
        .order('age_min_mo');
      
      if (error) throw error;
      return data as OrganNorm[];
    },
  });
}
