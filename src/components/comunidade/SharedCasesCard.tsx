import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSharedCases } from '@/hooks/useAdminSettings';
import { Stethoscope, Calendar, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SharedCasesCard() {
  const { data: cases, isLoading } = useSharedCases();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          Casos Compartilhados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !cases || cases.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum caso compartilhado ainda.</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
            {cases.map(c => (
              <div key={c.id} className="p-3 rounded-lg border bg-card/50 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{c.patient_name}</span>
                  {c.request_opinion && (
                    <Badge variant="outline" className="text-xs gap-1 border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]">
                      <MessageCircle className="h-3 w-3" />
                      Pede opinião
                    </Badge>
                  )}
                </div>
                {c.diagnostic_hypothesis && (
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{c.diagnostic_hypothesis}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(c.exam_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
