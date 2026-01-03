import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parse, isValid } from 'date-fns';

interface DataPeriod {
  minDate: Date | null;
  maxDate: Date | null;
  loading: boolean;
}

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  try {
    // Try DD/MM/YYYY format first
    if (dateStr.includes('/')) {
      const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) return parsed;
    }
    
    // Try ISO format
    const parsed = new Date(dateStr);
    if (isValid(parsed)) return parsed;
  } catch {
    return null;
  }
  
  return null;
}

export function useRepassePeriod(): DataPeriod {
  const [period, setPeriod] = useState<DataPeriod>({
    minDate: null,
    maxDate: null,
    loading: true,
  });

  useEffect(() => {
    async function fetchPeriod() {
      try {
        const { data, error } = await (supabase as any)
          .from('Repasse')
          .select('"Dt. Atendimento"');

        if (error) throw error;

        if (data && data.length > 0) {
          const dates = data
            .map((row: any) => parseDate(row['Dt. Atendimento']))
            .filter((d: Date | null) => d !== null) as Date[];

          if (dates.length > 0) {
            // Calculate min and max properly
            const timestamps = dates.map(d => d.getTime());
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            
            setPeriod({
              minDate: new Date(minTime),
              maxDate: new Date(maxTime),
              loading: false,
            });
            return;
          }
        }

        setPeriod({ minDate: null, maxDate: null, loading: false });
      } catch (err) {
        console.error('Error fetching Repasse period:', err);
        setPeriod({ minDate: null, maxDate: null, loading: false });
      }
    }

    fetchPeriod();
  }, []);

  return period;
}

export function useCasuisticaPeriod(): DataPeriod {
  const [period, setPeriod] = useState<DataPeriod>({
    minDate: null,
    maxDate: null,
    loading: true,
  });

  useEffect(() => {
    async function fetchPeriod() {
      try {
        const { data, error } = await (supabase as any)
          .from('Casuistica')
          .select('"Data do pedido"');

        if (error) throw error;

        if (data && data.length > 0) {
          const dates = data
            .map((row: any) => parseDate(row['Data do pedido']))
            .filter((d: Date | null) => d !== null) as Date[];

          if (dates.length > 0) {
            // Calculate min and max properly
            const timestamps = dates.map(d => d.getTime());
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            
            setPeriod({
              minDate: new Date(minTime),
              maxDate: new Date(maxTime),
              loading: false,
            });
            return;
          }
        }

        setPeriod({ minDate: null, maxDate: null, loading: false });
      } catch (err) {
        console.error('Error fetching Casuistica period:', err);
        setPeriod({ minDate: null, maxDate: null, loading: false });
      }
    }

    fetchPeriod();
  }, []);

  return period;
}

export function useNPSPeriod(): DataPeriod {
  const [period, setPeriod] = useState<DataPeriod>({
    minDate: null,
    maxDate: null,
    loading: true,
  });

  useEffect(() => {
    async function fetchPeriod() {
      try {
        const { data, error } = await (supabase as any)
          .from('NPS')
          .select('data_atendimento');

        if (error) throw error;

        if (data && data.length > 0) {
          const dates = data
            .map((row: any) => {
              const val = row.data_atendimento;
              if (!val) return null;
              if (typeof val === 'object' && 'getTime' in val) return val as Date;
              if (typeof val === 'string') return parseDate(val);
              return null;
            })
            .filter((d: Date | null) => d !== null) as Date[];

          if (dates.length > 0) {
            // Calculate min and max properly
            const timestamps = dates.map(d => d.getTime());
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            
            setPeriod({
              minDate: new Date(minTime),
              maxDate: new Date(maxTime),
              loading: false,
            });
            return;
          }
        }

        setPeriod({ minDate: null, maxDate: null, loading: false });
      } catch (err) {
        console.error('Error fetching NPS period:', err);
        setPeriod({ minDate: null, maxDate: null, loading: false });
      }
    }

    fetchPeriod();
  }, []);

  return period;
}
