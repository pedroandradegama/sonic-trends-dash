import { useEffect, useRef, useCallback } from 'react';

interface UseClipboardDetectionOptions {
  enabled: boolean;
  onLaudoDetected: (text: string) => void;
}

const LAUDO_TERMS = [
  'cm', 'mm', 'ecogenicidade', 'ecogênico', 'parênquima', 'contornos',
  'dimensões', 'medindo', 'lobo', 'vesícula', 'útero', 'ovário',
  'tireoide', 'nódulo', 'cisto', 'hiperecogênico', 'hipoecogênico',
  'doppler', 'fluxo', 'bi-rads', 'birads', 'ti-rads', 'tirads',
  'o-rads', 'li-rads', 'pi-rads', 'conclusão', 'impressão diagnóstica', 'achados',
];

function looksLikeLaudo(text: string): boolean {
  if (text.length < 80) return false;
  const lower = text.toLowerCase();
  return LAUDO_TERMS.some((term) => lower.includes(term));
}

export function useClipboardDetection({ enabled, onLaudoDetected }: UseClipboardDetectionOptions): void {
  const lastDetectedRef = useRef<string | null>(null);
  const callbackRef = useRef(onLaudoDetected);
  callbackRef.current = onLaudoDetected;

  const readClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      
      // Only skip if it's the exact same text AND was already detected
      // Reset lastDetectedRef when clipboard content changes to non-laudo text
      if (text === lastDetectedRef.current) return;
      
      if (looksLikeLaudo(text)) {
        lastDetectedRef.current = text;
        callbackRef.current(text);
      } else {
        // Content changed to something that's not a laudo — reset so next laudo triggers
        lastDetectedRef.current = null;
      }
    } catch {
      // Permission denied or not supported — fail silently
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Reset when disabled so re-enabling picks up current clipboard
      lastDetectedRef.current = null;
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to let clipboard update settle
        setTimeout(() => readClipboard(), 300);
      }
    };

    const handleFocus = () => {
      setTimeout(() => readClipboard(), 300);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, readClipboard]);
}
