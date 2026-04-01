import { useState, useRef, useEffect } from 'react';
import { MapPin, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePresetClinics, PresetClinic } from '@/hooks/usePresetClinics';

interface PlaceResult { address: string; lat: number; lng: number; place_id: string }

interface Props {
  value?: string;
  onSelect: (result: PlaceResult & { presetClinicId?: string }) => void;
  className?: string;
}

export function ClinicAddressInput({ value, onSelect, className }: Props) {
  const { data: presets = [] } = usePresetClinics();
  const [query, setQuery] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.length >= 1
    ? presets.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.short_name?.toLowerCase().includes(query.toLowerCase()) ?? false)
      ).slice(0, 6)
    : [];

  useEffect(() => { setQuery(value ?? ''); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectPreset = (clinic: PresetClinic) => {
    setQuery(clinic.name);
    setOpen(false);
    onSelect({
      address: `${clinic.address}, ${clinic.city} - ${clinic.state}`,
      lat: clinic.lat ?? 0,
      lng: clinic.lng ?? 0,
      place_id: clinic.place_id ?? '',
      presetClinicId: clinic.id,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); selectPreset(filtered[highlighted]); }
    if (e.key === 'Escape')    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => query.length >= 1 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Digite o nome da clínica..."
        className="pl-9"
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
          {filtered.map((clinic, i) => (
            <button
              key={clinic.id}
              type="button"
              onMouseDown={() => selectPreset(clinic)}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                'w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors',
                highlighted === i ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{clinic.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {clinic.address}, {clinic.city}
                </p>
              </div>
              {clinic.short_name && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0 self-center">
                  {clinic.short_name}
                </span>
              )}
            </button>
          ))}
          <div className="px-3 py-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              Não encontrou? Continue digitando para busca livre.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
