import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

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
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces?: () => void;
  }
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

export function GooglePlacesInput({ value, placeholder, onSelect, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value ?? '');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  useEffect(() => {
    if (!apiKey) return;
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
  }, [apiKey]);

  useEffect(() => { setInputValue(value ?? ''); }, [value]);

  return (
    <div className={`relative ${className ?? ''}`}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
