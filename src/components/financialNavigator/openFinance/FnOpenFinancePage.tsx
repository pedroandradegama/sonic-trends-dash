import { useFnOpenFinance } from '@/hooks/useFnOpenFinance';
import { useFnProjection } from '@/hooks/useFnProjection';
import { FnConnectBankButton } from './FnConnectBankButton';
import { FnConnectionsList } from './FnConnectionsList';
import { FnSpendingDashboard } from './FnSpendingDashboard';
import { FnTransactionList } from './FnTransactionList';
import { FnCashFlowChart } from './FnCashFlowChart';
import { FnIncomeDetection } from './FnIncomeDetection';

export function FnOpenFinancePage() {
  const { connections, currentSummary, pendingIncome, isLoading } = useFnOpenFinance();
  const { metrics } = useFnProjection();
  const hasConnections = connections.length > 0;

  if (!hasConnections) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <span className="text-2xl">🏦</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Conecte seus bancos
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conecte suas contas bancárias e cartões para ver seus gastos reais
            ao lado da sua receita projetada.
          </p>
        </div>
        <div className="bg-muted rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-medium text-foreground">O que você vai ver:</p>
          {[
            'Gastos por categoria (restaurante, saúde, etc.)',
            'Fatura do cartão de crédito + parcelamentos',
            'Receitas de clínicas detectadas automaticamente',
            'Índice de poupança real mês a mês',
          ].map(item => (
            <p key={item} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>{item}
            </p>
          ))}
        </div>
        <FnConnectBankButton variant="primary" />
        <p className="text-[10px] text-muted-foreground">
          Powered by Pluggy · Open Finance regulado pelo Banco Central
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pendingIncome.length > 0 && (
        <FnIncomeDetection transactions={pendingIncome} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {currentSummary && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <FnSpendingDashboard
                summary={currentSummary}
                projectedIncome={metrics.currentMonthGross}
              />
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <FnCashFlowChart />
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <FnTransactionList />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Contas conectadas</p>
              <FnConnectBankButton variant="ghost" />
            </div>
            <FnConnectionsList />
          </div>
        </div>
      </div>
    </div>
  );
}
