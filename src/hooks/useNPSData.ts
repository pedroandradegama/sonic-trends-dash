import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NPSRow {
  nota_real?: number | null;
  prestador_nome?: string | null;
  data_atendimento?: string | null;
  convenio?: string | null;
  [key: string]: any;
}

export function useNPSData() {
  const [data, setData] = useState<NPSRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await (supabase as any)
        .from("NPS")
        .select("nota_real, prestador_nome, data_atendimento, convenio");

      if (error) throw error;
      setData((data as NPSRow[]) || []);
    } catch (err: any) {
      console.error("Erro ao buscar NPS:", err?.message || err);
      setError(err?.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data: data || [], loading, error, refetch: fetchData };
}
