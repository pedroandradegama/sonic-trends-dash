import { useMemo } from "react";
import { useCasuisticaData } from "./useCasuisticaData";

function normalize(str?: string | null) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

function toLowerNoAccent(str: string) {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase();
}

export interface IMAGBiradsReference {
  mamografia: Record<string, number>;
  ultrassom: Record<string, number>;
  loading: boolean;
}

export function useIMAGBiradsReference(): IMAGBiradsReference {
  const { data, loading } = useCasuisticaData();

  const references = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        mamografia: { 'BI-RADS 0': 0, 'BI-RADS 1': 0, 'BI-RADS 2': 0, 'BI-RADS 3': 0, 'BI-RADS 4': 0, 'BI-RADS 5': 0 },
        ultrassom: { 'BI-RADS 0': 0, 'BI-RADS 1': 0, 'BI-RADS 2': 0, 'BI-RADS 3': 0, 'BI-RADS 4': 0, 'BI-RADS 5': 0 },
      };
    }

    const regex = /bi\s*[-\s]?rads\s*([0-5])/i;

    // Processa mamografia
    const mamografiaRows = data.filter(r => {
      const sg = toLowerNoAccent(normalize(r['Subgrupo'] || ''));
      return sg.includes('mamog');
    });

    const mamoCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<string, number>;
    let mamoTotal = 0;

    for (const r of mamografiaRows) {
      const c = r['Comentário'] || '';
      const m = String(c).match(regex);
      if (m && m[1]) {
        const k = m[1] as '0'|'1'|'2'|'3'|'4'|'5';
        mamoCounts[k] += 1;
        mamoTotal += 1;
      }
    }

    // Processa ultrassom de mama
    const ultrassomRows = data.filter(r => {
      const sg = toLowerNoAccent(normalize(r['Subgrupo'] || ''));
      const comment = toLowerNoAccent(normalize(r['Comentário'] || ''));
      return sg.includes('ultra') && (sg.includes('mama') || comment.match(/bi\s*[-\s]?rads/i));
    });

    const usgCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<string, number>;
    let usgTotal = 0;

    for (const r of ultrassomRows) {
      const c = r['Comentário'] || '';
      const m = String(c).match(regex);
      if (m && m[1]) {
        const k = m[1] as '0'|'1'|'2'|'3'|'4'|'5';
        usgCounts[k] += 1;
        usgTotal += 1;
      }
    }

    // Calcula percentuais
    const cats = ['0', '1', '2', '3', '4', '5'] as const;
    
    const mamografia: Record<string, number> = {};
    const ultrassom: Record<string, number> = {};

    for (const k of cats) {
      mamografia[`BI-RADS ${k}`] = mamoTotal > 0 
        ? Math.round((mamoCounts[k] / mamoTotal) * 1000) / 10 
        : 0;
      ultrassom[`BI-RADS ${k}`] = usgTotal > 0 
        ? Math.round((usgCounts[k] / usgTotal) * 1000) / 10 
        : 0;
    }

    return { mamografia, ultrassom };
  }, [data]);

  return {
    ...references,
    loading,
  };
}
