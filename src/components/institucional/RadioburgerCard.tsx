import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RadioburgerCardProps {
  nextDate: string; // ISO date string (e.g., "2026-02-15")
}

const RadioburgerCard = ({ nextDate }: RadioburgerCardProps) => {
  const eventDate = parseISO(nextDate);
  const today = new Date();
  const daysUntil = differenceInDays(eventDate, today);
  
  const formattedDate = format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const getCountdownColor = () => {
    if (daysUntil <= 7) return "text-red-500";
    if (daysUntil <= 14) return "text-amber-500";
    return "text-primary";
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Próximo Radioburger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          
          <div className="flex items-center justify-center py-4 bg-muted/50 rounded-lg">
            {daysUntil > 0 ? (
              <div className="text-center">
                <span className={`text-4xl font-bold ${getCountdownColor()}`}>
                  {daysUntil}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {daysUntil === 1 ? "dia restante" : "dias restantes"}
                </p>
              </div>
            ) : daysUntil === 0 ? (
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">Hoje!</span>
                <p className="text-sm text-muted-foreground mt-1">🍔 Radioburger</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <span className="text-sm">Evento já realizado</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RadioburgerCard;
