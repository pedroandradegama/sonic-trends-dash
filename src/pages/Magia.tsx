import { TooltipProvider } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/layout/PageHeader';
import MagiaPage from '@/components/magia/MagiaPage';

export default function Magia() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader />
          <MagiaPage />
        </div>
      </div>
    </TooltipProvider>
  );
}
