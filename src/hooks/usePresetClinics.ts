import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PresetClinic {
  id: string;
  name: string;
  short_name?: string;
  address: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  place_id?: string;
  logo_url?: string;
}

export function usePresetClinics() {
  return useQuery({
    queryKey: ['fn_preset_clinics'],
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<PresetClinic[]> => {
      const { data, error } = await (supabase as any)
        .from('fn_preset_clinics')
        .select('id, name, short_name, address, city, state, lat, lng, place_id, logo_url')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as PresetClinic[];
    },
  });
}
