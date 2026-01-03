import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, LogIn, ArrowLeft, Mail } from 'lucide-react';
import imagLogo from '@/assets/imag-logo.png';

type AuthStep = 'choose' | 'first-access-email' | 'first-access-password' | 'login';

export default function Auth() {
  const [step, setStep] = useState<AuthStep>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-authorized-email', {
        body: { email: email.toLowerCase().trim() }
      });

      if (error) throw error;

      if (data.authorized) {
        setDoctorName(data.nome);
        setStep('first-access-password');
        toast({
          title: "Email autorizado!",
          description: data.message,
        });
      } else {
        toast({
          title: "Email não autorizado",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-doctor', {
        body: { email: email.toLowerCase().trim(), password }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conta criada!",
          description: data.message,
        });
        setStep('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.error || 'Erro ao criar conta');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Erro ao entrar",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToChoose = () => {
    setStep('choose');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDoctorName('');
  };

  // Choose step - main entry point
  if (step === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-medical-success/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <img src={imagLogo} alt="IMAG - Medicina Diagnóstica" className="h-16" />
            </div>
            <CardTitle className="text-2xl font-bold">Portal do Médico</CardTitle>
            <CardDescription>
              Escolha uma opção para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => setStep('first-access-email')}
              className="w-full p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left group"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <UserPlus className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-lg">Primeiro acesso</h3>
                  <p className="text-sm text-muted-foreground">Criar minha senha</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStep('login')}
              className="w-full p-6 rounded-xl border-2 border-primary bg-primary text-white hover:bg-primary/90 transition-all duration-200 text-left group"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <LogIn className="h-8 w-8 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-lg">Já tenho conta</h3>
                  <p className="text-sm text-white/80">Entrar no painel</p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // First access - email verification
  if (step === 'first-access-email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-medical-success/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <img src={imagLogo} alt="IMAG - Medicina Diagnóstica" className="h-16" />
            </div>
            <CardTitle className="text-2xl font-bold">Portal do Médico</CardTitle>
            <CardDescription>
              Digite o e-mail cadastrado pelo administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetToChoose}
                  className="px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? 'Verificando...' : 'Continuar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // First access - password creation
  if (step === 'first-access-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-medical-success/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <img src={imagLogo} alt="IMAG - Medicina Diagnóstica" className="h-16" />
            </div>
            <CardTitle className="text-2xl font-bold">Criar Senha</CardTitle>
            <CardDescription>
              Olá, {doctorName}! Crie sua senha de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('first-access-email')}
                  className="px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Conta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login step
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-medical-success/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <img src={imagLogo} alt="IMAG - Medicina Diagnóstica" className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Acesse sua conta para visualizar seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetToChoose}
                className="px-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
