import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CalendarDays, MapPin, CheckSquare } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export function TempoLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isEnabled, isLoading } = useFeatureFlags();

  const showAgenda = !isLoading && (isEnabled('agenda_comms') || isEnabled('agenda_preferences'));

  const TABS = [
    ...(showAgenda
      ? [{ label: 'Agenda', sub: 'Disponibilidades e turnos', path: '/tempo/agenda', Icon: CalendarDays, accent: 'from-blue-500 to-blue-600' }]
      : []),
    { label: 'Deslocamentos', sub: 'Distâncias e tempo', path: '/tempo/deslocamentos', Icon: MapPin, accent: 'from-teal-500 to-teal-600' },
    { label: 'Tarefas', sub: 'Pendências e lembretes', path: '/tempo/tarefas', Icon: CheckSquare, accent: 'from-violet-500 to-violet-600' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="border-b border-border bg-card/50 px-4 md:px-6 pt-4 md:pt-5 pb-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 md:mb-4">
          Tempo
        </p>
        <ScrollArea className="w-full">
          <div className="flex gap-0 -mb-px min-w-max">
            {TABS.map((b) => {
              const active = pathname.startsWith(b.path);
              const { Icon } = b;
              return (
                <button
                  key={b.path}
                  onClick={() => navigate(b.path)}
                  className={cn(
                    'group relative flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 md:py-3.5 border-b-2 transition-all whitespace-nowrap',
                    active
                      ? 'border-primary text-foreground bg-transparent'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                    active ? `bg-gradient-to-br ${b.accent}` : 'bg-muted group-hover:bg-muted/80'
                  )}>
                    <Icon className={cn('h-3.5 w-3.5 md:h-4 md:w-4', active ? 'text-white' : 'text-muted-foreground')} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className={cn('text-xs md:text-sm font-medium leading-tight', active ? 'text-foreground' : '')}>
                      {b.label}
                    </p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground leading-tight hidden sm:block">{b.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 md:px-6 py-4 md:py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
