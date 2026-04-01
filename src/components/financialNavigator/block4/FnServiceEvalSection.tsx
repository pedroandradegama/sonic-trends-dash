import { useState } from 'react';
import { FnService, CompositeScore, EvalMode } from '@/types/financialNavigator';
import { FnEvalModeToggle } from './FnEvalModeToggle';
import { FnCompositeScoreCard } from './FnCompositeScoreCard';
import { FnEvalByService } from './FnEvalByService';
import { FnEvalByCriterion } from './FnEvalByCriterion';
import { FnDecisionMatrix } from './FnDecisionMatrix';
import { useFnProjection } from '@/hooks/useFnProjection';

interface Props {
  services: FnService[];
  compositeScores: CompositeScore[];
}

export function FnServiceEvalSection({ services, compositeScores }: Props) {
  const [mode, setMode] = useState<EvalMode>('by_service');
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const { metrics } = useFnProjection();

  const hasAnyEval = compositeScores.some(s => s.composite > 0);

  return (
    <div className="glass-card rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground font-body">Avaliação dos serviços</p>
        <FnEvalModeToggle mode={mode} onChange={setMode} />
      </div>

      {hasAnyEval && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {compositeScores.map(score => (
            <FnCompositeScoreCard key={score.service_id} score={score} onEvaluate={() => setEvaluatingId(score.service_id)} />
          ))}
        </div>
      )}

      {mode === 'by_service' ? (
        <FnEvalByService services={services} activeServiceId={evaluatingId} onSelectService={setEvaluatingId} />
      ) : (
        <FnEvalByCriterion services={services} />
      )}

      {hasAnyEval && (
        <FnDecisionMatrix compositeScores={compositeScores} grossByService={metrics.grossByMethod} services={services} />
      )}
    </div>
  );
}
