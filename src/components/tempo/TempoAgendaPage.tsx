import { Block1Page } from '@/components/financialNavigator/block1/Block1Page';
import { Block2Page } from '@/components/financialNavigator/block2/Block2Page';
import { Separator } from '@/components/ui/separator';

export function TempoAgendaPage() {
  return (
    <div className="space-y-8">
      <Block1Page />
      <Separator className="my-4" />
      <Block2Page />
    </div>
  );
}
