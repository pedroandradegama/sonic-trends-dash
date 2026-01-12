import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMasterAdminCheck } from './useMasterAdminCheck';

interface Doctor {
  user_id: string;
  email: string;
  medico_nome: string;
}

export function useDoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { isMasterAdmin, loading: masterAdminLoading } = useMasterAdminCheck();

  useEffect(() => {
    async function fetchDoctors() {
      if (masterAdminLoading) return;
      
      if (!isMasterAdmin) {
        setDoctors([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, email, medico_nome')
          .order('medico_nome');

        if (error) {
          console.error('Erro ao buscar médicos:', error);
          setDoctors([]);
        } else {
          setDoctors(data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar lista de médicos:', error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [isMasterAdmin, masterAdminLoading]);

  return { doctors, loading: loading || masterAdminLoading, isMasterAdmin };
}
