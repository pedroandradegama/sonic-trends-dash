import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RepasseRow {
  "Dt. Atendimento"?: string | null;
  "Produto"?: string | null;
  "Qtde"?: string | null;
  "Convênio"?: string | null;
  "Médico"?: string | null;
  "Vl. Repasse"?: string | null;
  "Porcentagem Repasse"?: string | null;
  [key: string]: any;
}

export function useRepasseData() {
  const [data, setData] = useState<RepasseRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await (supabase as any)
        .from("Repasse")
        .select("*")
        .order('"Dt. Atendimento"', { ascending: false });

      if (error) throw error;
      setData((data as RepasseRow[]) || []);
    } catch (err: any) {
      console.error("Erro ao buscar Repasse:", err?.message || err);
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
