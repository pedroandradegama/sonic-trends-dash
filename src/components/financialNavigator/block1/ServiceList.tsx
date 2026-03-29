import { Pencil, Trash2, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FnService, REGIME_LABELS, METHOD_LABELS } from '@/types/financialNavigator';
import { useFnConfig } from '@/hooks/useFnConfig';

interface Props {
  services: FnService[];
  onEdit: (id: string) => void;
}

const REGIME_BADGE_VARIANT: Record<string, string> = {
  pj_turno:    'bg-blue-50 text-blue-800 border-blue-200',
  pj_producao: 'bg-blue-50 text-blue-800 border-blue-200',
  clt:         'bg-green-50 text-green-800 border-green-200',
  residencia:  'bg-purple-50 text-purple-800 border-purple-200',
  fellowship:  'bg-gray-100 text-gray-600 border-gray-200',
};

export function ServiceList({ services, onEdit }: Props) {
  const { deleteService } = useFnConfig();

  if (services.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl py-10 text-center">
        <p className="text-sm text-muted-foreground font-body">Nenhum serviço cadastrado.</p>
        <p className="text-xs text-muted-foreground mt-1 font-body">
          Adicione as clínicas e plantões onde você trabalha.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {services.map(svc => (
        <div
          key={svc.id}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderLeft: `4px solid ${svc.color}` }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: svc.color }}
              />
              <span className="font-medium text-sm truncate font-body">{svc.name}</span>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0',
                REGIME_BADGE_VARIANT[svc.regime] ?? 'bg-muted text-muted-foreground'
              )}>
                {REGIME_LABELS[svc.regime]}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(svc.id)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => confirm(`Remover ${svc.name}?`) && deleteService.mutate(svc.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50">
            {svc.address && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                <MapPin className="h-3 w-3" />
                {svc.address.split(',').slice(0, 2).join(',')}
              </span>
            )}
            {svc.payment_delta > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                <Clock className="h-3 w-3" />
                Pagamento m+{svc.payment_delta}
              </span>
            )}
            {svc.primary_method && (
              <span className="text-[11px] text-muted-foreground font-body">
                {METHOD_LABELS[svc.primary_method]}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-body">
              Fiscal: Modo {svc.fiscal_mode}
              {svc.fiscal_mode === 'A' && ` (${svc.fiscal_pct_total ?? 15}%)`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
