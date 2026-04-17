import { useState } from 'react';
import { ChevronDown, LogOut, User, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppMode } from '@/contexts/ModeContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import imagLogoNew from '@/assets/imag-logo-new.png';

export function TopHeader() {
  const { signOut } = useAuth();
  const { clearMode } = useAppMode();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const firstName = profile?.medico_nome?.split(' ')[0] || 'Usuário';
  const avatarUrl = (profile as any)?.avatar_url;

  const handlePasswordConfirmed = () => {
    clearMode();
    navigate('/modo');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 glass-medium border-b border-border/50 shadow-glass">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src={imagLogoNew} alt="IMAG - Medicina Diagnóstica" className="h-8" />
            <span className="text-base font-display font-semibold text-primary-dark hidden sm:inline">
              Portal do Médico
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors outline-none select-none">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm overflow-hidden ring-2 ring-primary/5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    firstName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden sm:inline font-medium whitespace-nowrap">{firstName}</span>
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2 py-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm overflow-hidden">
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

      <PasswordConfirmDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirmed={handlePasswordConfirmed}
      />
    </>
  );
}
