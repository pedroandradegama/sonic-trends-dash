import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFnConfig } from '@/hooks/useFnConfig';

export interface FaqMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface FaqHistoryItem {
  id: string;
  question: string;
  answer: string;
  model_used: string;
  created_at: string;
}

export function getSuggestedQuestions(
  hasProLabore: boolean,
  hasDistribuicao: boolean,
  hasGoal: boolean,
  avgGross: number,
): string[] {
  const base = [
    'Simples Nacional ou Lucro Presumido para minha situação?',
    'Como reduzir meu IR de forma legal?',
    'Quais despesas posso deduzir como médico PJ?',
    'Vale a pena abrir uma previdência privada (PGBL)?',
    'Como preparar meu dossiê para o contador no IR anual?',
  ];

  const conditional: string[] = [];

  if (hasDistribuicao) {
    conditional.push('Qual a melhor frequência para distribuir lucros?');
    conditional.push('Dividendos serão tributados com a reforma tributária?');
  }

  if (hasProLabore) {
    conditional.push('Qual o valor ideal de pró-labore para otimizar impostos?');
  }

  if (!hasGoal) {
    conditional.push('Como definir uma meta financeira realista para minha carreira?');
  }

  if (avgGross > 30000) {
    conditional.push('A partir de quanto vale considerar uma holding médica?');
  }

  if (avgGross > 0 && avgGross < 15000) {
    conditional.push('Como aumentar minha renda líquida sem trabalhar mais horas?');
  }

  return [...conditional, ...base].slice(0, 5);
}

export function useFnFaq() {
  const { profile } = useUserProfile();
  const uid = profile?.user_id ?? '';
  const { services, doctorProfile } = useFnConfig();

  const [messages, setMessages] = useState<FaqMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasProLabore = services.some(s => s.regime === 'pro_labore');
  const hasDistribuicao = services.some(s => s.regime === 'distribuicao_lucros');
  const hasGoal = (doctorProfile?.monthly_net_goal ?? 0) > 0;

  const { data: history = [] } = useQuery({
    queryKey: ['fn_faq_history', uid],
    enabled: !!uid,
    queryFn: async (): Promise<FaqHistoryItem[]> => {
      const { data } = await (supabase as any)
        .from('fn_faq_history')
        .select('id, question, answer, model_used, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data ?? []) as FaqHistoryItem[];
    },
  });

  const ask = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: FaqMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fn-financial-faq`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question }),
        }
      );

      const data = await res.json();
      const answer = data.answer ?? 'Erro ao obter resposta.';

      const assistantMsg: FaqMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: FaqMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Erro de conexão. Tente novamente em alguns instantes.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return {
    messages,
    history,
    isLoading,
    hasProLabore,
    hasDistribuicao,
    hasGoal,
    ask,
    clearMessages,
  };
}
