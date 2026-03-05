import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Star, Award, Sparkles } from 'lucide-react';

interface DestaquesCardProps {
  repasseData: Array<{ 'Dt. Atendimento'?: string | null; 'Vl. Repasse'?: string | null; 'Qtde'?: string | null }>;
  npsData: Array<{ nota_real?: number | null; data_atendimento?: string | null }>;
  casuisticaData: Array<{ 'Comentário'?: string | null }>;
  totalExames: number;
}

function parseNum(v?: string | null): number {
  if (!v) return 0;
  return parseFloat(v.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

function getMonth(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length >= 3) return `${parts[2]}-${parts[1].padStart(2, '0')}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {}
  return null;
}

export function DestaquesCard({ repasseData, npsData, casuisticaData, totalExames }: DestaquesCardProps) {
  const highlights = useMemo(() => {
    const items: { icon: typeof Trophy; label: string; value: string; color: string }[] = [];

    // Best monthly repasse
    const monthlyRepasse = new Map<string, number>();
    repasseData.forEach(r => {
      const m = getMonth(r['Dt. Atendimento']);
      if (m) monthlyRepasse.set(m, (monthlyRepasse.get(m) || 0) + parseNum(r['Vl. Repasse']));
    });
    if (monthlyRepasse.size > 0) {
      const best = [...monthlyRepasse.entries()].sort((a, b) => b[1] - a[1])[0];
      const [y, mo] = best[0].split('-');
      const monthName = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      items.push({
        icon: TrendingUp,
        label: 'Maior repasse mensal',
        value: `R$ ${best[1].toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${monthName}`,
        color: 'text-primary',
      });
    }

    // Best monthly ticket médio
    const monthlyExames = new Map<string, number>();
    repasseData.forEach(r => {
      const m = getMonth(r['Dt. Atendimento']);
      if (m) monthlyExames.set(m, (monthlyExames.get(m) || 0) + parseNum(r['Qtde']));
    });
    if (monthlyRepasse.size > 0 && monthlyExames.size > 0) {
      const monthlyTicket = new Map<string, number>();
      monthlyRepasse.forEach((val, key) => {
        const ex = monthlyExames.get(key) || 1;
        monthlyTicket.set(key, val / ex);
      });
      const best = [...monthlyTicket.entries()].sort((a, b) => b[1] - a[1])[0];
      const [y, mo] = best[0].split('-');
      const monthName = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      items.push({
        icon: Star,
        label: 'Maior ticket médio mensal',
        value: `R$ ${best[1].toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${monthName}`,
        color: 'text-[hsl(var(--warning))]',
      });
    }

    // Best monthly NPS
    const monthlyNPS = new Map<string, number[]>();
    npsData.forEach(r => {
      if (typeof r.nota_real !== 'number') return;
      const m = getMonth(r.data_atendimento);
      if (m) {
        const arr = monthlyNPS.get(m) || [];
        arr.push(r.nota_real);
        monthlyNPS.set(m, arr);
      }
    });
    if (monthlyNPS.size > 0) {
      const monthlyNPSScores = new Map<string, number>();
      monthlyNPS.forEach((scores, key) => {
        const prom = scores.filter(n => n >= 9).length;
        const det = scores.filter(n => n <= 6).length;
        monthlyNPSScores.set(key, ((prom - det) / scores.length) * 100);
      });
      const best = [...monthlyNPSScores.entries()].sort((a, b) => b[1] - a[1])[0];
      const [y, mo] = best[0].split('-');
      const monthName = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      items.push({
        icon: Trophy,
        label: 'Melhor NPS mensal',
        value: `${Math.round(best[1])} em ${monthName}`,
        color: 'text-[hsl(var(--success))]',
      });
    }

    // Achievements
    const uniqueDiag = new Set(casuisticaData.map(r => r['Comentário']).filter(Boolean)).size;

    const achievements: { threshold: number; label: string }[] = [
      { threshold: 100, label: '100 diagnósticos únicos' },
      { threshold: 50, label: '50 diagnósticos únicos' },
    ];
    for (const a of achievements) {
      if (uniqueDiag >= a.threshold) {
        items.push({ icon: Award, label: `🎉 Parabéns!`, value: `Você atingiu ${a.label}!`, color: 'text-primary' });
        break;
      }
    }

    const examAchievements = [
      { threshold: 1000, label: '1.000 exames realizados' },
      { threshold: 500, label: '500 exames realizados' },
      { threshold: 100, label: '100 exames realizados' },
    ];
    for (const a of examAchievements) {
      if (totalExames >= a.threshold) {
        items.push({ icon: Sparkles, label: '🎉 Parabéns!', value: `Você ultrapassou ${a.label}!`, color: 'text-[hsl(var(--warning))]' });
        break;
      }
    }

    return items;
  }, [repasseData, npsData, casuisticaData, totalExames]);

  if (highlights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[hsl(var(--warning))]" />
          Destaques
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${h.color}`} />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{h.label}</p>
                  <p className="text-sm font-semibold text-foreground">{h.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
