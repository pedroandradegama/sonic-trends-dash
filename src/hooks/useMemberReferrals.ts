import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MemberReferral {
  id: string;
  referrer_user_id: string;
  referred_name: string;
  referred_email: string;
  referred_phone: string | null;
  referrer_nome: string | null;
  status: string;
  started_at: string | null;
  created_at: string;
}

export function useMemberReferrals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['member-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_referrals' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MemberReferral[];
    },
    enabled: !!user,
  });

  const addReferral = useMutation({
    mutationFn: async (referral: { referred_name: string; referred_email: string; referred_phone?: string; referrer_nome?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('member_referrals' as any)
        .insert({ ...referral, referrer_user_id: user.id } as any);
      if (error) throw error;

      // Notify admin by email
      try {
        await supabase.functions.invoke('send-agenda-email', {
          body: {
            medicoNome: referral.referrer_nome || 'Médico',
            diasAgenda: [{ data: `Indicação: ${referral.referred_name}`, horarioInicio: referral.referred_email, horarioFim: referral.referred_phone || '—' }],
            comentarios: `Nova indicação Member Get Member recebida de ${referral.referrer_nome || 'um médico'}. Indicado: ${referral.referred_name} (${referral.referred_email}).`,
          },
        });
      } catch { /* silent */ }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-referrals'] }),
  });

  return { referrals, isLoading, addReferral };
}
