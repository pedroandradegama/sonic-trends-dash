import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompositeScore } from '@/types/financialNavigator';
import { cn } from '@/lib/utils';

interface Props { score: CompositeScore; onEvaluate: () => void }

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-body">
        <span className="text-muted-foreground">{label}</span>
        <span style={{ color }} className="font-medium">{value.toFixed(1)}</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value * 10}%`, background: color }} />
      </div>
    </div>
  );
}

export function FnCompositeScoreCard({ score, onEvaluate }: Props) {
  const color = score.composite >= 7.5 ? '#0F6E56' : score.composite >= 5 ? '#BA7517' : '#A32D2D';

  return (
    <div className="border border-border rounded-xl p-3.5" style={{ borderLeft: `3px solid ${score.color}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground font-body">{score.service_name}</span>
          {score.delta !== undefined && (
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium font-body',
              score.delta >= 0
                ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
            )}>
              {score.delta >= 0 ? '+' : ''}{score.delta.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-medium font-display" style={{ color }}>
            {score.composite > 0 ? score.composite.toFixed(1) : '—'}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onEvaluate}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {score.composite > 0 && (
        <div className="space-y-1.5">
          <ScoreBar label="Financeiro" value={score.financial_score} color="#378ADD" />
          <ScoreBar label="Trabalho" value={score.work_score} color="#1D9E75" />
          <ScoreBar label="Logística" value={score.logistics_score} color="#BA7517" />
        </div>
      )}

      {score.composite === 0 && (
        <button onClick={onEvaluate} className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:bg-muted/50 transition-colors font-body">
          Avaliar este serviço →
        </button>
      )}
    </div>
  );
}
