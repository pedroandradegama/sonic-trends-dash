import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import CIMTCalculatorPage from '@/components/ferramentas/CIMTCalculatorPage';

export default function CIMTPercentile() {
  return (
    <TooltipProvider>
      <MainLayout>
        <CIMTCalculatorPage />
      </MainLayout>
    </TooltipProvider>
  );
}
