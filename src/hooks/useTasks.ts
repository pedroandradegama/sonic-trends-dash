import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Task {
  id: string;
  medico_id: string | null;
  title: string;
  description: string | null;
  category: string;
  is_recurring: boolean;
  recurrence_rule: any;
  parent_task_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  snoozed_until: string | null;
  reminder_config: any;
  status: string;
  created_via: string;
  created_at: string;
  updated_at: string;
}

export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("tasks")
        .select("*")
        .eq("medico_id", user.id)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data as Task[]) || [];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data, error } = await (supabase as any)
        .from("tasks")
        .insert({ ...task, medico_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("tasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return {
    data: data || [],
    isLoading,
    create: createTask.mutateAsync,
    update: updateTask.mutateAsync,
    complete: completeTask.mutateAsync,
    delete: deleteTask.mutateAsync,
  };
}
