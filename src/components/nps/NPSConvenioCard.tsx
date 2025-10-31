import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConvenioNPS } from '@/hooks/useNPSByConvenio';

interface NPSConvenioCardProps {
  data: ConvenioNPS;
}

export function NPSConvenioCard({ data }: NPSConvenioCardProps) {
  const getNPSColor = (nps: number) => {
    if (nps >= 75) return 'text-green-600';
    if (nps >= 50) return 'text-blue-600';
    if (nps >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNPSLabel = (nps: number) => {
    if (nps >= 75) return 'Excelente';
    if (nps >= 50) return 'Muito Bom';
    if (nps >= 0) return 'Regular';
    return 'Crítico';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{data.convenio}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold">{data.nps.toFixed(1)}</span>
          <span className={`text-sm font-medium ${getNPSColor(data.nps)}`}>
            {getNPSLabel(data.nps)}
          </span>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total de Respostas:</span>
            <span className="font-medium">{data.totalRespostas}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nota Média:</span>
            <span className="font-medium">{data.notaMedia.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-600">Promotores (9-10)</span>
            <span className="font-medium">{data.percentualPromotores.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-yellow-600">Neutros (7-8)</span>
            <span className="font-medium">{data.percentualNeutros.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-red-600">Detratores (0-6)</span>
            <span className="font-medium">{data.percentualDetratores.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
