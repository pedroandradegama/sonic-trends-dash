import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { PerfilPanel } from '@/components/perfil/PerfilPanel';

export default function Perfil() {
  return (
    <TooltipProvider>
      <MainLayout>
        <PerfilPanel />
      </MainLayout>
    </TooltipProvider>
  );
}
