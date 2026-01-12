import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMasterAdminCheck() {
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function checkMasterAdmin() {
      if (!user) {
        setIsMasterAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'master_admin')
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar master_admin:', error);
          setIsMasterAdmin(false);
        } else {
          setIsMasterAdmin(!!data);
        }
      } catch (error) {
        console.error('Erro ao verificar master_admin:', error);
        setIsMasterAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkMasterAdmin();
  }, [user]);

  return { isMasterAdmin, loading };
}
