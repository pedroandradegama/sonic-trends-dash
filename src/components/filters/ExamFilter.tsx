import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface ExamFilterProps {
  selectedExams: string[];
  onExamsChange: (exams: string[]) => void;
  availableExams: string[];
}

export function ExamFilter({ selectedExams, onExamsChange, availableExams }: ExamFilterProps) {
  const handleExamToggle = (exam: string, checked: boolean) => {
    if (checked) {
      onExamsChange([...selectedExams, exam]);
    } else {
      onExamsChange(selectedExams.filter(e => e !== exam));
    }
  };

  const handleRemoveExam = (exam: string) => {
    onExamsChange(selectedExams.filter(e => e !== exam));
  };

  const handleClearAll = () => {
    onExamsChange([]);
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-48 justify-start">
            {selectedExams.length === 0 ? "Todos os exames" : `${selectedExams.length} selecionado(s)`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Tipos de Exame</h4>
              {selectedExams.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Limpar todos
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableExams.map(exam => (
                <div key={exam} className="flex items-center space-x-2">
                  <Checkbox
                    id={exam}
                    checked={selectedExams.includes(exam)}
                    onCheckedChange={(checked) => handleExamToggle(exam, checked === true)}
                  />
                  <label htmlFor={exam} className="text-sm cursor-pointer flex-1">
                    {exam}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedExams.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-md">
          {selectedExams.map(exam => (
            <Badge key={exam} variant="secondary" className="text-xs">
              {exam}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleRemoveExam(exam)}
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