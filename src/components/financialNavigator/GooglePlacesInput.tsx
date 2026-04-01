import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Hash, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  place_id: string;
}

interface Props {
  value?: string;
  placeholder?: string;
  onSelect: (result: PlaceResult) => void;
  className?: string;
  mode?: 'cep_first' | 'places_only';
}

declare global {
  interface Window { google: any }
}

let scriptLoaded = false;

function loadGoogleScript(apiKey: string): Promise<void> {
  if (scriptLoaded || window.google?.maps?.places) {
    scriptLoaded = true;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`;
    script.async = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    document.head.appendChild(script);
  });
}

async function fetchViaCep(cep: string): Promise<{
  logradouro: string; bairro: string; localidade: string; uf: string;
} | null> {
  try {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return null;
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch { return null; }
}

export function GooglePlacesInput({ value, placeholder, onSelect, className, mode = 'places_only' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value ?? '');
  const [cepValue, setCepValue] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [cepFilled, setCepFilled] = useState(false);
  const [activeTab, setActiveTab] = useState<'cep' | 'manual'>(mode === 'cep_first' ? 'cep' : 'manual');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  useEffect(() => {
    if (!apiKey) return;
    if (mode === 'cep_first' && activeTab === 'cep') return;
    loadGoogleScript(apiKey).then(() => {
      if (!inputRef.current) return;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'br' },
        fields: ['formatted_address', 'geometry', 'place_id'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        const result: PlaceResult = {
          address: place.formatted_address ?? '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          place_id: place.place_id ?? '',
        };
        setInputValue(result.address);
        onSelect(result);
      });
    });
  }, [apiKey, activeTab, mode]);

  useEffect(() => { setInputValue(value ?? ''); }, [value]);

  const handleCepSearch = async () => {
    const clean = cepValue.replace(/\D/g, '');
    if (clean.length !== 8) { setCepError('CEP inválido — 8 dígitos'); return; }
    setCepLoading(true);
    setCepError('');
    const data = await fetchViaCep(clean);
    setCepLoading(false);
    if (!data) { setCepError('CEP não encontrado'); return; }
    const addr = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
    setInputValue(addr);
    setCepFilled(true);
    if (apiKey) {
      loadGoogleScript(apiKey).then(() => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: addr }, (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            onSelect({
              address: addr,
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
              place_id: results[0].place_id ?? '',
            });
          } else {
            onSelect({ address: addr, lat: 0, lng: 0, place_id: '' });
          }
        });
      });
    } else {
      onSelect({ address: addr, lat: 0, lng: 0, place_id: '' });
    }
  };

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
  };

  if (mode === 'places_only') {
    return (
      <div className={cn('relative', className)}>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={placeholder ?? 'Buscar endereço...'}
          className="pl-9"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        {(['cep', 'manual'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); setCepFilled(false); setCepError(''); }}
            className={cn(
              'px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5',
              activeTab === tab
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            {tab === 'cep' ? <><Hash className="h-3 w-3" />Buscar por CEP</> : <><MapPin className="h-3 w-3" />Digitar endereço</>}
          </button>
        ))}
      </div>

      {activeTab === 'cep' ? (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              value={cepValue}
              onChange={e => { setCepValue(formatCep(e.target.value)); setCepError(''); setCepFilled(false); }}
              onKeyDown={e => e.key === 'Enter' && handleCepSearch()}
              placeholder="00000-000"
              className="w-36 font-mono text-sm"
              maxLength={9}
            />
            <button
              type="button"
              onClick={handleCepSearch}
              disabled={cepLoading}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              {cepLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
            </button>
          </div>
          {cepError && <p className="text-xs text-destructive">{cepError}</p>}
          {cepFilled && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <MapPin className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400">{inputValue}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Rua, bairro, cidade..."
            className="pl-9"
          />
        </div>
      )}
    </div>
  );
}
