import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertCircle } from 'lucide-react';
import { useFnCalendar } from '@/hooks/useFnCalendar';
import { useFnConfig } from '@/hooks/useFnConfig';
import { VoiceAction, FnShiftType, FN_SHIFT_LABELS } from '@/types/financialNavigator';

interface Props {
  open: boolean;
  onClose: () => void;
  transcript: string;
  actions: VoiceAction[];
  onActionsChange: (a: VoiceAction[]) => void;
}

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d}/${MONTHS_SHORT[m - 1]}`;
}

export function FnVoicePreviewSheet({
  open, onClose, transcript, actions, onActionsChange,
}: Props) {
  const { applyVoiceActions } = useFnCalendar();
  const { services } = useFnConfig();
  const [applying, setApplying] = useState(false);

  const updateAction = (i: number, patch: Partial<VoiceAction>) =>
    onActionsChange(actions.map((a, idx) => idx === i ? { ...a, ...patch } : a));

  const removeAction = (i: number) =>
    onActionsChange(actions.filter((_, idx) => idx !== i));

  const handleApply = async () => {
    setApplying(true);
    await applyVoiceActions.mutateAsync(actions);
    setApplying(false);
    onClose();
  };

  const hasUnresolvedServices = actions.some(a => !a.service_id);

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-body">Revisar comandos de voz</SheetTitle>
          <SheetDescription className="font-body">
            Confirme os turnos antes de adicionar ao calendário.
          </SheetDescription>
        </SheetHeader>

        <div className="mb-4 bg-muted rounded-lg px-3 py-2.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 font-body">
            Transcrição
          </p>
          <p className="text-xs text-foreground leading-relaxed font-body">{transcript}</p>
        </div>

        {actions.length === 0 ? (
          <div className="py-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-body">
              Nenhum turno reconhecido. Tente novamente com mais clareza.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-body">
              Turnos reconhecidos ({actions.length})
            </p>
            {actions.map((action, i) => (
              <div
                key={i}
                className={`border rounded-xl p-3 space-y-2.5 ${
                  !action.service_id
                    ? 'border-[hsl(var(--warning))]/50 bg-[hsl(var(--warning))]/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {formatDate(action.shift_date)}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {FN_SHIFT_LABELS[action.shift_type]}
                    </Badge>
                    {action.confidence < 0.7 && (
                      <span className="text-[10px] text-[hsl(var(--warning))]">
                        baixa confiança
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeAction(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {!action.service_id && (
                    <p className="text-[10px] text-[hsl(var(--warning))] font-medium font-body">
                      Serviço não identificado: "{action.service_name}" — selecione abaixo
                    </p>
                  )}
                  <Select
                    value={action.service_id ?? ''}
                    onValueChange={v => updateAction(i, { service_id: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione o serviço..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: s.color }}
                            />
                            {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select
                  value={action.shift_type}
                  onValueChange={v => updateAction(i, { shift_type: v as FnShiftType })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(FN_SHIFT_LABELS) as [FnShiftType, string][]).map(([k, l]) => (
                      <SelectItem key={k} value={k} className="text-xs">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[10px] text-muted-foreground italic font-body">
                  "{action.raw_mention}"
                </p>
              </div>
            ))}
          </div>
        )}

        {actions.length > 0 && (
          <>
            {hasUnresolvedServices && (
              <p className="text-xs text-[hsl(var(--warning))] mb-3 font-body">
                Resolva os serviços não identificados antes de confirmar.
              </p>
            )}
            <Button
              className="w-full mb-2"
              onClick={handleApply}
              disabled={applying || hasUnresolvedServices}
            >
              {applying ? 'Aplicando...' : `Confirmar ${actions.length} turno${actions.length !== 1 ? 's' : ''}`}
            </Button>
          </>
        )}
        <Button variant="outline" className="w-full" onClick={onClose}>
          Cancelar
        </Button>
      </SheetContent>
    </Sheet>
  );
}
