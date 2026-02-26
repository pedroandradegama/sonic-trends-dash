import { useState, useEffect } from "react";
import { User, Bell, Camera, Loader2, Save, MessageSquare, BookOpen, Clock } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function PerfilPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { preferences, isLoading, isSaving, savePreferences } = useDoctorPreferences();
  const { toast } = useToast();

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // WhatsApp number
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Digest preferences
  const [digestActive, setDigestActive] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState("weekly");
  const [digestArticleLimit, setDigestArticleLimit] = useState("5");
  const [digestReadingTime, setDigestReadingTime] = useState("5");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setAvatarUrl((profile as any).avatar_url || null);
      setWhatsappNumber((profile as any).whatsapp_number || "");
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      setDigestActive(preferences.digest_active);
      setDigestFrequency(preferences.digest_frequency || "weekly");
      setDigestArticleLimit((preferences.digest_article_limit || 5).toString());
      setDigestReadingTime((preferences.digest_reading_time || 5).toString());
    }
  }, [preferences]);

  useEffect(() => {
    if (!preferences && !profile) {
      setHasChanges(false);
      return;
    }
    const profileChanged =
      whatsappNumber !== ((profile as any)?.whatsapp_number || "");
    const prefsChanged = preferences
      ? digestActive !== preferences.digest_active ||
        digestFrequency !== (preferences.digest_frequency || "weekly") ||
        digestArticleLimit !== (preferences.digest_article_limit || 5).toString() ||
        digestReadingTime !== (preferences.digest_reading_time || 5).toString()
      : digestActive || digestFrequency !== "weekly" || digestArticleLimit !== "5" || digestReadingTime !== "5";
    setHasChanges(profileChanged || prefsChanged);
  }, [whatsappNumber, digestActive, digestFrequency, digestArticleLimit, digestReadingTime, profile, preferences]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("user_id", user.id);

      setAvatarUrl(newUrl);
      toast({ title: "Foto atualizada", description: "Sua foto de perfil foi salva." });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (user) {
      // Save whatsapp number to profiles
      await supabase
        .from("profiles")
        .update({ whatsapp_number: whatsappNumber || null })
        .eq("user_id", user.id);
    }
    // Save digest preferences
    savePreferences({
      digest_active: digestActive,
      digest_frequency: digestFrequency,
      digest_article_limit: parseInt(digestArticleLimit),
      digest_reading_time: parseInt(digestReadingTime),
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

      {/* Profile Info + Avatar */}
      {profile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Informações do Médico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome</Label>
                  <p className="font-medium">{profile.medico_nome}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="5581999999999"
                className="max-w-sm"
              />
              <p className="text-xs text-muted-foreground">Formato internacional sem + (ex: 5581912345678)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Digest Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Digest de Artigos
          </CardTitle>
          <CardDescription>Receba resumos de artigos científicos via WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="digest-active" className="text-base">Receber digest de artigos</Label>
              <p className="text-sm text-muted-foreground">
                {digestActive ? "Você receberá resumos periódicos" : "Digest desativado"}
              </p>
            </div>
            <Switch id="digest-active" checked={digestActive} onCheckedChange={setDigestActive} />
          </div>

          {digestActive && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2">
              {/* Frequency */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Frequência de recebimento
                </Label>
                <RadioGroup value={digestFrequency} onValueChange={setDigestFrequency} className="flex gap-3">
                  {[
                    { value: "weekly", label: "Semanal" },
                    { value: "biweekly", label: "Quinzenal" },
                    { value: "monthly", label: "Mensal" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2 rounded-lg border px-4 py-2 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value={opt.value} id={`freq-${opt.value}`} />
                      <Label htmlFor={`freq-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Article limit */}
              <div className="space-y-2">
                <Label>Máximo de artigos por envio</Label>
                <Select value={digestArticleLimit} onValueChange={setDigestArticleLimit}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["3", "5", "10", "15", "20"].map((n) => (
                      <SelectItem key={n} value={n}>{n} artigos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reading time */}
              <div className="space-y-2">
                <Label>Tempo de leitura por artigo</Label>
                <RadioGroup value={digestReadingTime} onValueChange={setDigestReadingTime} className="space-y-2">
                  {[
                    { value: "3", label: "3 minutos", desc: "Destaques principais" },
                    { value: "5", label: "5 minutos", desc: "Resumo completo" },
                    { value: "10", label: "10 minutos", desc: "Leitura aprofundada" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value={opt.value} id={`reading-${opt.value}`} className="mt-0.5" />
                      <div>
                        <Label htmlFor={`reading-${opt.value}`} className="cursor-pointer font-medium">{opt.label}</Label>
                        <p className="text-sm text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Next dispatch info */}
              {preferences?.digest_next_dispatch && (
                <div className="rounded-lg bg-primary/5 p-3 text-sm">
                  <span className="font-medium text-primary">Próximo digest:</span>{" "}
                  <span className="text-muted-foreground">
                    {new Date(preferences.digest_next_dispatch).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
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
