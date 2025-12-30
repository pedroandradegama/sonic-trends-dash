import { Brain, Stethoscope, Bone, Droplets } from 'lucide-react';

interface SubspecialtyIconProps {
  subspecialty: string;
  className?: string;
}

// Custom Breast Icon SVG component
const BreastIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* Stylized breast silhouette - medical/anatomical representation */}
    <path d="M12 4C8 4 5 7 5 11C5 15 7 19 12 20C17 19 19 15 19 11C19 7 16 4 12 4Z" />
    <circle cx="12" cy="13" r="2" />
  </svg>
);

// Custom Uterus/Female reproductive icon
const GynecologyIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* Stylized uterus representation */}
    <path d="M12 20V14" />
    <path d="M12 14C12 14 8 14 6 10C4 6 6 4 8 4C10 4 12 6 12 8" />
    <path d="M12 14C12 14 16 14 18 10C20 6 18 4 16 4C14 4 12 6 12 8" />
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
  </svg>
);

const subspecialtyConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  'cabeca-pescoco': {
    icon: Brain,
    label: 'Cabeça & Pescoço',
    color: 'text-purple-500',
  },
  'mamas': {
    icon: BreastIcon,
    label: 'Mamas',
    color: 'text-pink-500',
  },
  'medicina-interna': {
    icon: Stethoscope,
    label: 'Medicina Interna',
    color: 'text-blue-500',
  },
  'ginecologia-obstetricia': {
    icon: GynecologyIcon,
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
