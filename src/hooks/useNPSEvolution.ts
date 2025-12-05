import { useMemo } from 'react';
import { useNPSData } from './useNPSData';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export interface NPSEvolutionData {
  month: string;
  nps: number;
  totalRespostas: number;
  notaMedia: number;
}

export function useNPSEvolution(startDate?: Date, endDate?: Date) {
  const { data: rawData, loading, error } = useNPSData();

  const evolutionData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    // Filtrar por período
    const filteredData = rawData.filter((item) => {
      if (!item.data_atendimento || item.nota_real === null || item.nota_real === undefined) return false;
      
      const itemDate = parseISO(item.data_atendimento);
      
      if (startDate && isBefore(itemDate, startOfDay(startDate))) return false;
      if (endDate && isAfter(itemDate, endOfDay(endDate))) return false;
      
      return true;
    });

    // Agrupar por mês
    const monthMap = new Map<string, { notas: number[], soma: number }>();

    filteredData.forEach((item) => {
      const monthKey = format(parseISO(item.data_atendimento!), 'yyyy-MM');
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { notas: [], soma: 0 });
      }
      
      const monthData = monthMap.get(monthKey)!;
      monthData.notas.push(item.nota_real!);
      monthData.soma += item.nota_real!;
    });

    // Calcular NPS por mês
    const result: NPSEvolutionData[] = [];
    
    monthMap.forEach((data, month) => {
      const totalRespostas = data.notas.length;
      const promotores = data.notas.filter(n => n >= 9).length;
      const detratores = data.notas.filter(n => n <= 6).length;
      
      const percentualPromotores = (promotores / totalRespostas) * 100;
      const percentualDetratores = (detratores / totalRespostas) * 100;
      const nps = percentualPromotores - percentualDetratores;
      const notaMedia = data.soma / totalRespostas;

      result.push({
        month,
        nps,
        totalRespostas,
        notaMedia,
      });
    });

    // Ordenar por mês
    return result.sort((a, b) => a.month.localeCompare(b.month));
  }, [rawData, startDate, endDate]);

  return { data: evolutionData, loading, error };
}
