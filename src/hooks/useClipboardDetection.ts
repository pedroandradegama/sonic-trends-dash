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
      if (!text || text === lastDetectedRef.current) return;
      if (looksLikeLaudo(text)) {
        lastDetectedRef.current = text;
        callbackRef.current(text);
      }
    } catch {
      // Permission denied or not supported — fail silently
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Check permission silently
    let permissionOk = true;
    navigator.permissions?.query({ name: 'clipboard-read' as PermissionName }).then((result) => {
      if (result.state === 'denied') permissionOk = false;
    }).catch(() => { /* not supported */ });

    const handleVisibility = () => {
      if (permissionOk && document.visibilityState === 'visible') {
        readClipboard();
      }
    };

    const handleFocus = () => {
      if (permissionOk) readClipboard();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, readClipboard]);
}
