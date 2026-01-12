import { useMemo } from 'react';
import { useNPSData } from './useNPSData';
import { parse } from 'date-fns';

export interface ConvenioNPS {
  convenio: string;
  nps: number;
  totalRespostas: number;
  promotores: number;
  neutros: number;
  detratores: number;
  percentualPromotores: number;
  percentualNeutros: number;
  percentualDetratores: number;
  notaMedia: number;
}

export function useNPSByConvenio(startDate?: Date, endDate?: Date, medicoNome?: string) {
  const { data, loading, error } = useNPSData();

  const convenioNPSData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filtrar por médico se fornecido
    let filteredData = data;
    if (medicoNome) {
      filteredData = filteredData.filter((row) => row.prestador_nome === medicoNome);
    }

    // Filtrar por data se fornecido
    if (startDate || endDate) {
      filteredData = data.filter((row) => {
        const dateValue = row.data_atendimento;
        if (!dateValue) return false;
        
        let rowDate: Date | null = null;
        
        if (typeof dateValue === 'string') {
          const dateStr = dateValue.trim();
          if (dateStr.includes('/')) {
            try {
              rowDate = parse(dateStr, 'dd/MM/yyyy', new Date());
            } catch {
              return false;
            }
          } else {
            rowDate = new Date(dateStr);
          }
        } else if (typeof dateValue === 'object' && dateValue !== null) {
          // Assumir que é Date
          rowDate = dateValue as Date;
        }

        if (!rowDate || isNaN(rowDate.getTime())) return false;
        
        if (startDate && rowDate < startDate) return false;
        if (endDate && rowDate > endDate) return false;
        
        return true;
      });
    }

    // Agrupar por convênio
    const convenioMap = new Map<string, number[]>();

    filteredData.forEach((row) => {
      const nota = row.nota_real;
      const convenio = row.convenio?.trim() || 'Sem Convênio';

      if (nota !== null && nota !== undefined && nota >= 0 && nota <= 10) {
        if (!convenioMap.has(convenio)) {
          convenioMap.set(convenio, []);
        }
        convenioMap.get(convenio)!.push(nota);
      }
    });

    // Calcular métricas por convênio
    const result: ConvenioNPS[] = [];

    convenioMap.forEach((notas, convenio) => {
      const totalRespostas = notas.length;
      const promotores = notas.filter((n) => n >= 9).length;
      const neutros = notas.filter((n) => n >= 7 && n < 9).length;
      const detratores = notas.filter((n) => n < 7).length;

      const percentualPromotores = (promotores / totalRespostas) * 100;
      const percentualDetratores = (detratores / totalRespostas) * 100;
      const percentualNeutros = (neutros / totalRespostas) * 100;

      const nps = percentualPromotores - percentualDetratores;
      const notaMedia = notas.reduce((sum, n) => sum + n, 0) / totalRespostas;

      result.push({
        convenio,
        nps,
        totalRespostas,
        promotores,
        neutros,
        detratores,
        percentualPromotores,
        percentualNeutros,
        percentualDetratores,
        notaMedia,
      });
    });

    // Ordenar por NPS decrescente
    return result.sort((a, b) => b.nps - a.nps);
  }, [data, startDate, endDate, medicoNome]);

  return { data: convenioNPSData, loading, error };
}
