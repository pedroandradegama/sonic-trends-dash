import {
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Wrench,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Compass,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAppMode } from '@/contexts/ModeContext';
import { useState } from 'react';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

type AppModeKey = 'agenda' | 'avancado';

type NavItem = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  modes: AppModeKey[];
  requiresFlags?: string[];
};

type NavSection = {
  label?: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    items: [
      { path: '/home', label: 'Home', icon: LayoutDashboard, modes: ['avancado'] },
    ],
  },
  {
    label: 'Tempo',
    items: [
      { path: '/minha-agenda', label: 'Agenda', icon: CalendarDays, modes: ['avancado'], requiresFlags: ['agenda_comms', 'agenda_preferences'] },
      { path: '/comunidade', label: 'Comunidade', icon: Users, modes: ['avancado'] },
    ],
  },
  {
    label: 'Trabalho',
    items: [
      { path: '/ferramentas-ia', label: 'Ferramentas & IA', icon: Wrench, modes: ['agenda', 'avancado'] },
      { path: '/meu-trabalho', label: 'Meu Trabalho', icon: Briefcase, modes: ['avancado'], requiresFlags: ['repasse', 'nps', 'casuistica'] },
    ],
  },
  {
    label: 'Finanças',
    items: [
      { path: '/financeiro', label: 'Navegador Financeiro', icon: Compass, modes: ['avancado'] },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggle } = useSidebar();
  const { mode, clearMode } = useAppMode();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();

  const filterItem = (item: NavItem) => {
    if (mode && !item.modes.includes(mode as AppModeKey)) return false;
    if (item.requiresFlags && item.requiresFlags.length > 0) {
      if (flagsLoading) return false;
      return item.requiresFlags.some(f => isEnabled(f));
    }
    return true;
  };

  const visibleSections = sections
    .map(s => ({ ...s, items: s.items.filter(filterItem) }))
    .filter(s => s.items.length > 0);

  const handleSwitchMode = () => setShowPasswordDialog(true);
  const handlePasswordConfirmed = () => {
    clearMode();
    navigate('/modo');
  };

  return (
    <>
      <PasswordConfirmDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirmed={handlePasswordConfirmed}
      />
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
              {section.label && !collapsed && (
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 py-1 mt-3 mb-1">
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

        <div className="p-2 border-t border-border/50 space-y-1">
          <button
            onClick={handleSwitchMode}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
              "text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Trocar modo" : undefined}
          >
            <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Trocar modo</span>}
          </button>
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
    </>
  );
}
