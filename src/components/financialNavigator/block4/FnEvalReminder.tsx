import { Bell } from 'lucide-react';
import { FnService } from '@/types/financialNavigator';

interface Props { services: FnService[] }

export function FnEvalReminder({ services }: Props) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl">
      <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-purple-800 dark:text-purple-300 font-body">
          Avaliação semestral pendente
        </p>
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5 font-body">
          {services.length === 1
            ? `${services[0].name} não é avaliado há mais de 6 meses.`
            : `${services.map(s => s.name).join(', ')} não são avaliados há mais de 6 meses.`}
          {' '}Role para baixo para avaliar.
        </p>
      </div>
    </div>
  );
}
