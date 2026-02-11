import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProvaMotoraVBPage } from '@/components/ferramentas/ProvaMotoraVBPage';

export default function ProvaMotoraVB() {
  return (
    <TooltipProvider>
      <MainLayout>
        <ProvaMotoraVBPage />
      </MainLayout>
    </TooltipProvider>
  );
}
