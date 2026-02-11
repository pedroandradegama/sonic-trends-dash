import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompendioTab } from './medidas-adulto/CompendioTab';
import { PVRTab } from './medidas-adulto/PVRTab';

export function MedidasAdultoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compêndio — Medidas de Referência (Adulto)</h1>
        <p className="text-muted-foreground mt-1">
          Valores usuais, pontos de corte e calculadoras para exames de adultos
        </p>
      </div>

      <Tabs defaultValue="compendio" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-2 h-auto">
          <TabsTrigger value="compendio" className="text-xs md:text-sm py-2">Compêndio</TabsTrigger>
          <TabsTrigger value="pvr" className="text-xs md:text-sm py-2">Pós-miccional (PVR)</TabsTrigger>
        </TabsList>

        <TabsContent value="compendio"><CompendioTab /></TabsContent>
        <TabsContent value="pvr"><PVRTab /></TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center border-t pt-4">
        Ferramenta de suporte à decisão. Valores variam conforme técnica, biotipo, protocolo e contexto clínico. Não substitui julgamento clínico.
      </p>
    </div>
  );
}
