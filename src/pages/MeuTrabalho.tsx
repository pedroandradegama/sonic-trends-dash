import { useState } from 'react';
import { Briefcase, DollarSign, BarChart3, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RepasseContent } from '@/components/trabalho/RepasseContent';
import { CasuisticaContent } from '@/components/trabalho/CasuisticaContent';
import { NPSContent } from '@/components/trabalho/NPSContent';

const tabs = [
  { key: 'repasse', label: 'Repasse', icon: DollarSign },
  { key: 'casuistica', label: 'Casuística', icon: BarChart3 },
  { key: 'nps', label: 'NPS', icon: ThumbsUp },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function MeuTrabalho() {
  const [activeTab, setActiveTab] = useState<TabKey>('repasse');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          Meu Trabalho
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe repasse, casuística e NPS</p>
      </div>

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

      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        {activeTab === 'repasse' && <RepasseContent />}
        {activeTab === 'casuistica' && <CasuisticaContent />}
        {activeTab === 'nps' && <NPSContent />}
      </div>
    </div>
  );
}
