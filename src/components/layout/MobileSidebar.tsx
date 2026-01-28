import { useState } from 'react';
import { 
  Home, 
  Building2, 
  Sparkles, 
  BarChart3, 
  ThumbsUp,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import imagLogo from '@/assets/imag-logo.png';

const navItems = [
  { path: '/institucional', label: 'Institucional', icon: Building2 },
  { path: '/magia', label: 'MagIA', icon: Sparkles },
  { path: '/', label: 'Repasse', icon: Home },
  { path: '/casuistica', label: 'Casuística', icon: BarChart3 },
  { path: '/nps', label: 'NPS', icon: ThumbsUp },
];

export function MobileSidebar() {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <img src={imagLogo} alt="IMAG" className="h-8" />
            <div>
              <h1 className="text-sm font-bold text-white">Portal do Médico</h1>
              {profile?.medico_nome && (
                <p className="text-xs text-slate-400">
                  Olá, {profile.medico_nome.split(' ')[0]}
                </p>
              )}
            </div>
          </div>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-72 p-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-slate-700/50"
            >
              <div className="flex flex-col h-full">
                {/* Sheet Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <img src={imagLogo} alt="IMAG" className="h-8" />
                    <span className="text-lg font-bold text-white">Menu</span>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                          "text-sm font-medium",
                          isActive 
                            ? "bg-primary text-white shadow-lg shadow-primary/30" 
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", isActive && "text-white")} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
