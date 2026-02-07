import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { TiradsCalculator } from '@/components/ferramentas/TiradsCalculator';

export default function TiRads() {
  return (
    <TooltipProvider>
      <MainLayout>
        <TiradsCalculator />
      </MainLayout>
    </TooltipProvider>
  );
}
