import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface AgendaComunicacao {
  id: string;
  user_id: string;
  medico_nome: string;
  data_agenda: string;
  horario_inicio: string;
  horario_fim: string | null;
  comentarios: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAgendaComunicacao {
  data_agenda: string;
  horario_inicio: string;
  horario_fim?: string;
  comentarios?: string;
}

export function useAgendaComunicacoes() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  const { data: comunicacoes = [], isLoading, error } = useQuery({
    queryKey: ['agenda-comunicacoes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_comunicacoes')
        .select('*')
        .order('data_agenda', { ascending: true });
      
      if (error) throw error;
      return data as AgendaComunicacao[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (newComunicacao: CreateAgendaComunicacao) => {
      if (!user || !profile?.medico_nome) {
        throw new Error('Usuário não autenticado ou perfil incompleto');
      }

      const { data, error } = await supabase
        .from('agenda_comunicacoes')
        .insert({
          user_id: user.id,
          medico_nome: profile.medico_nome,
          data_agenda: newComunicacao.data_agenda,
          horario_inicio: newComunicacao.horario_inicio,
          horario_fim: newComunicacao.horario_fim || null,
          comentarios: newComunicacao.comentarios || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-comunicacoes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agenda_comunicacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-comunicacoes'] });
    },
  });

  return {
    comunicacoes,
    isLoading,
    error,
    createComunicacao: createMutation.mutateAsync,
    deleteComunicacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
