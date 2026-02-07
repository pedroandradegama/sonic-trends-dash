import { TooltipProvider } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Baby, Stethoscope, ArrowRight } from 'lucide-react';

const tools = [
  {
    id: 'percentis-us',
    title: 'US Pediátrico — Percentis de Órgãos',
    description: 'Normalidade por idade (P5–P95) para fígado, baço e rins. Konuş et al., AJR 1998.',
    icon: Baby,
    path: '/ferramentas/percentis-us',
    badge: null,
  },
  {
    id: 'ti-rads',
    title: 'US — Calculadora ACR TI-RADS (2017)',
    description: 'Pontuação e categoria TI-RADS (TR1–TR5) com recomendação de conduta por tamanho (FNA / follow-up).',
    icon: Stethoscope,
    path: '/ferramentas/ti-rads',
    badge: 'Novo',
  },
];

export default function Ferramentas() {
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ferramentas</h1>
            <p className="text-muted-foreground mt-1">
              Recursos para apoiar o fluxo de trabalho clínico
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate(tool.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {tool.badge && (
                        <Badge variant="default" className="text-xs">
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-3">{tool.title}</CardTitle>
                    <CardDescription className="text-sm">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-primary group-hover:gap-2 transition-all">
                      Abrir <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </MainLayout>
    </TooltipProvider>
  );
}
