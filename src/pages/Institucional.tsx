import { TooltipProvider } from '@/components/ui/tooltip';
import InstitucionalPanel from '@/components/institucional/InstitucionalPanel';
import { PageHeader } from '@/components/layout/PageHeader';

export default function Institucional() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <PageHeader />

          {/* Institucional Content */}
          <InstitucionalPanel />
        </div>
      </div>
    </TooltipProvider>
  );
}
