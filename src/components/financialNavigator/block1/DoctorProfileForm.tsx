import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GooglePlacesInput } from '../GooglePlacesInput';
import { useFnConfig } from '@/hooks/useFnConfig';
import { FnDoctorProfile } from '@/types/financialNavigator';

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

  useEffect(() => {
    if (doctorProfile) setForm(doctorProfile);
  }, [doctorProfile]);

  const handleSave = async () => {
    setSaving(true);
    await saveProfile.mutateAsync(form);
    setSaving(false);
  };

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        {/* Endereço residencial */}
        <div className="space-y-1.5">
          <Label className="text-xs">Endereço residencial</Label>
          <GooglePlacesInput
            value={form.home_address}
            placeholder="Sua rua, bairro, cidade..."
            onSelect={r => setForm(f => ({
              ...f,
              home_address: r.address,
              home_lat: r.lat,
              home_lng: r.lng,
              home_place_id: r.place_id,
            }))}
          />
          <p className="text-[11px] text-muted-foreground font-body">
            Usado para calcular tempo de deslocamento até cada clínica.
          </p>
        </div>

        {/* Meta mensal */}
        <div className="space-y-1.5">
          <Label className="text-xs">Meta de renda líquida mensal (R$)</Label>
          <Input
            type="number"
            min={0}
            step={500}
            value={form.monthly_net_goal ?? ''}
            onChange={e => setForm(f => ({ ...f, monthly_net_goal: Number(e.target.value) }))}
            placeholder="Ex: 18000"
          />
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

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </Button>
      </CardContent>
    </Card>
  );
}
