import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useFnConfig } from '@/hooks/useFnConfig';
import { TrendingUp, Sparkles, Wallet } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const BLOCKS = [
  { id: 3, label: 'Gestão Financeira', sub: 'Fluxo financeiro',  path: '/financeiro/projecao', Icon: TrendingUp, accent: 'from-teal-500 to-teal-600' },
  { id: 4, label: 'Insights',         sub: 'KPIs e avaliação',  path: '/financeiro/insights', Icon: Sparkles,   accent: 'from-violet-500 to-violet-600' },
  { id: 5, label: 'Saúde Financeira', sub: 'Bancos e gastos',   path: '/financeiro/saude',    Icon: Wallet,     accent: 'from-emerald-500 to-emerald-600' },
];

export function FinancialNavigatorLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { progress } = useFnConfig();

  const progressByPath: Record<string, number> = {
    '/financeiro/projecao': progress?.block3_pct ?? 0,
    '/financeiro/insights': progress?.block4_pct ?? 0,
    '/financeiro/saude': 0,
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="border-b border-border bg-card/50 px-4 md:px-6 pt-4 md:pt-5 pb-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 md:mb-4">
          Navegador Financeiro
        </p>
        <ScrollArea className="w-full">
          <div className="flex gap-0 -mb-px min-w-max">
            {BLOCKS.map((b) => {
              const active = pathname.includes(b.path.split('/').pop()!);
              const pct = progressByPath[b.path] ?? 0;
              const { Icon } = b;
              return (
                <button
                  key={b.id}
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

                  {pct > 0 && pct < 100 && (
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 md:ml-1 flex-shrink-0',
                      active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {pct}%
                    </span>
                  )}
                  {pct === 100 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ml-0.5 md:ml-1 flex-shrink-0">
                      ✓
                    </span>
                  )}
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
