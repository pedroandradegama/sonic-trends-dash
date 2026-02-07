import { 
  Home, 
  Building2, 
  Sparkles, 
  BarChart3, 
  ThumbsUp,
  User,
  ChevronLeft,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { path: '/perfil', label: 'Perfil', icon: User },
  { path: '/institucional', label: 'Institucional', icon: Building2 },
  { path: '/magia', label: 'MagIA', icon: Sparkles },
  { path: '/', label: 'Repasse', icon: Home },
  { path: '/casuistica', label: 'Casuística', icon: BarChart3 },
  { path: '/nps', label: 'NPS', icon: ThumbsUp },
  { path: '/ferramentas', label: 'Ferramentas', icon: Wrench },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] transition-all duration-300 flex flex-col",
        "bg-card border-r border-border",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center justify-center p-2 rounded-full",
            "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
