import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Mic, MicOff, Loader2, Plus, Trash2, RefreshCw, AlertCircle, Briefcase, Home as HomeIcon, Pencil, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useFnConfig } from '@/hooks/useFnConfig';
import { useFnCalendar } from '@/hooks/useFnCalendar';
import { useCommuteEntries, CommuteEntry } from '@/hooks/useCommuteEntries';
import { CommuteVoicePreviewSheet, ParsedCommuteEntry } from './CommuteVoicePreviewSheet';
import { CommuteManualSheet } from './CommuteManualSheet';

const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatHours(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function daysSummary(days: number[]) {
  if (!days || days.length === 0) return '—';
  if (days.length === 7) return 'Todos os dias';
  const weekdays = [1, 2, 3, 4, 5];
  if (days.length === 5 && weekdays.every(d => days.includes(d))) return 'Seg-Sex';
  return days.map(d => WEEKDAYS_SHORT[d]).join(' ');
}

export function TempoDeslocamentosPage() {
  const navigate = useNavigate();
  const { doctorProfile, services } = useFnConfig();
  const { getShiftsForMonth } = useFnCalendar();
  const { personalEntries, deleteEntry, getMonthlyMinutes } = useCommuteEntries();

  const [recState, setRecState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CommuteEntry | null>(null);
  const [parsedEntries, setParsedEntries] = useState<ParsedCommuteEntry[]>([]);
  const [transcript, setTranscript] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const hasHome = !!(doctorProfile?.home_lat && doctorProfile?.home_lng);
  const servicesWithCoords = services.filter((s: any) => s.lat && s.lng);

  // ── Build per-service commute breakdown for current month from real shifts ──
  const now = new Date();
  const monthShifts = getShiftsForMonth(now.getFullYear(), now.getMonth());

  const workBreakdown = services
    .map((svc: any) => {
      const shiftCount = monthShifts.filter(s => s.service_id === svc.id).length;
      const oneWayMin = svc.commute_minutes ?? 0;
      const monthlyMin = oneWayMin * 2 * shiftCount; // round trip per shift
      return {
        service: svc,
        shiftCount,
        oneWayMin,
        oneWayKm: svc.commute_km ?? null,
        monthlyMin,
        hasCommute: oneWayMin > 0,
        hasCoords: !!(svc.lat && svc.lng),
      };
    })
    .filter(b => b.shiftCount > 0 || b.hasCommute);

  const workMonthlyMinutes = workBreakdown.reduce((s, b) => s + b.monthlyMin, 0);
  const personalMonthlyMinutes = getMonthlyMinutes(e => !e.is_work_commute);
  const totalMonthly = workMonthlyMinutes + personalMonthlyMinutes;

  const handleRecalculate = async () => {
    if (!hasHome) {
      toast.error('Configure seu endereço residencial primeiro.');
      return;
    }
    setRecalculating(true);
    try {
      let updated = 0;
      for (const svc of servicesWithCoords) {
        const { data, error } = await supabase.functions.invoke('calculate-commute', {
          body: {
            origin_lat: doctorProfile!.home_lat,
            origin_lng: doctorProfile!.home_lng,
            dest_lat: svc.lat,
            dest_lng: svc.lng,
          },
        });
        if (error || !data?.minutes) continue;
        await (supabase as any).from('fn_services').update({
          commute_minutes: data.minutes,
          commute_km: data.km,
        }).eq('id', svc.id);
        updated++;
      }
      toast.success(`${updated} deslocamento(s) recalculado(s).`);
      window.location.reload();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setRecalculating(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = handleStop;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecState('recording');
    } catch {
      toast.error('Permissão de microfone negada.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecState('processing');
  };

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-commute-voice`,
        { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}` }, body: form },
      );
      const result = await res.json();
      setTranscript(result.transcript ?? '');
      setParsedEntries(result.entries ?? []);
      setPreviewOpen(true);
    } catch {
      toast.error('Erro ao processar áudio.');
    } finally {
      setRecState('idle');
    }
  };

  const openEdit = (entry: CommuteEntry) => {
    setEditingEntry(entry);
    setManualOpen(true);
  };
  const openCreate = () => {
    setEditingEntry(null);
    setManualOpen(true);
  };
  const closeManual = () => {
    setManualOpen(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      {/* Resumo mensal */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Tempo total de deslocamento mensal
          </p>
          <p className="text-3xl font-bold text-foreground">{formatHours(totalMonthly)}</p>
          <div className="flex gap-4 mt-3 text-sm flex-wrap">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Trabalho:</span>
              <span className="font-medium">{formatHours(workMonthlyMinutes)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HomeIcon className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Pessoal:</span>
              <span className="font-medium">{formatHours(personalMonthlyMinutes)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 1 — Trabalho */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" /> Deslocamentos de trabalho
            </h2>
            <p className="text-xs text-muted-foreground">
              Calculado a partir dos turnos cadastrados na sua Agenda × tempo entre sua casa e cada unidade
            </p>
          </div>
          {hasHome && servicesWithCoords.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={recalculating}>
              {recalculating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Recalcular tempos
            </Button>
          )}
        </div>

        {!hasHome && (
          <Alert className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>Configure seu endereço residencial para calcular o deslocamento automaticamente.</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/tempo/agenda')}>
                Configurar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {workBreakdown.length === 0 && hasHome && (
          <Card><CardContent className="pt-6 text-sm text-muted-foreground text-center">
            Nenhum turno cadastrado este mês. Adicione turnos na <button onClick={() => navigate('/tempo/agenda')} className="underline text-primary">Agenda</button>.
          </CardContent></Card>
        )}

        <div className="grid gap-2">
          {workBreakdown.map(b => {
            const svc = b.service;
            return (
              <Card key={svc.id}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: svc.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{svc.name}</p>
                      {svc.address && <p className="text-xs text-muted-foreground truncate">{svc.address}</p>}
                    </div>
                    {b.hasCommute ? (
                      <>
                        <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{b.oneWayMin} min</Badge>
                        {b.oneWayKm != null && (
                          <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{b.oneWayKm} km</Badge>
                        )}
                      </>
                    ) : b.hasCoords ? (
                      <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
                        <Calculator className="h-3 w-3" /> calcular
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">sem endereço</Badge>
                    )}
                  </div>
                  {/* Memória de cálculo */}
                  <div className="bg-muted/40 rounded-lg px-3 py-2 text-[11px] text-muted-foreground font-mono leading-relaxed">
                    {b.hasCommute ? (
                      <>
                        <span className="text-foreground font-semibold">{b.oneWayMin} min</span> (ida) × 2 (ida e volta) × <span className="text-foreground font-semibold">{b.shiftCount} turno{b.shiftCount === 1 ? '' : 's'}</span> no mês
                        {' = '}<span className="text-primary font-bold">{formatHours(b.monthlyMin)}</span>
                      </>
                    ) : b.hasCoords ? (
                      <>{b.shiftCount} turno{b.shiftCount === 1 ? '' : 's'} este mês — clique em "Recalcular tempos" para estimar o trajeto.</>
                    ) : (
                      <>{b.shiftCount} turno{b.shiftCount === 1 ? '' : 's'} este mês — cadastre o endereço da unidade na Agenda.</>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* SEÇÃO 2 — Outros */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <HomeIcon className="h-4 w-4 text-primary" /> Outros deslocamentos
            </h2>
            <p className="text-xs text-muted-foreground">Escola, academia, consultas médicas...</p>
          </div>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar
          </Button>
        </div>

        <div className="grid gap-2">
          {personalEntries.length === 0 && (
            <Card><CardContent className="pt-6 text-sm text-muted-foreground text-center">
              Nenhum deslocamento pessoal. Use o microfone abaixo ou adicione manualmente.
            </CardContent></Card>
          )}
          {personalEntries.map(e => (
            <Card key={e.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{e.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {daysSummary(e.days_of_week)}
                    {e.time_of_day ? ` • ${e.time_of_day.slice(0, 5)}` : ''}
                    {e.duration_minutes ? ` • ${e.duration_minutes} min` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => { if (confirm('Excluir este deslocamento?')) deleteEntry.mutate(e.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Floating mic */}
      <div className="fixed bottom-24 md:bottom-6 right-4 z-40">
        {recState === 'recording' ? (
          <Button size="lg" variant="destructive" className="rounded-full w-14 h-14 shadow-lg" onClick={stopRecording}>
            <MicOff className="h-5 w-5" />
          </Button>
        ) : recState === 'processing' ? (
          <Button size="lg" className="rounded-full w-14 h-14 shadow-lg" disabled>
            <Loader2 className="h-5 w-5 animate-spin" />
          </Button>
        ) : (
          <Button size="lg" className="rounded-full w-14 h-14 shadow-lg" onClick={startRecording}>
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
      {recState === 'recording' && (
        <div className="fixed bottom-40 md:bottom-24 right-4 bg-background border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground shadow-md max-w-[220px] z-40">
          Gravando... Fale seus deslocamentos pessoais.
          <br />
          <span className="text-[10px] opacity-70">Ex: "Levo meu filho na escola toda manhã, leva 30 minutos ida e volta."</span>
        </div>
      )}

      <CommuteVoicePreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        transcript={transcript}
        entries={parsedEntries}
      />
      <CommuteManualSheet open={manualOpen} onClose={closeManual} entry={editingEntry} />
    </div>
  );
}
