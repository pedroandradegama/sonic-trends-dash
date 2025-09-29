import { useMemo } from "react";
import { useRepasseData } from "./useRepasseData";
import { useNPSData } from "./useNPSData";
import { useCasuisticaData } from "./useCasuisticaData";
import { parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";

export interface DashboardFilters {
  startDate?: Date;
  endDate?: Date;
  exames?: string[];
  convenios?: string[];
  medicoNome?: string;
}

export interface DashboardKPIs {
  totalExames: number;
  totalExamesVariation: number;
  repasseTotal: number;
  repasseTotalVariation: number;
  ticketMedio: number;
  npsMedia: number;
  npsPercentual: number;
  percentualParticular: number;
  percentualConvenio: number;
  percentualParticularRepasse: number;
  percentualConvenioRepasse: number;
}

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  try {
    // Try DD/MM/YYYY format first
    if (dateStr.includes('/')) {
      return parse(dateStr, 'd/M/yyyy', new Date());
    }
    // Try ISO format
    return new Date(dateStr);
  } catch {
    return null;
  }
}

function parseNumericValue(value?: string | null): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

export function useIntegratedDashboard(filters: DashboardFilters = {}) {
  const { data: repasseData, loading: repasseLoading, error: repasseError } = useRepasseData();
  const { data: npsData, loading: npsLoading, error: npsError } = useNPSData();
  const { data: casuisticaData, loading: casuisticaLoading } = useCasuisticaData();

  const loading = repasseLoading || npsLoading || casuisticaLoading;
  const error = repasseError || npsError;

  // Filter data based on filters
  const filteredRepasse = useMemo(() => {
    let filtered = repasseData;

    // Filter by medico
    if (filters.medicoNome) {
      filtered = filtered.filter(row => row["Médico"] === filters.medicoNome);
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(row => {
        const rowDate = parseDate(row["Dt. Atendimento"]);
        if (!rowDate) return false;

        if (filters.startDate && filters.endDate) {
          return isWithinInterval(rowDate, {
            start: startOfDay(filters.startDate),
            end: endOfDay(filters.endDate)
          });
        }
        if (filters.startDate) {
          return rowDate >= startOfDay(filters.startDate);
        }
        if (filters.endDate) {
          return rowDate <= endOfDay(filters.endDate);
        }
        return true;
      });
    }

    // Filter by exames
    if (filters.exames && filters.exames.length > 0) {
      filtered = filtered.filter(row => 
        row["Produto"] && filters.exames?.includes(row["Produto"])
      );
    }

    // Filter by convenios
    if (filters.convenios && filters.convenios.length > 0) {
      filtered = filtered.filter(row => 
        row["Convênio"] && filters.convenios?.includes(row["Convênio"])
      );
    }

    return filtered;
  }, [repasseData, filters]);

  const filteredNPS = useMemo(() => {
    let filtered = npsData;

    if (filters.medicoNome) {
      filtered = filtered.filter(row => row.prestador_nome === filters.medicoNome);
    }

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(row => {
        const rowDate = parseDate(row.data_atendimento);
        if (!rowDate) return false;

        if (filters.startDate && filters.endDate) {
          return isWithinInterval(rowDate, {
            start: startOfDay(filters.startDate),
            end: endOfDay(filters.endDate)
          });
        }
        if (filters.startDate) {
          return rowDate >= startOfDay(filters.startDate);
        }
        if (filters.endDate) {
          return rowDate <= endOfDay(filters.endDate);
        }
        return true;
      });
    }

    return filtered;
  }, [npsData, filters]);

  // Calculate KPIs
  const kpis: DashboardKPIs = useMemo(() => {
    // Total exames
    const totalExames = filteredRepasse.reduce((sum, row) => 
      sum + parseNumericValue(row["Qtde"]), 0
    );

    // Repasse total
    const repasseTotal = filteredRepasse.reduce((sum, row) => 
      sum + parseNumericValue(row["Vl. Repasse"]), 0
    );

    // Ticket médio
    const ticketMedio = totalExames > 0 ? repasseTotal / totalExames : 0;

    // NPS calculations
    const npsScores = filteredNPS
      .map(row => row.nota_real)
      .filter((nota): nota is number => typeof nota === 'number' && nota >= 0 && nota <= 10);

    const npsMedia = npsScores.length > 0
      ? npsScores.reduce((sum, nota) => sum + nota, 0) / npsScores.length
      : 0;

    const promotores = npsScores.filter(nota => nota >= 9).length;
    const detratores = npsScores.filter(nota => nota <= 6).length;
    const npsPercentual = npsScores.length > 0
      ? ((promotores - detratores) / npsScores.length) * 100
      : 0;

    // Particular vs Convênio
    const particular = filteredRepasse.filter(row => 
      row["Convênio"]?.toLowerCase().includes("particular")
    );
    const convenio = filteredRepasse.filter(row => 
      !row["Convênio"]?.toLowerCase().includes("particular")
    );

    const examesParticular = particular.reduce((sum, row) => 
      sum + parseNumericValue(row["Qtde"]), 0
    );
    const examesConvenio = convenio.reduce((sum, row) => 
      sum + parseNumericValue(row["Qtde"]), 0
    );

    const repasseParticular = particular.reduce((sum, row) => 
      sum + parseNumericValue(row["Vl. Repasse"]), 0
    );
    const repasseConvenio = convenio.reduce((sum, row) => 
      sum + parseNumericValue(row["Vl. Repasse"]), 0
    );

    const percentualParticular = totalExames > 0 
      ? (examesParticular / totalExames) * 100 
      : 0;
    const percentualConvenio = totalExames > 0 
      ? (examesConvenio / totalExames) * 100 
      : 0;

    const percentualParticularRepasse = repasseTotal > 0 
      ? (repasseParticular / repasseTotal) * 100 
      : 0;
    const percentualConvenioRepasse = repasseTotal > 0 
      ? (repasseConvenio / repasseTotal) * 100 
      : 0;

    return {
      totalExames,
      totalExamesVariation: 0, // TODO: Calculate vs previous period
      repasseTotal,
      repasseTotalVariation: 0, // TODO: Calculate vs previous period
      ticketMedio,
      npsMedia,
      npsPercentual,
      percentualParticular,
      percentualConvenio,
      percentualParticularRepasse,
      percentualConvenioRepasse,
    };
  }, [filteredRepasse, filteredNPS]);

  // Get available filter options
  const availableExames = useMemo(() => 
    Array.from(new Set(repasseData.map(row => row["Produto"]).filter(Boolean) as string[])).sort(),
    [repasseData]
  );

  const availableConvenios = useMemo(() => 
    Array.from(new Set(repasseData.map(row => row["Convênio"]).filter(Boolean) as string[])).sort(),
    [repasseData]
  );

  return {
    loading,
    error,
    kpis,
    repasseData: filteredRepasse,
    npsData: filteredNPS,
    casuisticaData,
    availableExames,
    availableConvenios,
  };
}
