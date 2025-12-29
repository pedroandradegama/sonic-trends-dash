import { Activity, Brain, Heart, Stethoscope, Bone, Droplets } from 'lucide-react';

interface SubspecialtyIconProps {
  subspecialty: string;
  className?: string;
}

const subspecialtyConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  'cabeca-pescoco': {
    icon: Brain,
    label: 'Cabeça & Pescoço',
    color: 'text-purple-500',
  },
  'mamas': {
    icon: Heart,
    label: 'Mamas',
    color: 'text-pink-500',
  },
  'medicina-interna': {
    icon: Stethoscope,
    label: 'Medicina Interna',
    color: 'text-blue-500',
  },
  'ginecologia-obstetricia': {
    icon: Activity,
    label: 'Ginecologia & Obstetrícia',
    color: 'text-rose-500',
  },
  'msk': {
    icon: Bone,
    label: 'MSK',
    color: 'text-orange-500',
  },
  'vascular': {
    icon: Droplets,
    label: 'Vascular',
    color: 'text-red-500',
  },
};

export function SubspecialtyIcon({ subspecialty, className = '' }: SubspecialtyIconProps) {
  const config = subspecialtyConfig[subspecialty];
  
  if (!config) return null;
  
  const IconComponent = config.icon;
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`p-3 rounded-xl bg-gradient-to-br from-background to-muted shadow-lg border border-border/50`}>
        <IconComponent className={`h-8 w-8 ${config.color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Subespecialidade</p>
        <p className="font-semibold text-foreground">{config.label}</p>
      </div>
    </div>
  );
}

export { subspecialtyConfig };
