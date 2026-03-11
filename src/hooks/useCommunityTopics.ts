import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommunityTopic {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export function useCommunityTopics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['community-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_topics' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CommunityTopic[];
    },
    enabled: !!user,
  });

  const addTopic = useMutation({
    mutationFn: async (topic: { title: string; description?: string; url?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('community_topics' as any)
        .insert({ ...topic, created_by: user.id } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-topics'] }),
  });

  const removeTopic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('community_topics' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-topics'] }),
  });

  return { topics, isLoading, addTopic, removeTopic };
}
