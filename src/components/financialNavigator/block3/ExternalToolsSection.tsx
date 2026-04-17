import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tools = [
  {
    id: 'pluma',
    name: 'Pluma Finance',
    description: 'Controle de gastos pessoais com conexão via Open Finance (bancos e cartões).',
    url: 'https://app.pluma.finance/',
    badge: 'Open Finance',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'myprofit',
    name: 'MyProfit',
    description: 'Declaração de IR simplificada para médicos PJ e MEI. Integra com seu contador.',
    url: 'https://myprofit.com.br',
    badge: 'Imposto de Renda',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

export function ExternalToolsSection() {
  return (
    <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <ExternalLink className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground font-display">Ferramentas complementares</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Enquanto a integração nativa não está disponível, indicamos estas soluções.
      </p>

      <div className="space-y-3">
        {tools.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-foreground">{t.name}</p>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                  t.badgeColor
                )}>
                  {t.badge}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(t.url, '_blank', 'noopener')}
              className="flex-shrink-0"
            >
              Abrir →
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
