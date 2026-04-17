import { ExternalToolsSection } from '@/components/financialNavigator/block3/ExternalToolsSection';

export default function GestaoFinanceiraPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold font-display text-foreground">Gestão Financeira</h2>
        <p className="text-sm text-muted-foreground">
          Ferramentas externas complementares para controle financeiro pessoal e fiscal.
        </p>
      </div>
      <ExternalToolsSection />
    </div>
  );
}
