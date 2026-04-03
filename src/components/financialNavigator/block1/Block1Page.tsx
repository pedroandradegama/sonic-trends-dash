import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DoctorProfileForm } from './DoctorProfileForm';
import { ServiceList } from './ServiceList';
import { ServiceFormSheet } from './ServiceFormSheet';
import { useFnConfig } from '@/hooks/useFnConfig';

export function Block1Page() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const { services, isLoading } = useFnConfig();

  const editingService = editingServiceId
    ? services.find(s => s.id === editingServiceId) ?? null
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Seção: Perfil pessoal */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 font-body">
          Perfil pessoal
        </h2>
        <DoctorProfileForm />
      </div>

      {/* Seção: Serviços */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-body">
            Serviços ({services.length})
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setEditingServiceId(null); setSheetOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adicionar serviço
          </Button>
        </div>
        <ServiceList
          services={services}
          onEdit={id => { setEditingServiceId(id); setSheetOpen(true); }}
        />
      </div>

      <ServiceFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        service={editingService}
      />
    </div>
  );
}
