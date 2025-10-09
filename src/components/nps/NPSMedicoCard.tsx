import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedicoNPS } from "@/hooks/useNPSByMedico";

interface NPSMedicoCardProps {
  data: MedicoNPS;
}

export function NPSMedicoCard({ data }: NPSMedicoCardProps) {
  const getNPSColor = (nps: number) => {
    if (nps >= 75) return "bg-green-500";
    if (nps >= 50) return "bg-green-400";
    if (nps >= 0) return "bg-yellow-500";
    if (nps >= -50) return "bg-orange-500";
    return "bg-red-500";
  };

  const getNPSLabel = (nps: number) => {
    if (nps >= 75) return "Excelente";
    if (nps >= 50) return "Muito Bom";
    if (nps >= 0) return "Razoável";
    if (nps >= -50) return "Ruim";
    return "Crítico";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {data.medico}
          </CardTitle>
          <Badge className={`${getNPSColor(data.nps)} text-white ml-2 shrink-0`}>
            {getNPSLabel(data.nps)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-muted rounded-lg">
          <div className="text-4xl font-bold text-foreground">{data.nps}</div>
          <div className="text-sm text-muted-foreground mt-1">NPS Score</div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Total Respostas</div>
            <div className="font-semibold text-foreground">{data.totalRespostas}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Nota Média</div>
            <div className="font-semibold text-foreground">{data.notaMedia.toFixed(1)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Promotores (9-10)</span>
            <span className="font-semibold text-green-600">
              {data.promotores} ({data.percentualPromotores.toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Neutros (7-8)</span>
            <span className="font-semibold text-yellow-600">
              {data.neutros} ({((data.neutros / data.totalRespostas) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Detratores (0-6)</span>
            <span className="font-semibold text-red-600">
              {data.detratores} ({data.percentualDetratores.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
