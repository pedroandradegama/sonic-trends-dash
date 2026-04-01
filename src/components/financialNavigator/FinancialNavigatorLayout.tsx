import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useFnConfig } from '@/hooks/useFnConfig';

const BLOCKS = [
  { id: 1, label: 'Configurações', path: '/financeiro/config',   color: 'bg-primary/60' },
  { id: 2, label: 'Agendas',      path: '/financeiro/agendas',  color: 'bg-blue-400' },
  { id: 3, label: 'Projeção',     path: '/financeiro/projecao', color: 'bg-teal-400' },
  { id: 4, label: 'Insights',     path: '/financeiro/insights', color: 'bg-violet-400' },
];

export function FinancialNavigatorLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { progress } = useFnConfig();

  const progressValues = [
    progress?.block1_pct ?? 0,
    progress?.block2_pct ?? 0,
    progress?.block3_pct ?? 0,
    progress?.block4_pct ?? 0,
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Barra de ciclo evolutivo */}
      <div className="px-4 pt-4 pb-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 font-body">
          Navegador Financeiro
        </p>
        <div className="flex gap-1.5 mb-1">
          {BLOCKS.map((b, i) => {
            const active = pathname.includes(b.path.split('/').pop()!);
            const pct = progressValues[i];
            return (
              <button
                key={b.id}
                onClick={() => navigate(b.path)}
                className={cn(
                  'flex-1 rounded-lg p-2.5 text-left transition-all border',
                  active
                    ? 'border-border bg-card shadow-sm'
                    : 'border-transparent hover:border-border/50',
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded font-body',
                    active ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {b.id}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-body">{pct}%</span>
                </div>
                <p className={cn(
                  'text-xs font-medium leading-tight font-body',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {b.label}
                </p>
                {/* Mini barra de progresso */}
                <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', b.color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo do bloco */}
      <div className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </div>
    </div>
  );
}
