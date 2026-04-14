import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaskOccurrence {
  id: string;
  task_id: string;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  reminded_at: string | null;
}

export function useTaskOccurrences(taskId: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["task_occurrences", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await (supabase as any)
        .from("task_occurrences")
        .select("*")
        .eq("task_id", taskId)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return (data as TaskOccurrence[]) || [];
    },
    enabled: !!taskId,
  });

  return { data: data || [], isLoading };
}
