import { useMemo } from "react";
import { useNPSData } from "./useNPSData";

export interface MedicoNPS {
  medico: string;
  nps: number;
  totalRespostas: number;
  promotores: number;
  neutros: number;
  detratores: number;
  percentualPromotores: number;
  percentualDetratores: number;
  notaMedia: number;
}

export function useNPSByMedico(startDate?: Date, endDate?: Date) {
  const { data, loading, error } = useNPSData();

  const medicoNPSData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filtrar por data se fornecido
    let filteredData = data;
    if (startDate || endDate) {
      filteredData = data.filter((row) => {
        if (!row.data_atendimento) return false;
        const dataAtendimento = new Date(row.data_atendimento);
        if (startDate && dataAtendimento < startDate) return false;
        if (endDate && dataAtendimento > endDate) return false;
        return true;
      });
    }

    // Agrupar por médico
    const medicoMap = new Map<string, { notas: number[]; medico: string }>();

    filteredData.forEach((row) => {
      const medico = row.prestador_nome || "Sem médico";
      const nota = row.nota_real;

      if (nota !== null && nota !== undefined && !isNaN(nota)) {
        if (!medicoMap.has(medico)) {
          medicoMap.set(medico, { notas: [], medico });
        }
        medicoMap.get(medico)!.notas.push(nota);
      }
    });

    // Calcular NPS para cada médico
    const results: MedicoNPS[] = [];

    medicoMap.forEach(({ notas, medico }) => {
      const totalRespostas = notas.length;
      const promotores = notas.filter((n) => n >= 9).length;
      const neutros = notas.filter((n) => n >= 7 && n <= 8).length;
      const detratores = notas.filter((n) => n <= 6).length;

      const percentualPromotores = (promotores / totalRespostas) * 100;
      const percentualDetratores = (detratores / totalRespostas) * 100;
      const nps = Math.round(percentualPromotores - percentualDetratores);
      const notaMedia = notas.reduce((sum, n) => sum + n, 0) / totalRespostas;

      results.push({
        medico,
        nps,
        totalRespostas,
        promotores,
        neutros,
        detratores,
        percentualPromotores: Math.round(percentualPromotores * 10) / 10,
        percentualDetratores: Math.round(percentualDetratores * 10) / 10,
        notaMedia: Math.round(notaMedia * 10) / 10,
      });
    });

    // Ordenar por NPS (maior primeiro)
    return results.sort((a, b) => b.nps - a.nps);
  }, [data, startDate, endDate]);

  return { data: medicoNPSData, loading, error };
}
