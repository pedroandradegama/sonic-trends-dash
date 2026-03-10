import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';
import { CalendarClock, LayoutGrid, ArrowRight } from 'lucide-react';
import imagLogoNew from '@/assets/imag-logo-new.png';

type ModeOption = 'agenda' | 'avancado';

const modes: { key: ModeOption; label: string; description: string; icon: typeof CalendarClock }[] = [
  {
    key: 'agenda',
    label: 'Modo Agenda',
    description: 'Acesso rápido às ferramentas e IA. Ideal para o plantão.',
    icon: CalendarClock,
  },
  {
    key: 'avancado',
    label: 'Modo Avançado',
    description: 'Todos os módulos: agenda, trabalho, comunidade e ferramentas.',
    icon: LayoutGrid,
  },
];

export default function ModeSelection() {
  const [selected, setSelected] = useState<ModeOption | null>(null);
  const { setMode } = useAppMode();
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (!selected) return;
    setMode(selected);
    navigate(selected === 'agenda' ? '/ferramentas-ia' : '/home', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[350px] h-[350px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-fade-in">
        {/* Logo */}
        <img src={imagLogoNew} alt="IMAG" className="h-10 mb-8 opacity-80" />

        {/* Heading */}
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
          Como deseja usar o portal?
        </h1>
        <p className="text-muted-foreground text-center mb-10 text-sm md:text-base">
          Você pode alterar isso depois no seu perfil.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full mb-10">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = selected === m.key;

            return (
              <button
                key={m.key}
                onClick={() => setSelected(m.key)}
                className={cn(
                  "relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center group",
                  "hover:shadow-lg hover:-translate-y-1",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                    : "border-border/60 bg-card hover:border-primary/40"
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  "absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                )}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Icon */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <Icon className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground mb-1">{m.label}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">{m.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className={cn(
            "flex items-center gap-2 px-8 py-3 rounded-xl font-display font-semibold text-base transition-all duration-300",
            selected
              ? "bg-primary text-primary-foreground hover:bg-primary-dark shadow-md hover:shadow-lg"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Continuar
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
