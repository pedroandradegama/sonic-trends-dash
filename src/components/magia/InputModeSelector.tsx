import { Mic, Type, ClipboardList } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type InputMode = 'audio' | 'text' | 'structured';

interface InputModeSelectorProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

export function InputModeSelector({ mode, onModeChange }: InputModeSelectorProps) {
  return (
    <Tabs value={mode} onValueChange={(v) => onModeChange(v as InputMode)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="audio" className="flex items-center gap-2">
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">Áudio</span>
        </TabsTrigger>
        <TabsTrigger value="text" className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          <span className="hidden sm:inline">Texto Livre</span>
        </TabsTrigger>
        <TabsTrigger value="structured" className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          <span className="hidden sm:inline">Estruturado</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
