import { useState, useEffect } from "react";
import { User, Calendar, Music, Coffee, Bell, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDoctorPreferences } from "@/hooks/useDoctorPreferences";
import ReminderCard from "@/components/institucional/ReminderCard";

export function PerfilPanel() {
  const { profile } = useUserProfile();
  const { preferences, isLoading, isSaving, savePreferences } = useDoctorPreferences();

  const [schedulingProfile, setSchedulingProfile] = useState<"combo" | "rotatividade">("combo");
  const [overbookingEnabled, setOverbookingEnabled] = useState(false);
  const [overbookingPercentage, setOverbookingPercentage] = useState<string>("10");
  const [overbookingTimeSlot, setOverbookingTimeSlot] = useState<string>("inicio");
  const [ambientMusic, setAmbientMusic] = useState(false);
  const [musicGenre, setMusicGenre] = useState("");
  const [coffee, setCoffee] = useState(false);
  const [tea, setTea] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setSchedulingProfile(preferences.scheduling_profile);
      setOverbookingEnabled(preferences.overbooking_enabled);
      setOverbookingPercentage(preferences.overbooking_percentage?.toString() || "10");
      setOverbookingTimeSlot(preferences.overbooking_time_slot || "inicio");
      setAmbientMusic(preferences.ambient_music);
      setMusicGenre(preferences.music_genre || "");
      setCoffee(preferences.coffee);
      setTea(preferences.tea);
    }
  }, [preferences]);

  useEffect(() => {
    if (!preferences) {
      setHasChanges(true);
      return;
    }
    const changed =
      schedulingProfile !== preferences.scheduling_profile ||
      overbookingEnabled !== preferences.overbooking_enabled ||
      (overbookingEnabled && overbookingPercentage !== (preferences.overbooking_percentage?.toString() || "10")) ||
      (overbookingEnabled && overbookingTimeSlot !== (preferences.overbooking_time_slot || "inicio")) ||
      ambientMusic !== preferences.ambient_music ||
      (ambientMusic && musicGenre !== (preferences.music_genre || "")) ||
      coffee !== preferences.coffee ||
      tea !== preferences.tea;
    setHasChanges(changed);
  }, [schedulingProfile, overbookingEnabled, overbookingPercentage, overbookingTimeSlot, ambientMusic, musicGenre, coffee, tea, preferences]);

  const handleSave = () => {
    savePreferences({
      scheduling_profile: schedulingProfile,
      overbooking_enabled: overbookingEnabled,
      overbooking_percentage: overbookingEnabled ? parseInt(overbookingPercentage) : null,
      overbooking_time_slot: overbookingEnabled ? overbookingTimeSlot : null,
      ambient_music: ambientMusic,
      music_genre: ambientMusic ? musicGenre : null,
      coffee,
      tea,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Meu Perfil</h2>
      </div>

      {profile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Informações do Médico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Nome</Label>
                <p className="font-medium">{profile.medico_nome}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduling Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Perfil de Agendamento
          </CardTitle>
          <CardDescription>Indique sua preferência para organização da agenda</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={schedulingProfile}
            onValueChange={(v) => setSchedulingProfile(v as "combo" | "rotatividade")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="combo" id="combo" className="mt-0.5" />
              <div>
                <Label htmlFor="combo" className="text-base font-medium cursor-pointer">
                  Combos de exames
                </Label>
                <p className="text-sm text-muted-foreground">
                  Quantidade menor de pacientes, com "combos" de exames por paciente
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="rotatividade" id="rotatividade" className="mt-0.5" />
              <div>
                <Label htmlFor="rotatividade" className="text-base font-medium cursor-pointer">
                  Maior rotatividade
                </Label>
                <p className="text-sm text-muted-foreground">
                  Quantidade maior de pacientes, com maior rotatividade de sala
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Overbooking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Política de Overbooking
          </CardTitle>
          <CardDescription>Aceita vagas adicionais além do agendamento regular?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="overbooking" className="text-base">Aceitar overbooking</Label>
              <p className="text-sm text-muted-foreground">
                {overbookingEnabled ? "Vagas extras serão adicionadas à sua agenda" : "Sem vagas extras"}
              </p>
            </div>
            <Switch id="overbooking" checked={overbookingEnabled} onCheckedChange={setOverbookingEnabled} />
          </div>

          {overbookingEnabled && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2">
              <div className="space-y-2">
                <Label>Percentual de vagas a mais</Label>
                <RadioGroup value={overbookingPercentage} onValueChange={setOverbookingPercentage} className="flex gap-3">
                  {["10", "20", "30"].map((pct) => (
                    <div key={pct} className="flex items-center space-x-2 rounded-lg border px-4 py-2 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value={pct} id={`pct-${pct}`} />
                      <Label htmlFor={`pct-${pct}`} className="cursor-pointer">{pct}%</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Horário preferencial para vagas adicionais</Label>
                <RadioGroup value={overbookingTimeSlot} onValueChange={setOverbookingTimeSlot} className="flex gap-3">
                  {[
                    { value: "inicio", label: "Início" },
                    { value: "meio", label: "Meio" },
                    { value: "fim", label: "Fim" },
                  ].map((slot) => (
                    <div key={slot.value} className="flex items-center space-x-2 rounded-lg border px-4 py-2 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value={slot.value} id={`slot-${slot.value}`} />
                      <Label htmlFor={`slot-${slot.value}`} className="cursor-pointer">{slot.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            Particularidades Adicionais
          </CardTitle>
          <CardDescription>Preferências de conforto durante os atendimentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Music */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Music className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="music" className="text-base">Música ambiente</Label>
                  <p className="text-sm text-muted-foreground">Deseja música durante os atendimentos?</p>
                </div>
              </div>
              <Switch id="music" checked={ambientMusic} onCheckedChange={setAmbientMusic} />
            </div>

            {ambientMusic && (
              <div className="pl-4 animate-in fade-in-0 slide-in-from-top-2">
                <Label htmlFor="genre">Gênero musical preferencial</Label>
                <Input
                  id="genre"
                  value={musicGenre}
                  onChange={(e) => setMusicGenre(e.target.value)}
                  placeholder="Ex: Jazz, Lo-fi, Clássica, MPB..."
                  className="mt-1 max-w-sm"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Drinks */}
          <div className="space-y-3">
            <Label className="text-base flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Bebidas durante atendimentos
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2 rounded-lg border px-4 py-3 hover:bg-accent/50 transition-colors">
                <Switch id="coffee" checked={coffee} onCheckedChange={setCoffee} />
                <Label htmlFor="coffee" className="cursor-pointer">☕ Café</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border px-4 py-3 hover:bg-accent/50 transition-colors">
                <Switch id="tea" checked={tea} onCheckedChange={setTea} />
                <Label htmlFor="tea" className="cursor-pointer">🍵 Chá</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="w-full" size="lg">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar preferências
          </>
        )}
      </Button>

      <Separator />

      {/* Reminder Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Lembrete de Acesso</h3>
        </div>
        <ReminderCard />
      </div>
    </div>
  );
}
