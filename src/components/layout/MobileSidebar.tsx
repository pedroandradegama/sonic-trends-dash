import { useState } from 'react';
import { 
  LayoutDashboard,
  CalendarDays, 
  Briefcase, 
  Wrench, 
  Users,
  LogOut,
  Menu,
  ArrowLeftRight,
  TrendingUp,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import imagLogoNew from '@/assets/imag-logo-new.png';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAppMode } from '@/contexts/ModeContext';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';

type AppModeKey = 'agenda' | 'avancado';

const allNavItems: { path: string; label: string; icon: typeof LayoutDashboard; modes: AppModeKey[] }[] = [
  { path: '/home', label: 'Home', icon: LayoutDashboard, modes: ['avancado'] },
  { path: '/minha-agenda', label: 'Minha Agenda', icon: CalendarDays, modes: ['avancado'] },
  { path: '/meu-trabalho', label: 'Meu Trabalho', icon: Briefcase, modes: ['avancado'] },
  { path: '/projecao', label: 'Projeção', icon: TrendingUp, modes: ['avancado'] },
  { path: '/ferramentas-ia', label: 'Ferramentas & IA', icon: Wrench, modes: ['agenda', 'avancado'] },
  { path: '/comunidade', label: 'Comunidade', icon: Users, modes: ['avancado'] },
];

export function MobileSidebar() {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const firstName = profile?.medico_nome?.split(' ')[0] || '';
  const { mode, clearMode } = useAppMode();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const navItems = allNavItems.filter(item =>
    !mode || item.modes.includes(mode as AppModeKey)
  );

  const handleSwitchMode = () => {
    setOpen(false);
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirmed = () => {
    clearMode();
    navigate('/modo');
  };

  return (
    <>
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
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <img src={imagLogoNew} alt="IMAG" className="h-7" />
                    <span className="text-base font-semibold">Menu</span>
                  </div>

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

                  <div className="p-3 border-t border-border space-y-1">
                    <Button
                      variant="ghost"
                      onClick={handleSwitchMode}
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeftRight className="h-5 w-5 mr-3" />
                      Trocar modo
                    </Button>
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
      <PasswordConfirmDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirmed={handlePasswordConfirmed}
      />
    </>
  );
}
