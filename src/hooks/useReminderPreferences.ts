import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "./useUserProfile";
import { useToast } from "./use-toast";

export type ReminderFrequency = "weekly" | "biweekly" | "quarterly";

export interface ReminderPreference {
  id: string;
  user_id: string;
  email: string;
  medico_nome: string;
  frequency: ReminderFrequency;
  preferred_day: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useReminderPreferences = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [preference, setPreference] = useState<ReminderPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreference();
    }
  }, [user]);

  const fetchPreference = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("reminder_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setPreference(data as ReminderPreference | null);
    } catch (error) {
      console.error("Error fetching reminder preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreference = async (
    frequency: ReminderFrequency,
    preferredDay: number | null,
    isActive: boolean
  ) => {
    if (!user || !profile) return;

    try {
      setIsSaving(true);

      if (preference) {
        // Update existing preference
        const { error } = await supabase
          .from("reminder_preferences")
          .update({
            frequency,
            preferred_day: preferredDay,
            is_active: isActive,
          })
          .eq("id", preference.id);

        if (error) throw error;
      } else {
        // Insert new preference
        const { error } = await supabase
          .from("reminder_preferences")
          .insert({
            user_id: user.id,
            email: profile.email,
            medico_nome: profile.medico_nome,
            frequency,
            preferred_day: preferredDay,
            is_active: isActive,
          });

        if (error) throw error;
      }

      await fetchPreference();
      
      toast({
        title: "Preferências salvas",
        description: isActive 
          ? "Você receberá lembretes por email conforme configurado."
          : "Os lembretes foram desativados.",
      });
    } catch (error) {
      console.error("Error saving reminder preferences:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas preferências de lembrete.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deletePreference = async () => {
    if (!preference) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("reminder_preferences")
        .delete()
        .eq("id", preference.id);

      if (error) throw error;

      setPreference(null);
      toast({
        title: "Lembrete removido",
        description: "Suas preferências de lembrete foram removidas.",
      });
    } catch (error) {
      console.error("Error deleting reminder preferences:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover suas preferências de lembrete.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    preference,
    isLoading,
    isSaving,
    savePreference,
    deletePreference,
    refetch: fetchPreference,
  };
};
