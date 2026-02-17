import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { CalendarDays, Settings, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerfilPanel } from '@/components/perfil/PerfilPanel';
import AgendaCard from '@/components/institucional/AgendaCard';

const tabs = [
  { key: 'preferencias', label: 'Preferências', icon: Settings },
  { key: 'comunicacao', label: 'Comunicação de Agenda', icon: CalendarPlus },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function MinhaAgenda() {
  const [activeTab, setActiveTab] = useState<TabKey>('preferencias');

  return (
    <TooltipProvider>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Minha Agenda
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie suas preferências e disponibilidade</p>
          </div>

          {/* Horizontal sub-tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-card text-primary shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {activeTab === 'preferencias' && <PerfilPanel />}
            {activeTab === 'comunicacao' && <AgendaCard />}
          </div>
        </div>
      </MainLayout>
    </TooltipProvider>
  );
}
