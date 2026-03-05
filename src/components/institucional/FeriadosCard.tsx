import { CalendarOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isPast, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAdminHolidays } from '@/hooks/useAdminSettings';
import { Loader2 } from 'lucide-react';

const FeriadosCard = () => {
  const { holidays, loading } = useAdminHolidays();

  const getStatus = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'today';
    if (isPast(date)) return 'past';
    return 'future';
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd 'de' MMMM (EEEE)", { locale: ptBR });
  };

  const nextFeriado = holidays.find(f => isFuture(parseISO(f.date)) || isToday(parseISO(f.date)));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarOff className="h-5 w-5 text-destructive" />
          Feriados – IMAG Fechado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextFeriado && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Próximo feriado:</p>
            <p className="font-semibold text-foreground">{nextFeriado.name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {formatDateDisplay(nextFeriado.date)}
            </p>
          </div>
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
          {holidays.map((feriado) => {
            const status = getStatus(feriado.date);
            return (
              <div 
                key={feriado.id}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  status === 'past' ? 'opacity-50' : 
                  status === 'today' ? 'bg-destructive/10 border border-destructive/20' : 
                  'bg-muted/30'
                }`}
              >
                <div className="flex-1">
                  <p className={`text-sm font-medium ${status === 'past' ? 'line-through' : ''}`}>
                    {feriado.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {formatDateDisplay(feriado.date)}
                  </p>
                </div>
                {status === 'today' && (
                  <Badge variant="destructive" className="text-xs">Hoje</Badge>
                )}
                {status === 'future' && (
                  <Badge variant="outline" className="text-xs">Próximo</Badge>
                )}
              </div>
            );
          })}
          {holidays.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum feriado cadastrado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeriadosCard;
