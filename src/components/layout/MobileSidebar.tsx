import { useState } from 'react';
import {
  Home,
  Briefcase,
  Compass,
  Clock,
  ChevronDown,
  User,
  ArrowLeftRight,
  LogOut,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import imagLogoNew from '@/assets/imag-logo-new.png';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAppMode } from '@/contexts/ModeContext';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const tabs = [
  { path: '/home', label: 'Início', icon: Home },
  { path: '/tempo/deslocamentos', label: 'Tempo', icon: Clock, matchPrefix: '/tempo' },
  { path: '/ferramentas-ia', label: 'Trabalho', icon: Briefcase },
  { path: '/financeiro', label: 'Finanças', icon: Compass },
] as const;

export function MobileSidebar() {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearMode } = useAppMode();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const firstName = profile?.medico_nome?.split(' ')[0] || 'Usuário';
  const avatarUrl = (profile as any)?.avatar_url;

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 outline-none">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs overflow-hidden ring-2 ring-primary/5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    firstName.charAt(0).toUpperCase()
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2 py-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    firstName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium truncate">{firstName}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPasswordDialog(true)} className="cursor-pointer">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Trocar modo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch justify-around h-16">
          {tabs.map((tab) => {
            const isActive = (tab as any).matchPrefix
              ? location.pathname.startsWith((tab as any).matchPrefix)
              : location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </NavLink>
            );
          })}
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
