import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  FnService, EVAL_DIMENSIONS, EvalScores,
  GROUP_LABELS, GROUP_DEFAULT_WEIGHTS,
} from '@/types/financialNavigator';
import { useFnInsights } from '@/hooks/useFnInsights';

interface Props {
  services: FnService[];
  activeServiceId: string | null;
  onSelectService: (id: string | null) => void;
}

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export function FnEvalByService({ services, activeServiceId, onSelectService }: Props) {
  const { saveEvaluation, evaluations } = useFnInsights();
  const [scores, setScores] = useState<EvalScores>({});
  const [weights, setWeights] = useState({ ...GROUP_DEFAULT_WEIGHTS });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const activeSvc = services.find(s => s.id === activeServiceId);

  useEffect(() => {
    if (!activeServiceId) { setScores({}); setNotes(''); return; }
    const latest = evaluations.find(e => e.service_id === activeServiceId);
    if (latest) {
      const s: EvalScores = {};
      EVAL_DIMENSIONS.forEach(d => { if (latest[d.key] != null) s[d.key] = latest[d.key]; });
      setScores(s);
      setWeights({
        financial: latest.weight_financial ?? 50,
        work: latest.weight_work ?? 35,
        logistics: latest.weight_logistics ?? 15,
      });
      setNotes(latest.notes ?? '');
    } else {
      setScores({});
      setNotes('');
    }
  }, [activeServiceId, evaluations]);

  const handleSave = async () => {
    if (!activeServiceId) return;
    setSaving(true);
    const now = new Date();
    const periodLabel = `${MONTHS_SHORT[now.getMonth()]}/${String(now.getFullYear()).slice(2)}`;
    const payload: any = {
      user_id: '',
      service_id: activeServiceId,
      evaluated_at: now.toISOString().split('T')[0],
      period_label: periodLabel,
      weight_financial: weights.financial,
      weight_work: weights.work,
      weight_logistics: weights.logistics,
      notes,
    };
    EVAL_DIMENSIONS.forEach(d => { payload[d.key] = scores[d.key] ?? null; });
    await saveEvaluation.mutateAsync(payload);
    setSaving(false);
    onSelectService(null);
  };

  const groups = ['financial', 'work', 'logistics'] as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {services.map(svc => (
          <button
            key={svc.id}
            onClick={() => onSelectService(activeServiceId === svc.id ? null : svc.id)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg border transition-all font-body',
              activeServiceId === svc.id
                ? 'border-[1.5px] font-medium'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            )}
            style={activeServiceId === svc.id ? {
              borderColor: svc.color, color: svc.color, background: `${svc.color}10`
            } : {}}
          >
            {svc.name}
          </button>
        ))}
      </div>

      {activeSvc && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-muted border-b border-border">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 font-body">
              Pesos das dimensões (somam 100)
            </p>
            <div className="flex gap-3">
              {groups.map(g => (
                <div key={g} className="flex-1 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-body">{GROUP_LABELS[g]}</p>
                  <input
                    type="number" min={0} max={100} step={5}
                    value={weights[g]}
                    onChange={e => setWeights(w => ({ ...w, [g]: Number(e.target.value) }))}
                    className="w-full text-xs text-right px-2 py-1 border border-border rounded-lg bg-background font-body"
                  />
                </div>
              ))}
            </div>
          </div>

          {groups.map(group => (
            <div key={group} className="border-b border-border last:border-0">
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-body">
                  {GROUP_LABELS[group]} — peso {weights[group]}%
                </p>
              </div>
              {EVAL_DIMENSIONS.filter(d => d.group === group).map(dim => (
                <div key={dim.key} className="flex items-center gap-3 px-4 py-2.5 border-t border-border/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground font-body">{dim.label}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{dim.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="range" min={0} max={10} step={1}
                      value={scores[dim.key] ?? 5}
                      onChange={e => setScores(s => ({ ...s, [dim.key]: Number(e.target.value) }))}
                      className="w-24"
                    />
                    <span
                      className="text-sm font-medium w-5 text-right font-display"
                      style={{
                        color: (scores[dim.key] ?? 5) >= 7 ? '#0F6E56'
                             : (scores[dim.key] ?? 5) >= 4 ? '#BA7517'
                             : '#A32D2D'
                      }}
                    >
                      {scores[dim.key] ?? 5}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="px-4 py-3 border-t border-border">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 font-body">Observações</p>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contexto, mudanças recentes, intenção..." className="text-xs min-h-[60px] font-body" />
          </div>

          <div className="px-4 py-3 border-t border-border">
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : `Salvar avaliação — ${activeSvc.name}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
