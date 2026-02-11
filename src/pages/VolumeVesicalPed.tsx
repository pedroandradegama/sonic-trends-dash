import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { VolumeVesicalPedPage } from '@/components/ferramentas/VolumeVesicalPedPage';

export default function VolumeVesicalPed() {
  return (
    <TooltipProvider>
      <MainLayout>
        <VolumeVesicalPedPage />
      </MainLayout>
    </TooltipProvider>
  );
}
