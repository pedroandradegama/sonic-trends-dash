import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CalendarX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth();
  const [agendaActive, setAgendaActive] = useState<boolean | null>(null);
  const [checkingAgenda, setCheckingAgenda] = useState(true);

  useEffect(() => {
    async function checkAgenda() {
      if (!user) {
        setCheckingAgenda(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_doctor_agenda_active', {
          _user_id: user.id,
        });

        if (error) {
          console.error('Erro ao verificar agenda:', error);
          // On error, allow access (fail-open for admins, etc.)
          setAgendaActive(true);
        } else {
          setAgendaActive(!!data);
        }
      } catch {
        setAgendaActive(true);
      } finally {
        setCheckingAgenda(false);
      }
    }

    checkAgenda();
  }, [user]);

  if (loading || checkingAgenda) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check OTP verification
  const otpVerified = sessionStorage.getItem('otp_verified');
  if (!otpVerified) {
    return <Navigate to="/auth" replace />;
  }

  // Check agenda access
  if (agendaActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-muted/20 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <CalendarX className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Acesso restrito</CardTitle>
            <CardDescription className="text-sm mt-2">
              Você não possui agenda confirmada para o mês atual. 
              O acesso à plataforma requer que a gestão da IMAG tenha confirmado sua escala para este mês.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Se acredita que isso é um erro, entre em contato com a coordenação.
            </p>
            <Button variant="outline" onClick={() => signOut()} className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
