import { useFnOpenFinance, BankConnection } from '@/hooks/useFnOpenFinance';
import { Button } from '@/components/ui/button';
import { FnConnectBankButton } from './FnConnectBankButton';
import { Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  UPDATED:     { icon: CheckCircle2, color: 'text-green-500',  label: 'Sincronizado' },
  UPDATING:    { icon: RefreshCw,    color: 'text-blue-500 animate-spin', label: 'Sincronizando...' },
  LOGIN_ERROR: { icon: AlertCircle,  color: 'text-destructive', label: 'Erro de login' },
  OUTDATED:    { icon: AlertCircle,  color: 'text-amber-500',   label: 'Desatualizado' },
};

export function FnConnectionsList() {
  const { connections, deleteConnection } = useFnOpenFinance();

  return (
    <div className="space-y-2">
      {connections.map(conn => {
        const cfg = STATUS_CONFIG[conn.status] ?? STATUS_CONFIG.UPDATED;
        const { icon: Icon } = cfg;
        const ago = conn.last_synced_at
          ? formatDistanceToNow(new Date(conn.last_synced_at), { addSuffix: true, locale: ptBR })
          : null;

        return (
          <div key={conn.id} className="flex items-center gap-2.5 py-2.5 border-b border-border/50 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-sm">
              🏦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{conn.connector_name}</p>
              <div className="flex items-center gap-1.5">
                <Icon className={cn('h-3 w-3', cfg.color)} />
                <span className="text-[10px] text-muted-foreground">
                  {cfg.label}{ago ? ` · ${ago}` : ''}
                </span>
              </div>
            </div>
            {conn.status === 'LOGIN_ERROR' && (
              <FnConnectBankButton variant="ghost" itemId={conn.pluggy_item_id} />
            )}
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
              onClick={() => confirm(`Desconectar ${conn.connector_name}?`) && deleteConnection.mutate(conn.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
