import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GooglePlacesInput } from '../GooglePlacesInput';
import { useFnConfig } from '@/hooks/useFnConfig';
import { FnDoctorProfile } from '@/types/financialNavigator';
import { Check, Pencil, MapPin, Target } from 'lucide-react';

export function DoctorProfileForm() {
  const { doctorProfile, saveProfile } = useFnConfig();
  const [form, setForm] = useState<Partial<FnDoctorProfile & { whatsapp_number?: string; whatsapp_digest_enabled?: boolean }>>({
    home_address: '',
    monthly_net_goal: 0,
    include_13th: false,
    include_vacation: false,
    whatsapp_number: '',
    whatsapp_digest_enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);

  useEffect(() => {
    if (doctorProfile) setForm(doctorProfile);
  }, [doctorProfile]);

  const handleSave = async () => {
    setSaving(true);
    await saveProfile.mutateAsync(form);
    setSaving(false);
    setEditingAddress(false);
    setEditingGoal(false);
  };

  const hasSavedAddress = !!doctorProfile?.home_address;
  const hasSavedGoal = (doctorProfile?.monthly_net_goal ?? 0) > 0;

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        {/* Endereço residencial */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Endereço residencial
          </Label>
          {hasSavedAddress && !editingAddress ? (
            <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border/50">
              <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground flex-1 truncate font-body">
                {doctorProfile!.home_address}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setEditingAddress(true)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </div>
          ) : (
            <GooglePlacesInput
              value={form.home_address}
              placeholder="Sua rua, bairro, cidade..."
              mode="cep_first"
              onSelect={r => {
                setForm(f => ({
                  ...f,
                  home_address: r.address,
                  home_lat: r.lat,
                  home_lng: r.lng,
                  home_place_id: r.place_id,
                }));
              }}
            />
          )}
          <p className="text-[11px] text-muted-foreground font-body">
            Usado para calcular tempo de deslocamento até cada clínica.
          </p>
        </div>

        {/* Meta mensal */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            Meta de renda líquida mensal (R$)
          </Label>
          {hasSavedGoal && !editingGoal ? (
            <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border/50">
              <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground flex-1 font-body">
                R$ {(doctorProfile!.monthly_net_goal ?? 0).toLocaleString('pt-BR')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setEditingGoal(true)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </div>
          ) : (
            <Input
              type="number"
              min={0}
              step={500}
              value={form.monthly_net_goal ?? ''}
              onChange={e => setForm(f => ({ ...f, monthly_net_goal: Number(e.target.value) }))}
              placeholder="Ex: 18000"
            />
          )}
          <p className="text-[11px] text-muted-foreground font-body">
            Referência para o semáforo financeiro no Bloco 4.
          </p>
        </div>

        {/* Provisões */}
        <div className="space-y-3 pt-1">
          <Label className="text-xs">Provisões (para quem não tem CLT)</Label>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <p className="text-sm font-body">Incluir equivalente de 13º salário</p>
              <p className="text-[11px] text-muted-foreground font-body">
                +1/12 da renda mensal líquida como reserva
              </p>
            </div>
            <Switch
              checked={form.include_13th ?? false}
              onCheckedChange={v => setForm(f => ({ ...f, include_13th: v }))}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-body">Incluir equivalente de férias</p>
              <p className="text-[11px] text-muted-foreground font-body">
                +1/12 × 1⅓ da renda mensal líquida como reserva
              </p>
            </div>
            <Switch
              checked={form.include_vacation ?? false}
              onCheckedChange={v => setForm(f => ({ ...f, include_vacation: v }))}
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <Label className="text-xs">WhatsApp para notificações</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">+55</span>
            <Input
              value={(form as any).whatsapp_number?.replace('+55','').replace(/\D/g,'') ?? ''}
              onChange={e => setForm(f => ({ ...f, whatsapp_number: '+55' + e.target.value.replace(/\D/g,'') }))}
              placeholder="81 99999-9999"
              className="pl-10"
            />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-sm font-body">Digest semanal (todo domingo)</p>
              <p className="text-[11px] text-muted-foreground font-body">Agenda da semana seguinte via WhatsApp</p>
            </div>
            <Switch
              checked={(form as any).whatsapp_digest_enabled ?? true}
              onCheckedChange={v => setForm(f => ({ ...f, whatsapp_digest_enabled: v }))}
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </Button>
      </CardContent>
    </Card>
  );
}
