import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import MagiaPage from '@/components/magia/MagiaPage';

export default function Magia() {
  return (
    <TooltipProvider>
      <MainLayout>
        <MagiaPage />
      </MainLayout>
    </TooltipProvider>
  );
}
