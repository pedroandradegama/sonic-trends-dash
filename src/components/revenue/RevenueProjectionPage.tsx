import { useState } from 'react';
import { RevenueCalendar } from './RevenueCalendar';
import { RevenueChart } from './RevenueChart';
import { RevenueConfig } from './RevenueConfig';
import { useRevenueData } from '@/hooks/useRevenueData';
import { cn } from '@/lib/utils';
import { Calendar, BarChart3, Settings } from 'lucide-react';

type Tab = 'calendar' | 'chart' | 'config';

export function RevenueProjectionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const data = useRevenueData();

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'chart',    label: 'Projeção',   icon: BarChart3 },
    { id: 'config',   label: 'Config',     icon: Settings },
  ];

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors',
                activeTab === t.id
                  ? 'bg-card border border-border font-medium text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        {activeTab === 'calendar' && <RevenueCalendar {...data} />}
        {activeTab === 'chart'    && <RevenueChart    {...data} />}
        {activeTab === 'config'   && <RevenueConfig   {...data} />}
      </div>
    </div>
  );
}
