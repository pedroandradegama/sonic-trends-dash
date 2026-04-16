import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FeatureFlag =
  | 'agenda_preferences'
  | 'agenda_comms'
  | 'repasse'
  | 'nps'
  | 'casuistica'
  | 'correlacao_axial'
  | 'correlacao_anato'
  | 'casos_compartilhados_imag'
  | 'feriados_imag';

export const FEATURE_FLAG_LABELS: Record<FeatureFlag, string> = {
  agenda_preferences: 'Preferências de Agenda',
  agenda_comms: 'Comunicação de Agenda',
  repasse: 'Repasse',
  nps: 'NPS',
  casuistica: 'Casuística',
  correlacao_axial: 'Correlação Axial',
  correlacao_anato: 'Correlação Anatomopatológica',
  casos_compartilhados_imag: 'Casos Compartilhados IMAG',
  feriados_imag: 'Feriados IMAG',
};

export const ALL_FEATURE_FLAGS = Object.keys(FEATURE_FLAG_LABELS) as FeatureFlag[];

export function useFeatureFlags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['user-feature-flags', user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_feature_flags')
        .select('feature, enabled')
        .eq('user_id', user!.id);
      if (error) throw error;
      const set = new Set<string>();
      (data || []).forEach((row: any) => {
        if (row.enabled) set.add(row.feature);
      });
      return set;
    },
  });

  const enabled = data ?? new Set<string>();

  return {
    flags: enabled,
    isLoading,
    isEnabled: (feature: FeatureFlag | string) => enabled.has(feature),
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['user-feature-flags'] }),
  };
}
