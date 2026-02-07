import { useState } from 'react';
import { 
  Home, 
  Building2, 
  Sparkles, 
  BarChart3, 
  ThumbsUp,
  User,
  LogOut,
  Menu
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import imagLogoNew from '@/assets/imag-logo-new.png';
import { useUserProfile } from '@/hooks/useUserProfile';

const navItems = [
  { path: '/institucional', label: 'Institucional', icon: Building2 },
  { path: '/magia', label: 'MagIA', icon: Sparkles },
  { path: '/', label: 'Repasse', icon: Home },
  { path: '/casuistica', label: 'Casuística', icon: BarChart3 },
  { path: '/nps', label: 'NPS', icon: ThumbsUp },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export function MobileSidebar() {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const firstName = profile?.medico_nome?.split(' ')[0] || '';

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <img src={imagLogoNew} alt="IMAG" className="h-7" />
            <span className="text-sm font-semibold text-foreground">Portal do Médico</span>
          </div>
          
          <div className="flex items-center gap-2">
            {firstName && (
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  {/* Sheet Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <img src={imagLogoNew} alt="IMAG" className="h-7" />
                    <span className="text-base font-semibold">Menu</span>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                            "text-sm font-medium",
                            isActive 
                              ? "bg-primary/10 text-primary border border-primary/20" 
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </nav>

                  {/* Footer */}
                  <div className="p-3 border-t border-border">
                    <Button
                      variant="ghost"
                      onClick={() => { setOpen(false); signOut(); }}
                      className="w-full justify-start text-muted-foreground hover:text-destructive"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sair
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
