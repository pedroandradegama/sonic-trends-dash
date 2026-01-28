import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudioInputPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function AudioInputPanel({ value, onChange }: AudioInputPanelProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start recording timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: 'Gravação iniciada',
        description: 'Fale agora. Clique novamente para parar.',
      });
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log('Starting transcription, blob size:', audioBlob.size);
      
      // Create FormData to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke('transcribe-audio', {
        body: formData,
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error(fnError.message || 'Erro na transcrição');
      }

      if (data?.text) {
        onChange(value ? `${value}\n\n${data.text}` : data.text);
        toast({
          title: 'Transcrição concluída',
          description: 'Revise o texto abaixo e ajuste se necessário.',
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
      
      setIsTranscribing(false);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao transcrever o áudio. Tente novamente.');
      setIsTranscribing(false);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg bg-muted/30">
        <div className="relative">
          <Button
            type="button"
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={handleRecordClick}
            disabled={isTranscribing}
            className="h-24 w-24 rounded-full shadow-lg transition-all duration-300"
          >
            {isTranscribing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </Button>
          
          {isRecording && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full animate-pulse">
              {formatTime(recordingTime)}
            </span>
          )}
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            {isTranscribing 
              ? 'Transcrevendo áudio...' 
              : isRecording 
                ? 'Gravando... Clique para parar' 
                : 'Clique para gravar'}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
            <Volume2 className="h-3 w-3" />
            Transcrição via OpenAI Whisper
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="audio-text">Texto transcrito (edite se necessário)</Label>
        <Textarea
          id="audio-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="O texto transcrito do áudio aparecerá aqui. Você também pode digitar ou editar diretamente..."
          className="min-h-[150px]"
        />
        <p className="text-xs text-muted-foreground">
          Caracteres: {value.length}
        </p>
      </div>
    </div>
  );
}
