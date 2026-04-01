import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FnService, FnDoctorProfile, PjPfSimulation } from '@/types/financialNavigator';
import { useFnProjection } from '@/hooks/useFnProjection';

interface Props {
  services: FnService[];
  doctorProfile: FnDoctorProfile | null;
}

function RateBar({ label, rate, total, color }: {
  label: string; rate: number; total: number; color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-body">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">
          {rate.toFixed(1)}% — R$ {Math.round(total).toLocaleString('pt-BR')}/ano
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(rate, 40) * 2.5}%`, background: color }} />
      </div>
    </div>
  );
}

export function FnPjPfSimulation({ services, doctorProfile }: Props) {
  const { metrics } = useFnProjection();
  const [result, setResult] = useState<PjPfSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const annualGross = metrics.avgMonthlyGross * 12;

  const runSimulation = async () => {
    if (annualGross === 0) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fn-pj-pf-simulation`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            annual_gross: Math.round(annualGross),
            service_count: services.length,
            primary_regime: doctorProfile?.primary_regime ?? 'pj_turno',
          }),
        }
      );
      const data = await res.json();
      setResult(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-foreground font-body">Simulação PJ × PF</p>
        <Button size="sm" variant="outline" onClick={runSimulation} disabled={loading || annualGross === 0}>
          {loading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Calculando...</> : annualGross === 0 ? 'Sem dados' : 'Simular'}
        </Button>
      </div>

      {annualGross > 0 && (
        <p className="text-xs text-muted-foreground mb-4 font-body">
          Base: R$ {Math.round(annualGross / 12).toLocaleString('pt-BR')}/mês (média) → R$ {Math.round(annualGross).toLocaleString('pt-BR')}/ano
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 bg-muted px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-body">
              <span>Regime</span>
              <span className="text-right">Alíquota ef.</span>
              <span className="text-right">Imposto/ano</span>
              <span className="text-right">Líquido/mês</span>
            </div>

            <div className={`grid grid-cols-4 px-4 py-3 border-t border-border/50 ${!result.simples.eligible ? 'opacity-40' : ''}`}>
              <div>
                <p className="text-xs font-medium text-foreground font-body">
                  Simples Nacional
                  {!result.simples.eligible && <span className="ml-1 text-[10px] text-destructive">(acima do teto)</span>}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">Anexo III</p>
              </div>
              <p className="text-xs text-right font-medium text-foreground font-body">{result.simples.rate.toFixed(1)}%</p>
              <p className="text-xs text-right text-muted-foreground font-body">R$ {Math.round(result.simples.total / 1000)}k</p>
              <p className="text-xs text-right font-medium text-green-700 dark:text-green-400 font-body">
                R$ {Math.round((result.annual_gross - result.simples.total) / 12).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="grid grid-cols-4 px-4 py-3 border-t border-border/50">
              <div>
                <p className="text-xs font-medium text-foreground font-body">Lucro Presumido</p>
                <p className="text-[10px] text-muted-foreground font-body">IRPJ + CSLL + ISS</p>
              </div>
              <p className="text-xs text-right font-medium text-foreground font-body">{result.lucro_presumido.rate.toFixed(1)}%</p>
              <p className="text-xs text-right text-muted-foreground font-body">R$ {Math.round(result.lucro_presumido.total / 1000)}k</p>
              <p className="text-xs text-right font-medium text-foreground font-body">
                R$ {Math.round((result.annual_gross - result.lucro_presumido.total) / 12).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="grid grid-cols-4 px-4 py-3 border-t border-border/50">
              <div>
                <p className="text-xs font-medium text-foreground font-body">Pessoa Física</p>
                <p className="text-[10px] text-muted-foreground font-body">Carnê-leão + INSS</p>
              </div>
              <p className="text-xs text-right font-medium text-foreground font-body">{result.pf.rate.toFixed(1)}%</p>
              <p className="text-xs text-right text-muted-foreground font-body">R$ {Math.round(result.pf.total / 1000)}k</p>
              <p className="text-xs text-right font-medium text-foreground font-body">
                R$ {Math.round((result.annual_gross - result.pf.total) / 12).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <RateBar label="Simples Nacional" rate={result.simples.rate} total={result.simples.total} color="#1D9E75" />
            <RateBar label="Lucro Presumido" rate={result.lucro_presumido.rate} total={result.lucro_presumido.total} color="#BA7517" />
            <RateBar label="Pessoa Física" rate={result.pf.rate} total={result.pf.total} color="#E24B4A" />
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <button className="flex items-center justify-between w-full px-4 py-3 text-left" onClick={() => setShowSuggestion(s => !s)}>
              <p className="text-xs font-medium text-foreground font-body">Análise e sugestão (IA)</p>
              {showSuggestion ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showSuggestion && (
              <div className="px-4 pb-4 border-t border-border/50">
                <div className="mt-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-body">{result.suggestion}</div>
                <div className="mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-body">
                    Esta simulação é educativa e usa parâmetros médios de 2024. Consulte seu contador antes de tomar qualquer decisão.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
