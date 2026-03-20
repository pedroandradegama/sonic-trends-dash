import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClipboardToastProps {
  text: string;
  onConfirm: (text: string) => void;
  onDismiss: () => void;
}

export function ClipboardToast({ text, onConfirm, onDismiss }: ClipboardToastProps) {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const duration = 8000;

    const frame = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct <= 0) {
        onDismiss();
        return;
      }
      timerRef.current = setTimeout(frame, 50);
    };

    timerRef.current = setTimeout(frame, 50);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onDismiss]);

  const preview = text.length > 60 ? text.slice(0, 60) + '...' : text;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
      <div className="bg-card border border-border/50 rounded-2xl shadow-lg p-4 overflow-hidden">
        <div className="flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">Laudo detectado no clipboard</span>
        </div>

        <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-2 py-1 mt-1 line-clamp-2">
          {preview}
        </p>

        <div className="flex gap-2 mt-3">
          <Button size="sm" className="rounded-xl" onClick={() => onConfirm(text)}>
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Revisar agora
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={onDismiss}>
            Ignorar
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-0.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/40 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
