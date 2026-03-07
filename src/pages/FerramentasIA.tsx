import { useState } from 'react';
import { Wrench, Calculator, Brain, FileText, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FerramentasGrid } from '@/components/ferramentas/FerramentasGrid';
import MagiaHDPanel from '@/components/magia/MagiaHDPanel';
import ReportReviewPanel from '@/components/magia/ReportReviewPanel';
import LaudoEvolutivoPanel from '@/components/magia/LaudoEvolutivoPanel';

const tabs = [
  { key: 'calculadoras', label: 'Calculadoras e Escores', icon: Calculator },
  { key: 'magia-hd', label: 'MagIA | Discussão de HD', icon: Brain },
  { key: 'magia-laudo', label: 'MagIA | Revisão de Laudo', icon: FileText },
  { key: 'magia-evolutivo', label: 'MagIA | Laudo Evolutivo', icon: Activity },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function FerramentasIA() {
  const [activeTab, setActiveTab] = useState<TabKey>('calculadoras');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          Ferramentas & IA
        </h1>
        <p className="text-muted-foreground mt-1">Calculadoras clínicas e inteligência artificial</p>
      </div>

      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit flex-wrap">
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
        {activeTab === 'calculadoras' && <FerramentasGrid />}
        {activeTab === 'magia-hd' && <MagiaHDPanel />}
        {activeTab === 'magia-laudo' && <ReportReviewPanel />}
        {activeTab === 'magia-evolutivo' && <LaudoEvolutivoPanel />}
      </div>
    </div>
  );
}
