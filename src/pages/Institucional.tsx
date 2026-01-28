import { TooltipProvider } from '@/components/ui/tooltip';
import InstitucionalPanel from '@/components/institucional/InstitucionalPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Institucional() {
  return (
    <TooltipProvider>
      <MainLayout>
        <InstitucionalPanel />
      </MainLayout>
    </TooltipProvider>
  );
}
