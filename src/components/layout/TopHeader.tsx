import { ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import imagLogoNew from '@/assets/imag-logo-new.png';

export function TopHeader() {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const firstName = profile?.medico_nome?.split(' ')[0] || 'Usuário';
  const avatarUrl = (profile as any)?.avatar_url;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={imagLogoNew} alt="IMAG - Medicina Diagnóstica" className="h-8" />
          <span className="text-base font-semibold text-foreground hidden sm:inline">
            Portal do Médico
          </span>
        </div>

        {/* Right: User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors outline-none">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                firstName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="hidden sm:inline font-medium">{firstName}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
