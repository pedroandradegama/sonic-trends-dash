import { Users } from 'lucide-react';
import RadarArtigosCard from '@/components/institucional/RadarArtigosCard';
import FeriadosCard from '@/components/institucional/FeriadosCard';
import RadioburgerCard from '@/components/institucional/RadioburgerCard';
import { SharedCasesCard } from '@/components/comunidade/SharedCasesCard';
import { CommunityTopicsPanel } from '@/components/comunidade/CommunityTopicsPanel';
import { useAdminRadioburger } from '@/hooks/useAdminSettings';
import { useMemo } from 'react';
import { isFuture, parseISO, isToday } from 'date-fns';

export default function Comunidade() {
  const { dates: radioburgerDates } = useAdminRadioburger();

  const nextRadioburgerDate = useMemo(() => {
    const future = radioburgerDates.find(d => isFuture(parseISO(d.date)) || isToday(parseISO(d.date)));
    return future?.date || null;
  }, [radioburgerDates]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Comunidade
        </h1>
        <p className="text-muted-foreground mt-1">Casos compartilhados, artigos, eventos e feriados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SharedCasesCard />
          {nextRadioburgerDate && <RadioburgerCard nextDate={nextRadioburgerDate} />}
          <FeriadosCard />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <RadarArtigosCard />
          <CommunityTopicsPanel />
        </div>
      </div>
    </div>
  );
}
