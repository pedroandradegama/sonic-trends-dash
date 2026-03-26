import { TrendingUp } from 'lucide-react';
import { RevenueProjectionPage } from '@/components/revenue/RevenueProjectionPage';

export default function Projecao() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 font-display">
          <TrendingUp className="h-6 w-6 text-primary" />
          Projeção de Receita
        </h1>
        <p className="text-muted-foreground mt-1 font-body">
          Planeje e acompanhe sua receita mensal
        </p>
      </div>
      <RevenueProjectionPage />
    </div>
  );
}
