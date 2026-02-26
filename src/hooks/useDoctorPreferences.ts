import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

export interface DoctorPreferences {
  id: string;
  user_id: string;
  scheduling_profile: "combo" | "rotatividade";
  overbooking_enabled: boolean;
  overbooking_percentage: number | null;
  overbooking_time_slot: string | null;
  ambient_music: boolean;
  music_genre: string | null;
  coffee: boolean;
  tea: boolean;
  digest_frequency: string;
  digest_article_limit: number;
  digest_reading_time: number;
  digest_active: boolean;
  digest_next_dispatch: string | null;
  created_at: string;
  updated_at: string;
}

export function useDoctorPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<DoctorPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) fetchPreferences();
    else {
      setPreferences(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("doctor_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setPreferences(data as DoctorPreferences | null);
    } catch (err: any) {
      console.error("Erro ao buscar preferências:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<Omit<DoctorPreferences, "id" | "user_id" | "created_at" | "updated_at">>) => {
    if (!user) return;
    try {
      setIsSaving(true);
      if (preferences) {
        const { error } = await supabase
          .from("doctor_preferences")
          .update(updates)
          .eq("id", preferences.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("doctor_preferences")
          .insert({ user_id: user.id, ...updates });
        if (error) throw error;
      }
      await fetchPreferences();
      toast({ title: "Preferências salvas", description: "Suas preferências foram atualizadas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao salvar preferências:", err);
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar suas preferências.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return { preferences, isLoading, isSaving, savePreferences, refetch: fetchPreferences };
}
