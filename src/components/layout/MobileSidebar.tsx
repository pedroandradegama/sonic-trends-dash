import { useState } from 'react';
import {
  Home,
  Briefcase,
  Compass,
  MoreHorizontal,
  CalendarDays,
  Users,
  Wrench,
  User,
  ArrowLeftRight,
  LogOut,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import imagLogoNew from '@/assets/imag-logo-new.png';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAppMode } from '@/contexts/ModeContext';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const tabs = [
  { path: '/home', label: 'Início', icon: Home },
  { path: '/ferramentas-ia', label: 'Trabalho', icon: Briefcase },
  { path: '/financeiro', label: 'Finanças', icon: Compass },
] as const;

export function MobileSidebar() {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const firstName = profile?.medico_nome?.split(' ')[0] || '';
  const { clearMode } = useAppMode();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();

  const showAgenda = !flagsLoading && (isEnabled('agenda_comms') || isEnabled('agenda_preferences'));
  const showMeuTrabalho = !flagsLoading && (isEnabled('repasse') || isEnabled('nps') || isEnabled('casuistica'));

  const handleSwitchMode = () => {
    setMoreOpen(false);
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirmed = () => {
    clearMode();
    navigate('/modo');
  };

  const moreItems: Array<{ path: string; label: string; icon: typeof Home }> = [
    ...(showAgenda ? [{ path: '/minha-agenda', label: 'Minha Agenda', icon: CalendarDays }] : []),
    ...(showMeuTrabalho ? [{ path: '/meu-trabalho', label: 'Meu Trabalho', icon: Briefcase }] : []),
    { path: '/ferramentas-ia', label: 'Ferramentas & IA', icon: Wrench },
    { path: '/comunidade', label: 'Comunidade', icon: Users },
    { path: '/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <img src={imagLogoNew} alt="IMAG" className="h-7" />
            <span className="text-sm font-semibold text-foreground">Portal do Médico</span>
          </div>
          {firstName && (
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
              {firstName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch justify-around h-16">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </NavLink>
            );
          })}

          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                  moreOpen ? "text-primary" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] font-medium">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl p-4 max-h-[80vh]">
              <div className="space-y-1 pt-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                <div className="border-t border-border my-2" />

                <button
                  onClick={handleSwitchMode}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <ArrowLeftRight className="h-5 w-5" />
                  <span>Trocar modo</span>
                </button>
                <button
                  onClick={() => { setMoreOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <PasswordConfirmDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirmed={handlePasswordConfirmed}
      />
    </>
  );
}
