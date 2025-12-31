import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parse, isValid, isAfter } from "date-fns";

export interface ExameRow {
  [key: string]: any;
  Exame?: string | null;
  Paciente?: string | null;
  Prontuário?: number | null;
  "Dt. Pedido"?: string | null;
  "Médico executante"?: string | null;
  Laudo?: number | null;
  Pedido?: number | null;
}

export interface CorrelacaoItem {
  paciente: string;
  prontuario: number;
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
  
  const trimmed = dateStr.trim();
  
  try {
    // Handle d/M/yyyy or dd/MM/yyyy format (flexible day/month without leading zeros)
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
          const date = new Date(year, month, day, 12, 0, 0); // Use noon to avoid timezone issues
          if (isValid(date)) return date;
        }
      }
    }
    
    // Try ISO format
    const parsed = new Date(trimmed);
    if (isValid(parsed)) return parsed;
  } catch {
    return null;
  }
  
  return null;
}

function normalize(str?: string | null): string {
  if (!str) return '';
  // Normalize: trim, collapse spaces, uppercase, and remove accents for better matching
  return String(str)
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics/accents
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
      
      // Fetch all exams - need to handle Supabase's default 1000 row limit
      const { data: exames, error: err } = await supabase
        .from("Exames")
        .select("Exame, Paciente, Prontuário, \"Dt. Pedido\", \"Médico executante\", Laudo, Pedido")
        .limit(10000);

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
      console.log('[CorrelacaoAxial] Sem dados ou médico:', { medicoNome, dataLength: data.length });
      return [];
    }

    const normalizedMedicoNome = normalize(medicoNome);
    console.log('[CorrelacaoAxial] Buscando correlações para:', normalizedMedicoNome);

    // 1. Filter USG exams performed by the logged-in doctor (using Prontuário as unique patient ID)
    const usgExames = data.filter((exame) => {
      const exameName = normalize(exame.Exame || '');
      const medicoExecutante = normalize(exame["Médico executante"] || '');
      const isUSG = exameName.startsWith('USG');
      const isMedico = medicoExecutante.includes(normalizedMedicoNome);
      return isUSG && isMedico && exame.Prontuário;
    });

    console.log('[CorrelacaoAxial] Total USG exames do médico:', usgExames.length);

    // 2. Create a map of Prontuário -> USG exam info
    const pacientesUSG = new Map<number, { exame: ExameRow; data: Date }[]>();
    
    for (const usg of usgExames) {
      const prontuario = usg.Prontuário;
      const usgDate = parseDate(usg["Dt. Pedido"]);
      
      if (!prontuario || !usgDate) continue;
      
      if (!pacientesUSG.has(prontuario)) {
        pacientesUSG.set(prontuario, []);
      }
      pacientesUSG.get(prontuario)!.push({ exame: usg, data: usgDate });
    }

    console.log('[CorrelacaoAxial] Pacientes com USG (por Prontuário):', pacientesUSG.size);
    console.log('[CorrelacaoAxial] Lista de Prontuários USG:', Array.from(pacientesUSG.keys()).slice(0, 10));

    // 3. Find RM and TC exams for these patients after their USG dates
    const results: CorrelacaoItem[] = [];
    
    // Find all RM/TC exams that have a Prontuário
    const rmTcExames = data.filter((exame) => {
      const exameName = normalize(exame.Exame || '');
      const isRM = exameName.startsWith('RM') || exameName.includes('RESSONANCIA') || exameName.includes('RESONANCIA');
      const isTC = exameName.startsWith('TC') || exameName.includes('TOMOGRAFIA');
      return (isRM || isTC) && exame.Prontuário;
    });

    console.log('[CorrelacaoAxial] Total RM/TC exames:', rmTcExames.length);
    console.log('[CorrelacaoAxial] Amostra Prontuários RM/TC:', rmTcExames.slice(0, 10).map(e => e.Prontuário));
    
    let matchCount = 0;
    
    for (const exame of rmTcExames) {
      const prontuario = exame.Prontuário;
      if (!prontuario) continue;
      
      const exameDate = parseDate(exame["Dt. Pedido"]);
      if (!exameDate) continue;
      
      // Check if this patient (by Prontuário) had a USG before this exam
      const usgList = pacientesUSG.get(prontuario);
      if (!usgList) continue;
      
      matchCount++;
      
      const exameName = normalize(exame.Exame || '');
      const isRM = exameName.startsWith('RM') || exameName.includes('RESSONANCIA') || exameName.includes('RESONANCIA');
      
      // Find USG exams that happened before this RM/TC
      for (const usgItem of usgList) {
        const rmTcTime = exameDate.getTime();
        const usgTime = usgItem.data.getTime();
        const isAfterUSG = rmTcTime > usgTime;
        
        if (isAfterUSG) {
          const diasDiferenca = Math.floor((rmTcTime - usgTime) / (1000 * 60 * 60 * 24));
          
          results.push({
            paciente: exame.Paciente || '',
            prontuario,
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

    console.log('[CorrelacaoAxial] Total matches (por Prontuário):', matchCount);
    console.log('[CorrelacaoAxial] Total correlações encontradas:', results.length);

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
