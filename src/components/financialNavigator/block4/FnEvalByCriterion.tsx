import { useState } from 'react';
import {
  FnService, EVAL_DIMENSIONS, EvalScores,
  GROUP_LABELS, GROUP_DEFAULT_WEIGHTS,
} from '@/types/financialNavigator';
import { useFnInsights } from '@/hooks/useFnInsights';
import { Button } from '@/components/ui/button';

interface Props { services: FnService[] }

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export function FnEvalByCriterion({ services }: Props) {
  const { saveEvaluation, evaluations } = useFnInsights();

  const [scores, setScores] = useState<Record<string, EvalScores>>(() => {
    const init: Record<string, EvalScores> = {};
    services.forEach(svc => {
      const latest = evaluations.find(e => e.service_id === svc.id);
      if (latest) {
        const s: EvalScores = {};
        EVAL_DIMENSIONS.forEach(d => { if (latest[d.key] != null) s[d.key] = latest[d.key]; });
        init[svc.id] = s;
      } else {
        init[svc.id] = {};
      }
    });
    return init;
  });

  const [saving, setSaving] = useState(false);

  const setScore = (serviceId: string, dimKey: string, val: number) =>
    setScores(s => ({ ...s, [serviceId]: { ...s[serviceId], [dimKey]: val } }));

  const handleSaveAll = async () => {
    setSaving(true);
    const now = new Date();
    const periodLabel = `${MONTHS_SHORT[now.getMonth()]}/${String(now.getFullYear()).slice(2)}`;
    const dateStr = now.toISOString().split('T')[0];
    for (const svc of services) {
      const svcScores = scores[svc.id] ?? {};
      const payload: any = {
        user_id: '',
        service_id: svc.id,
        evaluated_at: dateStr,
        period_label: periodLabel,
        weight_financial: GROUP_DEFAULT_WEIGHTS.financial,
        weight_work: GROUP_DEFAULT_WEIGHTS.work,
        weight_logistics: GROUP_DEFAULT_WEIGHTS.logistics,
      };
      EVAL_DIMENSIONS.forEach(d => { payload[d.key] = svcScores[d.key] ?? null; });
      await saveEvaluation.mutateAsync(payload);
    }
    setSaving(false);
  };

  const groups = ['financial', 'work', 'logistics'] as const;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-body">
        Avalie todas as clínicas lado a lado para cada critério. Útil para comparações honestas.
      </p>

      {groups.map(group => (
        <div key={group} className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <div className="px-4 py-2.5 bg-muted border-b border-border">
            <p className="text-xs font-medium text-foreground font-body">{GROUP_LABELS[group]}</p>
          </div>

          <div
            className="grid px-4 py-2 border-b border-border/50 min-w-max"
            style={{ gridTemplateColumns: `minmax(160px, 1fr) repeat(${services.length}, 80px)` }}
          >
            <span className="text-[10px] text-muted-foreground font-body">Critério</span>
            {services.map(svc => (
              <span key={svc.id} className="text-[10px] font-medium text-center truncate font-body" style={{ color: svc.color }}>
                {svc.name.split(' ')[0]}
              </span>
            ))}
          </div>

          {EVAL_DIMENSIONS.filter(d => d.group === group).map(dim => (
            <div
              key={dim.key}
              className="grid px-4 py-2.5 border-t border-border/40 items-center min-w-max"
              style={{ gridTemplateColumns: `minmax(160px, 1fr) repeat(${services.length}, 80px)` }}
            >
              <div>
                <p className="text-xs text-foreground font-body">{dim.label}</p>
                <p className="text-[10px] text-muted-foreground font-body">{dim.description}</p>
              </div>
              {services.map(svc => {
                const val = scores[svc.id]?.[dim.key] ?? 5;
                const color = val >= 7 ? '#0F6E56' : val >= 4 ? '#BA7517' : '#A32D2D';
                return (
                  <div key={svc.id} className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium font-display" style={{ color }}>{val}</span>
                    <input type="range" min={0} max={10} step={1} value={val}
                      onChange={e => setScore(svc.id, dim.key, Number(e.target.value))}
                      className="w-16" style={{ accentColor: svc.color }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      <Button className="w-full" onClick={handleSaveAll} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar avaliação de todos os serviços'}
      </Button>
    </div>
  );
}
