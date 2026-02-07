import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { PercentisCalculator } from '@/components/ferramentas/PercentisCalculator';

export default function PercentisUS() {
  return (
    <TooltipProvider>
      <MainLayout>
        <PercentisCalculator />
      </MainLayout>
    </TooltipProvider>
  );
}
