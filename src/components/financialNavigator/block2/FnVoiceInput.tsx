import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FnVoicePreviewSheet } from './FnVoicePreviewSheet';
import { VoiceAction } from '@/types/financialNavigator';
import { toast } from 'sonner';

type RecordState = 'idle' | 'recording' | 'processing';

export function FnVoiceInput() {
  const [state, setState] = useState<RecordState>('idle');
  const [actions, setActions] = useState<VoiceAction[]>([]);
  const [transcript, setTranscript] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = handleStop;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setState('recording');
    } catch {
      toast.error('Permissão de microfone negada.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setState('processing');
  };

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const form = new FormData();
    form.append('audio', blob, 'audio.webm');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fn-voice-to-shifts`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: form,
        }
      );
      const result = await res.json();
      setTranscript(result.transcript ?? '');
      setActions(result.actions ?? []);
      setPreviewOpen(true);
    } catch {
      toast.error('Erro ao processar áudio. Tente novamente.');
    } finally {
      setState('idle');
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-4 z-50">
        {state === 'recording' ? (
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={stopRecording}
          >
            <MicOff className="h-5 w-5" />
          </Button>
        ) : state === 'processing' ? (
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg"
            disabled
          >
            <Loader2 className="h-5 w-5 animate-spin" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={startRecording}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>

      {state === 'recording' && (
        <div className="fixed bottom-24 right-4 bg-background border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground shadow-md max-w-[200px] z-50 font-body">
          Gravando... Fale os turnos e toque para parar.
          <br />
          <span className="text-[10px] opacity-70">
            Ex: "IMAG dia 26, manhã; RHP plantão 24h dia 25"
          </span>
        </div>
      )}

      <FnVoicePreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        transcript={transcript}
        actions={actions}
        onActionsChange={setActions}
      />
    </>
  );
}
