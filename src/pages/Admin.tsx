import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useMasterAdminCheck } from '@/hooks/useMasterAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, UserCheck, UserX, Trash2, Users, Shield, Clock, MessageCircle, Send, CheckCircle2, XCircle, Loader2, Newspaper, Globe, Settings, Lightbulb, Sparkles, CalendarCheck, UserPlus } from 'lucide-react';
import { AdminConfigTab } from '@/components/admin/AdminConfigTab';
import { AdminSuggestionsTab } from '@/components/admin/AdminSuggestionsTab';
import { AdminCommunityTopicsTab } from '@/components/admin/AdminCommunityTopicsTab';
import { AdminReferralsTab } from '@/components/admin/AdminReferralsTab';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import imagLogo from '@/assets/imag-logo.png';

interface AuthorizedDoctor {
  id: string;
  email: string;
  nome: string;
  is_active: boolean;
  created_at: string;
  registered_at: string | null;
  last_login_at: string | null;
}

interface WhatsAppLog {
  id: string;
  timestamp: string;
  to: string;
  templateName: string;
  status: 'sending' | 'sent' | 'failed';
  messageId?: string;
  error?: string;
}

interface ScrapeLog {
  id: string;
  timestamp: string;
  source: string;
  status: 'scraping' | 'done' | 'failed';
  found?: number;
  inserted?: number;
  error?: string;
  articles?: { title: string; url: string; subgroup: string }[];
}

const JOURNAL_SOURCES = [
  { key: 'radiographics', label: 'Radiographics (RSNA)' },
  { key: 'radiology', label: 'Radiology (RSNA)' },
  { key: 'ajr', label: 'AJR' },
  { key: 'jum', label: 'J Ultrasound Med' },
  { key: 'european_radiology', label: 'European Radiology' },
  { key: 'jcu', label: 'J Clinical Ultrasound' },
  { key: 'custom', label: 'URL personalizada' },
];

