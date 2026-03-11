import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RadioburgerSuggestion {
  id: string;
  user_id: string;
  suggestion_text: string;
  status: string;
  created_at: string;
}

export function useRadioburgerSuggestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['radioburger-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radioburger_suggestions' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RadioburgerSuggestion[];
    },
    enabled: !!user,
  });

  const addSuggestion = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('radioburger_suggestions' as any)
        .insert({ user_id: user.id, suggestion_text: text } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radioburger-suggestions'] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('radioburger_suggestions' as any)
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radioburger-suggestions'] }),
  });

  return { suggestions, isLoading, addSuggestion, updateStatus };
}
