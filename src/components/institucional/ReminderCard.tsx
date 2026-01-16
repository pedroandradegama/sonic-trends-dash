import { useState, useEffect } from "react";
import { Bell, BellOff, Calendar, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useReminderPreferences, ReminderFrequency } from "@/hooks/useReminderPreferences";

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "quarterly", label: "Trimestral" },
];

const DAY_OPTIONS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

const ReminderCard = () => {
  const { preference, isLoading, isSaving, savePreference } = useReminderPreferences();
  
  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState<ReminderFrequency>("weekly");
  const [preferredDay, setPreferredDay] = useState<string>("1"); // Monday by default
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with existing preference
  useEffect(() => {
    if (preference) {
      setIsActive(preference.is_active);
      setFrequency(preference.frequency);
      setPreferredDay(preference.preferred_day?.toString() || "1");
    }
  }, [preference]);

  // Track changes
  useEffect(() => {
    if (!preference) {
      setHasChanges(isActive);
    } else {
      const changed =
        isActive !== preference.is_active ||
        frequency !== preference.frequency ||
        preferredDay !== (preference.preferred_day?.toString() || "1");
      setHasChanges(changed);
    }
  }, [isActive, frequency, preferredDay, preference]);

  const handleSave = () => {
    savePreference(frequency, parseInt(preferredDay), isActive);
    setHasChanges(false);
  };

  const getFrequencyDescription = () => {
    const dayLabel = DAY_OPTIONS.find(d => d.value === preferredDay)?.label || "Segunda-feira";
    switch (frequency) {
      case "weekly":
        return `Toda ${dayLabel}`;
      case "biweekly":
        return `A cada 15 dias (${dayLabel})`;
      case "quarterly":
        return `A cada 3 meses (${dayLabel})`;
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <CardTitle className="text-lg">Lembrete de Acesso</CardTitle>
        </div>
        <CardDescription>
          Receba lembretes por email para acessar a plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle para ativar/desativar */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="reminder-active" className="text-base">
              Ativar lembretes
            </Label>
            <p className="text-sm text-muted-foreground">
              {isActive ? "Você receberá emails de lembrete" : "Lembretes desativados"}
            </p>
          </div>
          <Switch
            id="reminder-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        {/* Opções de configuração (só aparecem quando ativo) */}
        {isActive && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2">
            {/* Periodicidade */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Periodicidade
              </Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as ReminderFrequency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dia de preferência */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dia de preferência
              </Label>
              <Select value={preferredDay} onValueChange={setPreferredDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resumo */}
            <div className="rounded-lg bg-primary/5 p-3 text-sm">
              <span className="font-medium text-primary">Resumo:</span>{" "}
              <span className="text-muted-foreground">{getFrequencyDescription()}</span>
            </div>
          </div>
        )}

        {/* Botão salvar */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar preferências"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReminderCard;
