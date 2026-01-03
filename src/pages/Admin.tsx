import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, UserCheck, UserX, Trash2, Users, Shield, Clock } from 'lucide-react';
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

export default function Admin() {
  const [doctors, setDoctors] = useState<AuthorizedDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [adding, setAdding] = useState(false);
  
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchDoctors();
    }
  }, [isAdmin]);

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
      toast({
        title: "Erro ao carregar médicos",
        description: error.message,
        variant: "destructive",
      });
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
        .insert({
          email: newEmail.toLowerCase().trim(),
          nome: newNome.trim().toUpperCase(),
        });

      if (error) throw error;

      toast({
        title: "Médico adicionado",
        description: `${newNome} foi cadastrado com sucesso.`,
      });

      setNewEmail('');
      setNewNome('');
      fetchDoctors();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar médico",
        description: error.message,
        variant: "destructive",
      });
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

      toast({
        title: doctor.is_active ? "Médico desativado" : "Médico ativado",
        description: `${doctor.nome} foi ${doctor.is_active ? 'desativado' : 'ativado'}.`,
      });

      fetchDoctors();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar médico",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleDelete(doctor: AuthorizedDoctor) {
    if (!confirm(`Tem certeza que deseja remover ${doctor.nome}?`)) return;

    try {
      const { error } = await supabase
        .from('authorized_doctors')
        .delete()
        .eq('id', doctor.id);

      if (error) throw error;

      toast({
        title: "Médico removido",
        description: `${doctor.nome} foi removido do sistema.`,
      });

      fetchDoctors();
    } catch (error: any) {
      toast({
        title: "Erro ao remover médico",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-blue/5 to-medical-success/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

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
              Admin
            </Badge>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-medical-blue" />
            Painel de Administração
          </h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie os médicos autorizados a acessar a plataforma
          </p>
        </div>

        {/* Add Doctor Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Médico
            </CardTitle>
            <CardDescription>
              Cadastre um novo médico que poderá criar uma conta na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDoctor} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="NOME COMPLETO DO MÉDICO"
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="medico@email.com"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={adding}>
                  {adding ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Doctors List */}
        <Card>
          <CardHeader>
            <CardTitle>Médicos Cadastrados ({doctors.length})</CardTitle>
            <CardDescription>
              Lista de todos os médicos autorizados a usar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum médico cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      doctor.is_active 
                        ? 'bg-card border-border' 
                        : 'bg-muted/50 border-muted'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-medium ${!doctor.is_active && 'text-muted-foreground'}`}>
                          {doctor.nome}
                        </h3>
                        {doctor.registered_at ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            Registrado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                            Pendente
                          </Badge>
                        )}
                        {!doctor.is_active && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${doctor.is_active ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                        {doctor.email}
                      </p>
                      {doctor.last_login_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Último acesso: {format(new Date(doctor.last_login_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(doctor)}
                        title={doctor.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {doctor.is_active ? (
                          <UserX className="h-4 w-4 text-red-500" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doctor)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
