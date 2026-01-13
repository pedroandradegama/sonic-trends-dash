import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import InstitucionalPanel from '@/components/institucional/InstitucionalPanel';
import imagLogo from '@/assets/imag-logo.png';

export default function Institucional() {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <img src={imagLogo} alt="IMAG - Medicina Diagnóstica" className="h-12" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Portal Analítico | Médico Radiologista
                </h1>
                {profile?.medico_nome && (
                  <p className="text-muted-foreground mt-1">
                    Olá, <span className="font-medium text-foreground">{profile.medico_nome.split(' ')[0]}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/">Repasse</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/casuistica">Casuística</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/nps">NPS</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link to="/institucional">Institucional</Link>
              </Button>
              <Button onClick={signOut} variant="outline" size="sm">
                Sair
              </Button>
            </div>
          </header>

          {/* Institucional Content */}
          <InstitucionalPanel />
        </div>
      </div>
    </TooltipProvider>
  );
}
