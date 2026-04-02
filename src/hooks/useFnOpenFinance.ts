import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface BankConnection {
  id: string;
  pluggy_item_id: string;
  connector_name: string;
  account_type: string;
  label?: string;
  is_pj: boolean;
  status: 'UPDATED' | 'UPDATING' | 'LOGIN_ERROR' | 'OUTDATED';
  last_synced_at?: string;
}

export interface FnTransaction {
  id: string;
  connection_id: string;
  description: string;
  amount: number;
  date: string;
  status: 'POSTED' | 'PENDING';
  category?: string;
  merchant_name?: string;
  merchant_cnpj?: string;
  is_credit_card: boolean;
  installment_number?: number;
  total_installments?: number;
  total_amount?: number;
  bill_id?: string;
  is_pj_expense?: boolean;
  fn_service_id?: string;
  custom_category?: string;
  detected_as_income: boolean;
  matched_service_id?: string;
}

export interface SpendingSummary {
  month: string;
  total_spending: number;
  total_income: number;
  savings_rate?: number;
  by_category: Record<string, number>;
  pj_expenses: number;
  credit_card_total: number;
}

const KEYS = {
  connections: (uid: string) => ['fn_connections', uid],
  transactions: (uid: string, month?: string) => ['fn_transactions', uid, month ?? 'all'],
  summaries: (uid: string) => ['fn_summaries', uid],
};

export function useFnOpenFinance() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id ?? '';
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEYS.connections(uid) });
    qc.invalidateQueries({ queryKey: KEYS.transactions(uid) });
    qc.invalidateQueries({ queryKey: KEYS.summaries(uid) });
  };

  const { data: connections = [], isLoading: loadingConns } = useQuery({
    queryKey: KEYS.connections(uid),
    enabled: !!uid,
    queryFn: async (): Promise<BankConnection[]> => {
      const { data, error } = await (supabase as any)
        .from('fn_bank_connections')
        .select('*')
        .eq('user_id', uid)
        .order('created_at');
      if (error) throw error;
      return data as BankConnection[];
    },
  });

  const { data: transactions = [], isLoading: loadingTxs } = useQuery({
    queryKey: KEYS.transactions(uid),
    enabled: !!uid,
    queryFn: async (): Promise<FnTransaction[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data, error } = await (supabase as any)
        .from('fn_transactions')
        .select('*')
        .eq('user_id', uid)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: false });
      if (error) throw error;
      return data as FnTransaction[];
    },
  });

  const { data: summaries = [] } = useQuery({
    queryKey: KEYS.summaries(uid),
    enabled: !!uid,
    queryFn: async (): Promise<SpendingSummary[]> => {
      const { data } = await (supabase as any)
        .from('fn_spending_summaries')
        .select('*')
        .eq('user_id', uid)
        .order('month', { ascending: false })
        .limit(12);
      return (data ?? []) as SpendingSummary[];
    },
  });

  const getConnectToken = async (itemId?: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fn-pluggy-connect-token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemId ? { itemId } : {}),
      }
    );
    const data = await res.json();
    if (!data.accessToken) throw new Error('Failed to get connect token');
    return data.accessToken;
  };

  const classifyTransaction = useMutation({
    mutationFn: async ({
      txId, isPjExpense, serviceId, customCategory, note,
    }: {
      txId: string;
      isPjExpense?: boolean;
      serviceId?: string;
      customCategory?: string;
      note?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('fn_transactions')
        .update({
          is_pj_expense: isPjExpense,
          fn_service_id: serviceId ?? null,
          custom_category: customCategory ?? null,
          note: note ?? null,
        })
        .eq('id', txId)
        .eq('user_id', uid);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await (supabase as any)
        .from('fn_bank_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', uid);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const currentSummary = summaries[0] ?? null;

  const transactionsByMonth = (year: number, month: number) =>
    transactions.filter(tx => {
      const d = new Date(tx.date + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });

  const pendingIncome = transactions.filter(
    tx => tx.detected_as_income && tx.status === 'PENDING'
  );

  return {
    connections,
    transactions,
    summaries,
    currentSummary,
    isLoading: loadingConns || loadingTxs,
    getConnectToken,
    classifyTransaction,
    deleteConnection,
    transactionsByMonth,
    pendingIncome,
  };
}
