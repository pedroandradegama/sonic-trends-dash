import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useFnOpenFinance } from '@/hooks/useFnOpenFinance';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/useUserProfile';

interface Props {
  variant?: 'primary' | 'ghost';
  itemId?: string;
}

declare global {
  interface Window { PluggyConnect: any }
}

export function FnConnectBankButton({ variant = 'ghost', itemId }: Props) {
  const [loading, setLoading] = useState(false);
  const { getConnectToken } = useFnOpenFinance();
  const { profile } = useUserProfile();
  const qc = useQueryClient();

  const handleConnect = async () => {
    setLoading(true);
    try {
      const accessToken = await getConnectToken(itemId);

      if (!window.PluggyConnect) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2.2.0/pluggy-connect.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pluggy SDK'));
          document.head.appendChild(script);
        });
      }

      const pluggy = new window.PluggyConnect({
        connectToken: accessToken,
        includeSandbox: true,
        onSuccess: async (itemData: any) => {
          console.log('Pluggy connected:', itemData?.item?.id);
          // Poll for data to appear — webhook may take a few seconds
          const poll = async (attempts: number) => {
            qc.invalidateQueries({ queryKey: ['fn_connections'] });
            qc.invalidateQueries({ queryKey: ['fn_transactions'] });
            qc.invalidateQueries({ queryKey: ['fn_summaries'] });
            if (attempts < 5) {
              setTimeout(() => poll(attempts + 1), 3000);
            }
          };
          await poll(0);
        },
        onError: (error: any) => {
          console.error('Pluggy connect error:', error);
        },
        onClose: () => {
          setLoading(false);
          qc.invalidateQueries({ queryKey: ['fn_connections'] });
          qc.invalidateQueries({ queryKey: ['fn_transactions'] });
          qc.invalidateQueries({ queryKey: ['fn_summaries'] });
        },
      });

      pluggy.init();
    } catch (err) {
      console.error('Connect bank error:', err);
      setLoading(false);
    }
  };

  if (variant === 'primary') {
    return (
      <Button onClick={handleConnect} disabled={loading} className="w-full" size="lg">
        {loading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Carregando...</>
          : <><Plus className="h-4 w-4 mr-2" />Conectar banco ou cartão</>}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleConnect} disabled={loading}>
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <><Plus className="h-3.5 w-3.5 mr-1.5" />Adicionar</>}
    </Button>
  );
}
