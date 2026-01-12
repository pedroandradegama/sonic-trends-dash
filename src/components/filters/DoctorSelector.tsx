import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

interface Doctor {
  user_id: string;
  email: string;
  medico_nome: string;
}

interface DoctorSelectorProps {
  doctors: Doctor[];
  selectedDoctor: string | null;
  onDoctorChange: (doctorName: string | null) => void;
  currentUserName?: string;
}

export function DoctorSelector({ 
  doctors, 
  selectedDoctor, 
  onDoctorChange,
  currentUserName 
}: DoctorSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedDoctor || 'all'}
        onValueChange={(value) => onDoctorChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[280px] bg-background">
          <SelectValue placeholder="Selecione um médico" />
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-lg z-50">
          <SelectItem value="all">Todos os médicos</SelectItem>
          {doctors.map((doctor) => (
            <SelectItem key={doctor.user_id} value={doctor.medico_nome}>
              {doctor.medico_nome}
              {doctor.medico_nome === currentUserName && ' (Você)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
