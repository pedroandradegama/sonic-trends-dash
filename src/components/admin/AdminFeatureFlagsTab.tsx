import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Search, ToggleLeft } from 'lucide-react';
import { ALL_FEATURE_FLAGS, FEATURE_FLAG_LABELS, FeatureFlag } from '@/hooks/useFeatureFlags';

interface DoctorRow {
  authorized_id: string;
  email: string;
  nome: string;
  user_id: string | null;
  registered: boolean;
}

type FlagsState = Record<string, Set<FeatureFlag>>; // user_id -> Set
type DirtyState = Record<string, boolean>; // user_id -> dirty

export function AdminFeatureFlagsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [flags, setFlags] = useState<FlagsState>({});
  const [dirty, setDirty] = useState<DirtyState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ data: docs, error: docErr }, { data: profiles, error: profErr }] = await Promise.all([
        supabase.from('authorized_doctors').select('id, email, nome, registered_at').order('nome'),
        supabase.from('profiles').select('user_id, email'),
      ]);
      if (docErr) throw docErr;
      if (profErr) throw profErr;

      const emailToUser = new Map<string, string>();
      (profiles || []).forEach((p: any) => {
        if (p.email) emailToUser.set(p.email.toLowerCase(), p.user_id);
      });

      const rows: DoctorRow[] = (docs || []).map((d: any) => ({
        authorized_id: d.id,
        email: d.email,
        nome: d.nome,
        user_id: emailToUser.get(d.email.toLowerCase()) || null,
        registered: !!d.registered_at,
      }));
      setDoctors(rows);

      const userIds = rows.map(r => r.user_id).filter(Boolean) as string[];
      if (userIds.length > 0) {
        const { data: flagRows, error: flagErr } = await supabase
          .from('user_feature_flags')
          .select('user_id, feature, enabled')
          .in('user_id', userIds);
        if (flagErr) throw flagErr;

        const map: FlagsState = {};
        (flagRows || []).forEach((row: any) => {
          if (!map[row.user_id]) map[row.user_id] = new Set();
          if (row.enabled) map[row.user_id].add(row.feature);
        });
        setFlags(map);
      }
    } catch (err: any) {
      toast({ title: 'Erro ao carregar', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function toggleFlag(userId: string, feature: FeatureFlag) {
    setFlags(prev => {
      const next = { ...prev };
      const set = new Set(next[userId] || []);
      if (set.has(feature)) set.delete(feature);
      else set.add(feature);
      next[userId] = set;
      return next;
    });
    setDirty(prev => ({ ...prev, [userId]: true }));
  }

  async function saveDoctor(row: DoctorRow) {
    if (!row.user_id) {
      toast({ title: 'Médico não registrado', description: 'O médico precisa ter feito login pelo menos uma vez.', variant: 'destructive' });
      return;
    }
    setSaving(row.user_id);
    try {
      const enabledSet = flags[row.user_id] || new Set();
      const upserts = ALL_FEATURE_FLAGS.map(f => ({
        user_id: row.user_id!,
        feature: f,
        enabled: enabledSet.has(f),
        granted_by: user?.id ?? null,
      }));
      const { error } = await supabase
        .from('user_feature_flags')
        .upsert(upserts, { onConflict: 'user_id,feature' });
      if (error) throw error;
      setDirty(prev => ({ ...prev, [row.user_id!]: false }));
      toast({ title: 'Salvo', description: `Funcionalidades de ${row.nome} atualizadas.` });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(d =>
      d.nome.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)
    );
  }, [doctors, search]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ToggleLeft className="h-5 w-5 text-primary" />
          Funcionalidades por Médico
        </CardTitle>
        <CardDescription>
          Ative ou desative cada funcionalidade individualmente. Médicos não registrados ainda não podem receber flags.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar médico por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          {filtered.map(row => {
            const enabledSet = flags[row.user_id || ''] || new Set();
            const isDirty = !!dirty[row.user_id || ''];
            return (
              <div key={row.authorized_id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground">{row.nome}</h3>
                      {!row.user_id && (
                        <Badge variant="outline" className="text-xs">Não registrado</Badge>
                      )}
                      {isDirty && (
                        <Badge className="text-xs bg-[hsl(var(--warning))] text-foreground">Alterações não salvas</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => saveDoctor(row)}
                    disabled={!row.user_id || !isDirty || saving === row.user_id}
                  >
                    {saving === row.user_id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ALL_FEATURE_FLAGS.map(feature => {
                    const id = `${row.authorized_id}-${feature}`;
                    return (
                      <label
                        key={feature}
                        htmlFor={id}
                        className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 hover:bg-accent/40 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          id={id}
                          checked={enabledSet.has(feature)}
                          disabled={!row.user_id}
                          onCheckedChange={() => row.user_id && toggleFlag(row.user_id, feature)}
                        />
                        <span className="text-sm text-foreground">{FEATURE_FLAG_LABELS[feature]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum médico encontrado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
