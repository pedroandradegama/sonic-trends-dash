import { CompositeScore, FnService } from '@/types/financialNavigator';
import { useFnProjection } from '@/hooks/useFnProjection';

interface Props {
  compositeScores: CompositeScore[];
  grossByService: Record<string, number>;
  services: FnService[];
}

export function FnDecisionMatrix({ compositeScores }: Props) {
  const { projectionPoints } = useFnProjection();

  const currentGross: Record<string, number> = {};
  const curPoint = projectionPoints[2];
  if (curPoint) {
    Object.entries(curPoint.grossByService).forEach(([id, v]) => {
      currentGross[id] = v;
    });
  }

  const maxGross = Math.max(...Object.values(currentGross), 1);

  const quadrant = (score: CompositeScore) => {
    const highSat = score.composite >= 6;
    const gross = currentGross[score.service_id] ?? 0;
    const highRev = gross >= maxGross * 0.5;
    if (highSat && highRev)  return { label: 'Manter e fortalecer', color: '#0F6E56', bg: '#E1F5EE' };
    if (highSat && !highRev) return { label: 'Crescer presença',   color: '#185FA5', bg: '#E6F1FB' };
    if (!highSat && highRev) return { label: 'Renegociar ou sair', color: '#854F0B', bg: '#FAEEDA' };
    return                    { label: 'Descontinuar',             color: '#A32D2D', bg: '#FCEBEB' };
  };

  const scored = compositeScores.filter(s => s.composite > 0);
  if (scored.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3 font-body">Matriz de decisão</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {scored.map(score => {
          const q = quadrant(score);
          const gross = currentGross[score.service_id] ?? 0;
          return (
            <div key={score.service_id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: q.bg }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: score.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground font-body">{score.service_name}</p>
                <p className="text-[10px] font-body" style={{ color: q.color }}>{q.label}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-foreground font-display">{score.composite.toFixed(1)}/10</p>
                {gross > 0 && <p className="text-[10px] text-muted-foreground font-body">R$ {Math.round(gross / 1000)}k/mês</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
