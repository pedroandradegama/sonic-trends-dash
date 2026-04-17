import {
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Wrench,
  Users,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  CheckSquare,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

type NavItem = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  show?: (flags: { isEnabled: (f: string) => boolean }) => boolean;
};

type NavSection = {
  label?: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    items: [
      { path: '/home', label: 'Home', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Tempo',
    items: [
      {
        path: '/tempo/agenda',
        label: 'Agenda',
        icon: CalendarDays,
        show: ({ isEnabled }) => isEnabled('agenda_comms') || isEnabled('agenda_preferences'),
      },
      { path: '/tempo/deslocamentos', label: 'Deslocamentos', icon: MapPin },
      { path: '/tempo/tarefas', label: 'Tarefas', icon: CheckSquare },
    ],
  },
  {
    label: 'Trabalho',
    items: [
      { path: '/ferramentas-ia', label: 'Ferramentas & IA', icon: Wrench },
      {
        path: '/meu-trabalho',
        label: 'Meu Trabalho',
        icon: Briefcase,
        show: ({ isEnabled }) => isEnabled('repasse') || isEnabled('nps') || isEnabled('casuistica'),
      },
      { path: '/comunidade', label: 'Comunidade', icon: Users },
    ],
  },
  {
    label: 'Finanças',
    items: [
      { path: '/financeiro', label: 'Navegador Financeiro', icon: Compass },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { collapsed, toggle } = useSidebar();
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();

  const filterItem = (item: NavItem) => {
    if (!item.show) return true;
    if (flagsLoading) return false;
    return item.show({ isEnabled });
  };

  const visibleSections = sections
    .map(s => ({ ...s, items: s.items.filter(filterItem) }))
    .filter(s => s.items.length > 0);

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] transition-all duration-300 flex flex-col",
        "glass-medium border-r border-border/50 shadow-glass",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin">
        {visibleSections.map((section, idx) => (
          <div key={section.label ?? `group-${idx}`}>
            {section.label && (
              <div
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-3 pt-4 pb-1 select-none",
                  collapsed && "hidden"
                )}
              >
                {section.label}
              </div>
            )}
            {section.label && collapsed && idx > 0 && (
              <div className="my-2 mx-3 border-t border-border/40" />
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      "text-sm font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover-lift",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-border/50">
        <button
          onClick={toggle}
          className={cn(
            "w-full flex items-center justify-center p-2 rounded-full",
            "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          )}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}
