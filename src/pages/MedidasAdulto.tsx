import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { MedidasAdultoPage } from '@/components/ferramentas/MedidasAdultoPage';

export default function MedidasAdulto() {
  return (
    <TooltipProvider>
      <MainLayout>
        <MedidasAdultoPage />
      </MainLayout>
    </TooltipProvider>
  );
}
