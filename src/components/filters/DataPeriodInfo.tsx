import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';

interface DataPeriodInfoProps {
  minDate: Date | null;
  maxDate: Date | null;
  loading: boolean;
}

export function DataPeriodInfo({ minDate, maxDate, loading }: DataPeriodInfoProps) {
  if (loading) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Carregando período...</span>
      </span>
    );
  }

  if (!minDate || !maxDate) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Período indisponível</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <Calendar className="h-4 w-4" />
      <span>
        Dados disponíveis de{' '}
        <span className="font-medium text-foreground">
          {format(minDate, 'dd/MM/yyyy', { locale: ptBR })}
        </span>
        {' '}até{' '}
        <span className="font-medium text-foreground">
          {format(maxDate, 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      </span>
    </span>
  );
}
