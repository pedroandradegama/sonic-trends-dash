import { Building2 } from "lucide-react";
import RadioburgerCard from "./RadioburgerCard";
import AgendaCard from "./AgendaCard";
import RadarArtigosCard from "./RadarArtigosCard";
import FeriadosCard from "./FeriadosCard";

const InstitucionalPanel = () => {
  const nextRadioburgerDate = "2026-02-20";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Institucional</h2>
      </div>
      
      {/* Abertura de Agenda - Full Width */}
      <AgendaCard />

      {/* Radar de Artigos - Full Width */}
      <RadarArtigosCard />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeriadosCard />
        <RadioburgerCard nextDate={nextRadioburgerDate} />
      </div>
    </div>
  );
};

export default InstitucionalPanel;
