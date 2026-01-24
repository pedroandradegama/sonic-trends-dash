import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface AudioInputPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function AudioInputPanel({ value, onChange }: AudioInputPanelProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
        
        // Transcribe using Web Speech API as fallback
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
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
      // Using Web Speech API for transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // For now, we'll use a simple approach - in production you'd use OpenAI Whisper
        toast({
          title: 'Transcrição concluída',
          description: 'Revise o texto abaixo e ajuste se necessário.',
        });
        
        // Placeholder - in real implementation, send to Whisper API
        setIsTranscribing(false);
        toast({
          title: 'Áudio capturado',
          description: 'Transcrição por áudio requer integração com Whisper API. Por enquanto, digite o texto manualmente.',
        });
      } else {
        setError('Seu navegador não suporta transcrição de áudio. Use Chrome ou Edge.');
        setIsTranscribing(false);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Erro ao transcrever o áudio. Tente novamente.');
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg">
        <Button
          type="button"
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          onClick={handleRecordClick}
          disabled={isTranscribing}
          className="h-20 w-20 rounded-full"
        >
          {isTranscribing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
        
        <p className="text-sm text-muted-foreground text-center">
          {isTranscribing 
            ? 'Transcrevendo áudio...' 
            : isRecording 
              ? 'Gravando... Clique para parar' 
              : 'Clique para gravar'}
        </p>
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
