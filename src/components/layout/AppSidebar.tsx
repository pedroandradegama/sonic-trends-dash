import { 
  LayoutDashboard,
  CalendarDays, 
  Briefcase, 
  Wrench, 
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { path: '/home', label: 'Home', icon: LayoutDashboard },
  { path: '/minha-agenda', label: 'Minha Agenda', icon: CalendarDays },
  { path: '/meu-trabalho', label: 'Meu Trabalho', icon: Briefcase },
  { path: '/ferramentas-ia', label: 'Ferramentas & IA', icon: Wrench },
  { path: '/comunidade', label: 'Comunidade', icon: Users },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] transition-all duration-300 flex flex-col",
        "glass-medium border-r border-border/50 shadow-glass",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
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
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-imag-sm" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover-lift",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-2 border-t border-border/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center justify-center p-2 rounded-full",
            "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
