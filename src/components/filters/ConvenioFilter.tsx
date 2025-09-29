import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface ConvenioFilterProps {
  selectedConvenios: string[];
  onConveniosChange: (convenios: string[]) => void;
  availableConvenios: string[];
}

export function ConvenioFilter({ selectedConvenios, onConveniosChange, availableConvenios }: ConvenioFilterProps) {
  const handleConvenioToggle = (convenio: string, checked: boolean) => {
    if (checked) {
      onConveniosChange([...selectedConvenios, convenio]);
    } else {
      onConveniosChange(selectedConvenios.filter(c => c !== convenio));
    }
  };

  const handleRemoveConvenio = (convenio: string) => {
    onConveniosChange(selectedConvenios.filter(c => c !== convenio));
  };

  const handleClearAll = () => {
    onConveniosChange([]);
  };

  // Separate particular from others
  const particularConvenios = availableConvenios.filter(c => 
    c.toLowerCase().includes('particular') || c.toLowerCase().includes('privado')
  );
  const otherConvenios = availableConvenios.filter(c => 
    !c.toLowerCase().includes('particular') && !c.toLowerCase().includes('privado')
  );

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-48 justify-start">
            {selectedConvenios.length === 0 ? "Todos os convênios" : `${selectedConvenios.length} selecionado(s)`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Convênios</h4>
              {selectedConvenios.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Limpar todos
                </Button>
              )}
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {particularConvenios.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Particular</h5>
                  <div className="space-y-2">
                    {particularConvenios.map(convenio => (
                      <div key={convenio} className="flex items-center space-x-2">
                        <Checkbox
                          id={convenio}
                          checked={selectedConvenios.includes(convenio)}
                          onCheckedChange={(checked) => handleConvenioToggle(convenio, checked === true)}
                        />
                        <label htmlFor={convenio} className="text-sm cursor-pointer flex-1">
                          {convenio}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {otherConvenios.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Convênios</h5>
                  <div className="space-y-2">
                    {otherConvenios.map(convenio => (
                      <div key={convenio} className="flex items-center space-x-2">
                        <Checkbox
                          id={convenio}
                          checked={selectedConvenios.includes(convenio)}
                          onCheckedChange={(checked) => handleConvenioToggle(convenio, checked === true)}
                        />
                        <label htmlFor={convenio} className="text-sm cursor-pointer flex-1">
                          {convenio}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedConvenios.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-md">
          {selectedConvenios.map(convenio => (
            <Badge key={convenio} variant="secondary" className="text-xs">
              {convenio}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleRemoveConvenio(convenio)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}