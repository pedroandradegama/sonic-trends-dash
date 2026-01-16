import { NavButtons } from './NavButtons';
import { useUserProfile } from '@/hooks/useUserProfile';
import imagLogo from '@/assets/imag-logo.png';

interface PageHeaderProps {
  title?: string;
}

export function PageHeader({ title = "Portal do Médico" }: PageHeaderProps) {
  const { profile } = useUserProfile();

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-4">
        <img src={imagLogo} alt="IMAG - Medicina Diagnóstica" className="h-12" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h1>
          {profile?.medico_nome && (
            <p className="text-muted-foreground mt-1">
              Olá, <span className="font-medium text-foreground">{profile.medico_nome.split(' ')[0]}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3 items-end">
        <NavButtons />
      </div>
    </header>
  );
}
