import { Building2 } from "lucide-react";
import RadioburgerCard from "./RadioburgerCard";

const InstitucionalPanel = () => {
  // Data do próximo Radioburger - pode ser atualizada conforme necessário
  const nextRadioburgerDate = "2026-02-20";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Institucional</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RadioburgerCard nextDate={nextRadioburgerDate} />
      </div>
    </div>
  );
};

export default InstitucionalPanel;
