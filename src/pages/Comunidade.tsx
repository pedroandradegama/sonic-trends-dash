import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { Users } from 'lucide-react';
import RadarArtigosCard from '@/components/institucional/RadarArtigosCard';
import FeriadosCard from '@/components/institucional/FeriadosCard';
import RadioburgerCard from '@/components/institucional/RadioburgerCard';

export default function Comunidade() {
  const nextRadioburgerDate = "2026-02-20";

  return (
    <TooltipProvider>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Comunidade
            </h1>
            <p className="text-muted-foreground mt-1">Artigos, feriados e eventos</p>
          </div>

          <RadarArtigosCard />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeriadosCard />
            <RadioburgerCard nextDate={nextRadioburgerDate} />
          </div>
        </div>
      </MainLayout>
    </TooltipProvider>
  );
}
