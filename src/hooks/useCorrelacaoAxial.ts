import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parse, isValid, isAfter } from "date-fns";

export interface ExameRow {
  [key: string]: any;
  Exame?: string | null;
  Paciente?: string | null;
  "Dt. Pedido"?: string | null;
  "Médico executante"?: string | null;
  Laudo?: number | null;
  Pedido?: number | null;
}

export interface CorrelacaoItem {
  paciente: string;
  usgExame: string;
  usgData: Date;
  usgMedico: string;
  axialExame: string;
  axialData: Date;
  axialTipo: 'RM' | 'TC';
  diasDiferenca: number;
}

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  try {
    // Handle d/M/yyyy or dd/MM/yyyy format (flexible day/month without leading zeros)
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const date = new Date(year, month, day);
          if (isValid(date)) return date;
        }
      }
    }
    
    // Try ISO format
    const parsed = new Date(dateStr);
    if (isValid(parsed)) return parsed;
  } catch {
    return null;
  }
  
  return null;
}

function normalize(str?: string | null): string {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ').toUpperCase();
}

export function useCorrelacaoAxial(medicoNome: string | null) {
  const [data, setData] = useState<ExameRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!medicoNome) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data: exames, error: err } = await supabase
        .from("Exames")
        .select("*");

      if (err) throw err;
      setData((exames as ExameRow[]) || []);
    } catch (err: any) {
      console.error("Erro ao buscar Exames:", err?.message || err);
      setError(err?.message || "Erro ao carregar dados de exames");
    } finally {
      setLoading(false);
    }
  }, [medicoNome]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process the correlation data
  const correlacoes = useMemo((): CorrelacaoItem[] => {
    if (!medicoNome || data.length === 0) {
      console.log('[CorrelacaoAxial] Sem dados ou medicoNome:', { medicoNome, dataLength: data.length });
      return [];
    }

    const normalizedMedicoNome = normalize(medicoNome);
    console.log('[CorrelacaoAxial] Processando para médico:', normalizedMedicoNome);

    // 1. Filter USG exams performed by the logged-in doctor
    const usgExames = data.filter((exame) => {
      const exameName = normalize(exame.Exame || '');
      const medicoExecutante = normalize(exame["Médico executante"] || '');
      return exameName.startsWith('USG') && medicoExecutante.includes(normalizedMedicoNome);
    });

    console.log('[CorrelacaoAxial] USG exames encontrados:', usgExames.length);

    // 2. Create a map of patients who had USG exams
    const pacientesUSG = new Map<string, { exame: ExameRow; data: Date }[]>();
    
    for (const usg of usgExames) {
      const pacienteNome = normalize(usg.Paciente || '');
      const usgDate = parseDate(usg["Dt. Pedido"]);
      
      if (!pacienteNome || !usgDate) continue;
      
      if (!pacientesUSG.has(pacienteNome)) {
        pacientesUSG.set(pacienteNome, []);
      }
      pacientesUSG.get(pacienteNome)!.push({ exame: usg, data: usgDate });
    }

    console.log('[CorrelacaoAxial] Pacientes únicos com USG:', pacientesUSG.size);

    // 3. Find RM and TC exams for these patients after their USG dates
    const results: CorrelacaoItem[] = [];
    
    // First, find all RM/TC exams in the data
    const rmTcExames = data.filter((exame) => {
      const exameName = normalize(exame.Exame || '');
      const isRM = exameName.startsWith('RM') || exameName.includes('RESSONANCIA') || exameName.includes('RESONANCIA');
      const isTC = exameName.startsWith('TC') || exameName.includes('TOMOGRAFIA');
      return isRM || isTC;
    });
    
    console.log('[CorrelacaoAxial] Total RM/TC exames na base:', rmTcExames.length);
    
    for (const exame of rmTcExames) {
      const exameName = normalize(exame.Exame || '');
      const pacienteNome = normalize(exame.Paciente || '');
      const exameDate = parseDate(exame["Dt. Pedido"]);
      
      if (!pacienteNome || !exameDate) continue;
      
      // Check if it's an RM or TC exam
      const isRM = exameName.startsWith('RM') || exameName.includes('RESSONANCIA') || exameName.includes('RESONANCIA');
      
      // Check if this patient had a USG before this exam
      const usgList = pacientesUSG.get(pacienteNome);
      if (!usgList) continue;
      
      console.log('[CorrelacaoAxial] Paciente com RM/TC que teve USG:', pacienteNome);
      
      // Find USG exams that happened before this RM/TC
      for (const usgItem of usgList) {
        if (isAfter(exameDate, usgItem.data)) {
          const diasDiferenca = Math.floor(
            (exameDate.getTime() - usgItem.data.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          results.push({
            paciente: exame.Paciente || '',
            usgExame: usgItem.exame.Exame || '',
            usgData: usgItem.data,
            usgMedico: usgItem.exame["Médico executante"] || '',
            axialExame: exame.Exame || '',
            axialData: exameDate,
            axialTipo: isRM ? 'RM' : 'TC',
            diasDiferenca,
          });
        }
      }
    }

    console.log('[CorrelacaoAxial] Correlações encontradas:', results.length);

    // Sort by most recent axial exam first
    return results.sort((a, b) => b.axialData.getTime() - a.axialData.getTime());
  }, [data, medicoNome]);

  // Statistics
  const stats = useMemo(() => {
    const totalUSGPacientes = new Set(
      correlacoes.map(c => c.paciente)
    ).size;
    
    const totalRM = correlacoes.filter(c => c.axialTipo === 'RM').length;
    const totalTC = correlacoes.filter(c => c.axialTipo === 'TC').length;
    
    const avgDias = correlacoes.length > 0
      ? Math.round(correlacoes.reduce((sum, c) => sum + c.diasDiferenca, 0) / correlacoes.length)
      : 0;

    return {
      totalPacientes: totalUSGPacientes,
      totalCorrelacoes: correlacoes.length,
      totalRM,
      totalTC,
      avgDiasAteAxial: avgDias,
    };
  }, [correlacoes]);

  return { 
    correlacoes, 
    stats,
    loading, 
    error, 
    refetch: fetchData 
  };
}
