import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Stethoscope, Bone, Droplets } from 'lucide-react';

// Custom Breast Icon (from SubspecialtyIcon)
const BreastIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4C8 4 5 7 5 11C5 15 7 19 12 20C17 19 19 15 19 11C19 7 16 4 12 4Z" />
    <circle cx="12" cy="13" r="2" />
  </svg>
);

// Custom Gynecology Icon (from SubspecialtyIcon)
const GynecologyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20V14" />
    <path d="M12 14C12 14 8 14 6 10C4 6 6 4 8 4C10 4 12 6 12 8" />
    <path d="M12 14C12 14 16 14 18 10C20 6 18 4 16 4C14 4 12 6 12 8" />
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
  </svg>
);

// Baby/Pediatric icon
const BabyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M12 12v4" />
    <path d="M8 20h8" />
    <path d="M10 16l-2 4" />
    <path d="M14 16l2 4" />
  </svg>
);

// Heart/OB icon
const ObstetricsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

type ToolCategory = 'pediatria' | 'medicina-interna' | 'vascular' | 'ginecologia' | 'obstetricia';

interface ToolDef {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  badge: string | null;
  category: ToolCategory;
}

const categoryMeta: Record<ToolCategory, { label: string; iconColor: string }> = {
  'pediatria': { label: 'Pediatria', iconColor: 'text-emerald-600' },
  'medicina-interna': { label: 'Medicina Interna', iconColor: 'text-blue-600' },
  'vascular': { label: 'Vascular', iconColor: 'text-red-500' },
  'ginecologia': { label: 'Ginecologia', iconColor: 'text-rose-500' },
  'obstetricia': { label: 'Obstetrícia', iconColor: 'text-pink-500' },
};

const tools: ToolDef[] = [
  // Row 1: Pediatria
  {
    id: 'percentis-us',
    title: 'Pediatria | Percentis — Fígado, Baço e Rins',
    description: 'Normalidade por idade (P5–P95) para fígado, baço e rins. Konuş et al., AJR 1998.',
    icon: BabyIcon,
    path: '/ferramentas/percentis-us',
    badge: null,
    category: 'pediatria',
  },
  {
    id: 'ped-volume',
    title: 'Pediatria | Percentis — Tireoide e Testículo',
    description: 'Percentis de volume testicular (0,5–10 anos) e tireoidiano (0–12 anos) com texto automático para laudo.',
    icon: BabyIcon,
    path: '/ferramentas/ped-volume',
    badge: 'Novo',
    category: 'pediatria',
  },
  {
    id: 'volume-vesical-ped',
    title: 'Pediatria | Volume Vesical Esperado',
    description: 'Capacidade vesical esperada por idade (Koff 1983 / Holmdahl 1996) com comparação ao volume medido.',
    icon: BabyIcon,
    path: '/ferramentas/volume-vesical-ped',
    badge: null,
    category: 'pediatria',
  },
  // Row 2: Medicina Interna
  {
    id: 'medidas-adulto',
    title: 'Medicina Interna | Compêndio de Medidas Gerais',
    description: 'Valores usuais e pontos de corte em exames de adultos (US/geral), com calculadora de resíduo pós-miccional.',
    icon: Stethoscope,
    path: '/ferramentas/medidas-adulto',
    badge: null,
    category: 'medicina-interna',
  },
  {
    id: 'prova-motora-vb',
    title: 'Medicina Interna | Prova Motora da Vesícula Biliar',
    description: 'Fração de ejeção vesicular com múltiplos pontos de medida (jejum, 15, 30, 60 min). Entrada por dimensões ou volume direto.',
    icon: Stethoscope,
    path: '/ferramentas/prova-motora-vb',
    badge: null,
    category: 'medicina-interna',
  },
  {
    id: 'ti-rads',
    title: 'Medicina Interna | Calculadora TI-RADS',
    description: 'Pontuação e categoria TI-RADS (TR1–TR5) com recomendação de conduta por tamanho (FNA / follow-up).',
    icon: Stethoscope,
    path: '/ferramentas/ti-rads',
    badge: null,
    category: 'medicina-interna',
  },
  // Row 3: Vascular, Ginecologia, Obstetrícia
  {
    id: 'cimt-percentile',
    title: 'Vascular | Complexo Médiointimal (CMI)',
    description: 'Tabelas ELSA-Brasil, CAPS e MESA. Percentil por idade/sexo/etnia com alerta de placa (CMI > 1,5 mm). DIC/SBC 2019.',
    icon: Droplets,
    path: '/ferramentas/cimt-percentile',
    badge: null,
    category: 'vascular',
  },
  {
    id: 'orads-us',
    title: 'Ginecologia | Calculadora O-RADS',
    description: 'Classificação O-RADS 0–5 com recomendação de conduta baseada no algoritmo ACR (v2022).',
    icon: GynecologyIcon,
    path: '/ferramentas/orads-us',
    badge: null,
    category: 'ginecologia',
  },
  {
    id: 'crescimento-fetal',
    title: 'Obstetrícia | Crescimento Fetal (Biometria e EFW)',
    description: 'Percentis de HC, AC e FL (Snijders 1994) e peso fetal estimado (Hadlock 1985) com centis Nicolaides 2018.',
    icon: ObstetricsIcon,
    path: '/ferramentas/crescimento-fetal',
    badge: 'Novo',
    category: 'obstetricia',
  },
];

export function FerramentasGrid() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const meta = categoryMeta[tool.category];
        const isPediatric = tool.category === 'pediatria';

        return (
          <Card
            key={tool.id}
            className={`hover:shadow-md transition-shadow cursor-pointer group ${isPediatric ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30' : ''}`}
            onClick={() => navigate(tool.path)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isPediatric ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-primary/10'}`}>
                  <Icon className={`h-5 w-5 ${meta.iconColor}`} />
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
  );
}