export default function Admin() {
  const [doctors, setDoctors] = useState<AuthorizedDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [adding, setAdding] = useState(false);

  // WhatsApp state
  const [waPhone, setWaPhone] = useState('5581971121516');

  // Scraping state
  const [scrapeSource, setScrapeSource] = useState('radiographics');
  const [scrapeCustomUrl, setScrapeCustomUrl] = useState('');
  const [scrapeSending, setScrapeSending] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState<ScrapeLog[]>([]);
  const [waTemplate, setWaTemplate] = useState('menu_unidade');
  const [waParams, setWaParams] = useState('');
  const [waRecipientName, setWaRecipientName] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>([]);

  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { isMasterAdmin, loading: masterLoading } = useMasterAdminCheck();
  const navigate = useNavigate();
  const { toast } = useToast();

  const hasAccess = isAdmin || isMasterAdmin;
  const isLoadingAccess = adminLoading || masterLoading;

  useEffect(() => {
    if (!isLoadingAccess && !hasAccess) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [hasAccess, isLoadingAccess, navigate, toast]);

  useEffect(() => {
    if (hasAccess) {
      fetchDoctors();
    }
  }, [hasAccess]);

  async function fetchDoctors() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('authorized_doctors')
        .select('*')
        .order('nome');
      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar médicos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDoctor(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newNome.trim()) return;
    setAdding(true);
    try {
      const { error } = await supabase
        .from('authorized_doctors')
        .insert({ email: newEmail.toLowerCase().trim(), nome: newNome.trim().toUpperCase() });
      if (error) throw error;
      toast({ title: "Médico adicionado", description: `${newNome} foi cadastrado com sucesso.` });
      setNewEmail('');
      setNewNome('');
      fetchDoctors();
    } catch (error: any) {
      toast({ title: "Erro ao adicionar médico", description: error.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(doctor: AuthorizedDoctor) {
    try {
      const { error } = await supabase
        .from('authorized_doctors')
        .update({ is_active: !doctor.is_active })
        .eq('id', doctor.id);
      if (error) throw error;
      toast({ title: doctor.is_active ? "Médico desativado" : "Médico ativado", description: `${doctor.nome} foi ${doctor.is_active ? 'desativado' : 'ativado'}.` });
      fetchDoctors();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar médico", description: error.message, variant: "destructive" });
    }
  }

  async function handleDelete(doctor: AuthorizedDoctor) {
    if (!confirm(`Tem certeza que deseja remover ${doctor.nome}?`)) return;
    try {
      const { error } = await supabase.from('authorized_doctors').delete().eq('id', doctor.id);
      if (error) throw error;
      toast({ title: "Médico removido", description: `${doctor.nome} foi removido do sistema.` });
      fetchDoctors();
    } catch (error: any) {
      toast({ title: "Erro ao remover médico", description: error.message, variant: "destructive" });
    }
  }

  async function handleSendWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    if (!waPhone.trim() || !waTemplate.trim()) return;

    const logId = crypto.randomUUID();
    const newLog: WhatsAppLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      to: waPhone.trim(),
      templateName: waTemplate.trim(),
      status: 'sending',
    };
    setWaLogs(prev => [newLog, ...prev]);
    setWaSending(true);

    try {
      const params = waParams.trim()
        ? waParams.split(',').map(p => p.trim()).filter(Boolean)
        : [];

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          to: waPhone.trim(),
          recipientName: waRecipientName.trim() || undefined,
          notificationType: 'test',
          templateName: waTemplate.trim(),
          templateParams: params,
          languageCode: 'pt_BR',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setWaLogs(prev => prev.map(l =>
        l.id === logId ? { ...l, status: 'sent', messageId: data.messageId } : l
      ));
      toast({ title: "✅ Mensagem enviada!", description: `ID: ${data.messageId}` });
    } catch (err: any) {
      const errMsg = err.message || 'Erro desconhecido';
      setWaLogs(prev => prev.map(l =>
        l.id === logId ? { ...l, status: 'failed', error: errMsg } : l
      ));
      toast({ title: "Falha no envio", description: errMsg, variant: "destructive" });
    } finally {
      setWaSending(false);
    }
  }

  async function handleScrapeJournal(e: React.FormEvent) {
    e.preventDefault();
    const sourceLabel = JOURNAL_SOURCES.find(s => s.key === scrapeSource)?.label || scrapeSource;
    const logId = crypto.randomUUID();
    const newLog: ScrapeLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      source: sourceLabel,
      status: 'scraping',
    };
    setScrapeLogs(prev => [newLog, ...prev]);
    setScrapeSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-journal-articles', {
        body: {
          sourceKey: scrapeSource === 'custom' ? undefined : scrapeSource,
          customUrl: scrapeSource === 'custom' ? scrapeCustomUrl.trim() : undefined,
          maxArticles: 30,
        },
      });

      if (error) throw error;
      if (data?.error || !data?.success) throw new Error(data?.error || 'Erro desconhecido');

      setScrapeLogs(prev => prev.map(l =>
        l.id === logId ? { ...l, status: 'done', found: data.found, inserted: data.inserted, articles: data.articles || [] } : l
      ));
      toast({ title: "✅ Scraping concluído!", description: `${data.inserted} artigos novos de ${data.found} encontrados.` });
    } catch (err: any) {
      setScrapeLogs(prev => prev.map(l =>
        l.id === logId ? { ...l, status: 'failed', error: err.message } : l
      ));
      toast({ title: "Falha no scraping", description: err.message, variant: "destructive" });
    } finally {
      setScrapeSending(false);
    }
  }

  if (isLoadingAccess || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-blue/5 to-medical-success/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue/5 to-medical-success/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={imagLogo} alt="IMAG" className="h-10" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-medical-blue/10 text-medical-blue border-medical-blue/30">
              <Shield className="h-3 w-3 mr-1" />
              {isMasterAdmin ? 'Master Admin' : 'Admin'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={signOut}>Sair</Button>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-medical-blue" />
            Painel de Administração
          </h1>
          <p className="text-muted-foreground">Gerencie médicos e notificações da plataforma</p>
        </div>

        <Tabs defaultValue="medicos">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="medicos" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Médicos
            </TabsTrigger>
            <TabsTrigger value="artigos" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" /> Artigos
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="sugestoes" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Sugestões
            </TabsTrigger>
            <TabsTrigger value="indicacoes" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Indicações
            </TabsTrigger>
            <TabsTrigger value="temas" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Temas
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          {/* ── ABA MÉDICOS ── */}
          <TabsContent value="medicos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Adicionar Médico</CardTitle>
                <CardDescription>Cadastre um novo médico que poderá criar uma conta na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDoctor} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="NOME COMPLETO DO MÉDICO" required />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="medico@email.com" required />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={adding}>{adding ? 'Adicionando...' : 'Adicionar'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Médicos Cadastrados ({doctors.length})</CardTitle>
                <CardDescription>Lista de todos os médicos autorizados a usar a plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {doctors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum médico cadastrado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {doctors.map(doctor => (
                      <div key={doctor.id} className={`flex items-center justify-between p-4 rounded-lg border ${doctor.is_active ? 'bg-card border-border' : 'bg-muted/50 border-muted'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-medium ${!doctor.is_active && 'text-muted-foreground'}`}>{doctor.nome}</h3>
                            {doctor.registered_at ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Registrado</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pendente</Badge>
                            )}
                            {!doctor.is_active && <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Inativo</Badge>}
                          </div>
                          <p className={`text-sm ${doctor.is_active ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>{doctor.email}</p>
                          {doctor.last_login_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              Último acesso: {format(new Date(doctor.last_login_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => toggleActive(doctor)} title={doctor.is_active ? 'Desativar' : 'Ativar'}>
                            {doctor.is_active ? <UserX className="h-4 w-4 text-red-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(doctor)} title="Remover">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ABA ARTIGOS ── */}
          <TabsContent value="artigos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Scraping de Artigos por Fonte
                </CardTitle>
                <CardDescription>
                  Extraia artigos automaticamente de journals usando Firecrawl (Radiographics, Radiology, AJR, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScrapeJournal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fonte</Label>
                      <Select value={scrapeSource} onValueChange={setScrapeSource}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOURNAL_SOURCES.map(s => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {scrapeSource === 'custom' && (
                      <div className="space-y-2">
                        <Label>URL personalizada</Label>
                        <Input
                          value={scrapeCustomUrl}
                          onChange={e => setScrapeCustomUrl(e.target.value)}
                          placeholder="https://journal.example.com/current-issue"
                          required
                        />
                      </div>
                    )}
                  </div>
                  <Button type="submit" disabled={scrapeSending} className="w-full md:w-auto">
                    {scrapeSending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extraindo artigos...</>
                    ) : (
                      <><Newspaper className="h-4 w-4 mr-2" /> Iniciar scraping</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {scrapeLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Log de scraping desta sessão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scrapeLogs.map(log => (
                      <div key={log.id} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                        log.status === 'done' ? 'bg-green-500/5 border-green-500/20'
                        : log.status === 'failed' ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-muted/50 border-muted'
                      }`}>
                        <div className="mt-0.5 shrink-0">
                          {log.status === 'scraping' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          {log.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {log.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{log.source}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(log.timestamp), "HH:mm:ss")}
                            </span>
                          </div>
                          {log.status === 'done' && (
                            <div className="mt-1">
                              <p className="text-xs text-green-600">
                                {log.found} encontrados · {log.inserted} novos inseridos
                              </p>
                              {log.articles && log.articles.length > 0 && (
                                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                                  {log.articles.map((article, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5">
                                        {article.subgroup}
                                      </Badge>
                                      <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline truncate"
                                      >
                                        {article.title}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {log.status === 'failed' && log.error && (
                            <p className="text-xs text-red-600 mt-1">{log.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── ABA WHATSAPP ── */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  Envio de Notificação WhatsApp
                </CardTitle>
                <CardDescription>
                  Dispare mensagens usando templates aprovados na conta Meta Business da IMAG
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendWhatsApp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wa-phone">Número destino</Label>
                      <Input
                        id="wa-phone"
                        value={waPhone}
                        onChange={e => setWaPhone(e.target.value)}
                        placeholder="5511999999999"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Formato internacional sem + (ex: 5581912345678)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wa-name">Nome do destinatário (opcional)</Label>
                      <Input
                        id="wa-name"
                        value={waRecipientName}
                        onChange={e => setWaRecipientName(e.target.value)}
                        placeholder="Ex: Dr. João"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wa-template">Nome do template</Label>
                      <Input
                        id="wa-template"
                        value={waTemplate}
                        onChange={e => setWaTemplate(e.target.value)}
                        placeholder="menu_unidade"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Nome exato do template aprovado no Meta</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wa-params">Parâmetros do template (opcional)</Label>
                      <Input
                        id="wa-params"
                        value={waParams}
                        onChange={e => setWaParams(e.target.value)}
                        placeholder="valor1, valor2, valor3"
                      />
                      <p className="text-xs text-muted-foreground">Separe com vírgula na ordem de {'{{1}}'}, {'{{2}}'} ...</p>
                    </div>
                  </div>

                  <Button type="submit" disabled={waSending} className="w-full md:w-auto">
                    {waSending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Enviar mensagem</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Log de envios */}
            {waLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Log de envios desta sessão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {waLogs.map(log => (
                      <div key={log.id} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                        log.status === 'sent' ? 'bg-green-500/5 border-green-500/20'
                        : log.status === 'failed' ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-muted/50 border-muted'
                      }`}>
                        <div className="mt-0.5 shrink-0">
                          {log.status === 'sending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          {log.status === 'sent' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {log.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{log.templateName}</span>
                            <span className="text-muted-foreground">→ {log.to}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(log.timestamp), "HH:mm:ss")}
                            </span>
                          </div>
                          {log.status === 'sent' && log.messageId && (
                            <p className="text-xs text-green-600 mt-1">Message ID: {log.messageId}</p>
                          )}
                          {log.status === 'failed' && log.error && (
                            <p className="text-xs text-red-600 mt-1">{log.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── ABA SUGESTÕES ── */}
          <TabsContent value="sugestoes">
            <AdminSuggestionsTab />
          </TabsContent>

          {/* ── ABA TEMAS DA COMUNIDADE ── */}
          <TabsContent value="temas">
            <AdminCommunityTopicsTab />
          </TabsContent>

          {/* ── ABA CONFIGURAÇÕES ── */}
          <TabsContent value="config">
            <div className="space-y-6">
              <AdminConfigTab />
              {/* Link to agenda management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    Gestão de Agendas
                  </CardTitle>
                  <CardDescription>Confirme e gerencie as agendas solicitadas pelos médicos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/gestao-agendas')} className="gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    Abrir Gestão de Agendas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
