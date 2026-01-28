import { 
  Home, 
  Building2, 
  Sparkles, 
  BarChart3, 
  ThumbsUp,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import imagLogo from '@/assets/imag-logo.png';

const navItems = [
  { path: '/institucional', label: 'Institucional', icon: Building2 },
  { path: '/magia', label: 'MagIA', icon: Sparkles },
  { path: '/', label: 'Repasse', icon: Home },
  { path: '/casuistica', label: 'Casuística', icon: BarChart3 },
  { path: '/nps', label: 'NPS', icon: ThumbsUp },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col",
        "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900",
        "border-r border-slate-700/50 shadow-xl",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-slate-700/50",
        collapsed && "justify-center"
      )}>
        <img 
          src={imagLogo} 
          alt="IMAG" 
          className={cn(
            "transition-all duration-300",
            collapsed ? "h-8 w-8 object-contain" : "h-10"
          )} 
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-white truncate">Portal do Médico</h1>
            {profile?.medico_nome && (
              <p className="text-xs text-slate-400 truncate">
                Olá, {profile.medico_nome.split(' ')[0]}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-white")} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50 space-y-2">
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full text-slate-300 hover:text-white hover:bg-slate-700/50",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-slate-400 hover:text-white hover:bg-slate-700/50 justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
