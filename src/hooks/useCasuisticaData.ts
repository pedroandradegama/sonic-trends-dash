import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CasuisticaRow {
  [key: string]: any;
  "Médico Executante"?: string | null;
  "Comentário"?: string | null;
  "Subgrupo"?: string | null;
  "Produto"?: string | null;
  "Paciente"?: string | null;
  "Data do pedido"?: string | null;
}

export function useCasuisticaData() {
  const { clinicId } = useAuth();
  const [data, setData] = useState<CasuisticaRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = (supabase as any)
        .from("Casuistica")
        .select("*");

      if (clinicId) {
        query = query.eq("clinic_id", clinicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setData((data as CasuisticaRow[]) || []);
    } catch (err: any) {
      console.error("Erro ao buscar Casuística:", err?.message || err);
      setError(err?.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const doctors = [
    "todos",
    ...Array.from(
      new Set(
        (data || [])
          .map((r) => r["Médico Executante"]) // nomes
          .filter((v): v is string => !!v && String(v).trim().length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR")),
  ];

  const subgrupos = [
    "todos",
    ...Array.from(
      new Set(
        (data || [])
          .map((r) => r["Subgrupo"]) // métodos
          .filter((v): v is string => !!v && String(v).trim().length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR")),
  ];

  return { data: data || [], loading, error, doctors, subgrupos, refetch: fetchData };
}
