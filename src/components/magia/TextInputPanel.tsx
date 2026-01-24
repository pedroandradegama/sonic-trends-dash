import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TextInputPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextInputPanel({ value, onChange }: TextInputPanelProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="case">História clínica + achados ultrassonográficos</Label>
      <Textarea
        id="case"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Exemplo: Mulher 34 anos, dor pélvica crônica há 6 meses. US TV: cisto simples de 3,2 cm em ovário direito, parede fina, sem septos/vegetações, Doppler sem hipervascularização..."
        className="min-h-[200px]"
      />
      <p className="text-xs text-muted-foreground">
        Mínimo 20 caracteres. Atual: {value.length}
      </p>
    </div>
  );
}
