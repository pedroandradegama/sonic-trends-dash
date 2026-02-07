import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { HomeSummary } from '@/components/home/HomeSummary';

export default function Home() {
  return (
    <TooltipProvider>
      <MainLayout>
        <HomeSummary />
      </MainLayout>
    </TooltipProvider>
  );
}
