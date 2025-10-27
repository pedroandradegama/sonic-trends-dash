export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      Casuistica: {
        Row: {
          "Cód. Médico Executante": number | null
          "Cód. Médico Solicitante": number | null
          "Cód. Paciente": number | null
          "Cód. Produto": number | null
          "Cód. Status Laudo": number | null
          Comentário: string | null
          "Data do pedido": string | null
          "Médico Executante": string | null
          "Médico Solicitante": string | null
          "Número Laudo": number | null
          Paciente: string | null
          Pedido: number | null
          Produto: string | null
          "Status laudo": string | null
          Subgrupo: string | null
        }
        Insert: {
          "Cód. Médico Executante"?: number | null
          "Cód. Médico Solicitante"?: number | null
          "Cód. Paciente"?: number | null
          "Cód. Produto"?: number | null
          "Cód. Status Laudo"?: number | null
          Comentário?: string | null
          "Data do pedido"?: string | null
          "Médico Executante"?: string | null
          "Médico Solicitante"?: string | null
          "Número Laudo"?: number | null
          Paciente?: string | null
          Pedido?: number | null
          Produto?: string | null
          "Status laudo"?: string | null
          Subgrupo?: string | null
        }
        Update: {
          "Cód. Médico Executante"?: number | null
          "Cód. Médico Solicitante"?: number | null
          "Cód. Paciente"?: number | null
          "Cód. Produto"?: number | null
          "Cód. Status Laudo"?: number | null
          Comentário?: string | null
          "Data do pedido"?: string | null
          "Médico Executante"?: string | null
          "Médico Solicitante"?: string | null
          "Número Laudo"?: number | null
          Paciente?: string | null
          Pedido?: number | null
          Produto?: string | null
          "Status laudo"?: string | null
          Subgrupo?: string | null
        }
        Relationships: []
      }
      NPS: {
        Row: {
          "Agendamento do exame": string | null
          atendente: string | null
          "Atendimento médico/técnico": string | null
          "Atendimento na recepção": string | null
          categoria_cor: string | null
          categoria_id: number | null
          categoria_nome: string | null
          cliente_codigo: number | null
          comentarios: string | null
          "Como nos conheceu?": string | null
          convenio: string | null
          dados_adicionais: string | null
          data_atendimento: string | null
          data_resposta: string | null
          destinatario: number | null
          "Entrega do resultado": string | null
          idade: number | null
          mensagem_tipo: string | null
          motivo_rnc: string | null
          negocio: number | null
          nota_real: number | null
          nps: string | null
          nps_id: number | null
          nps_rnc: string | null
          nps_setor_codigo: number | null
          ordem_servico: number | null
          paciente: string | null
          prestador_nome: string | null
          qtd_revisoes: string | null
          "Qualidade do serviço": string | null
          resposta: string | null
          setor: string | null
          sexo: string | null
          telefone: number | null
          "Tempo de espera": string | null
          unidade: string | null
          unidade_codigo: number | null
        }
        Insert: {
          "Agendamento do exame"?: string | null
          atendente?: string | null
          "Atendimento médico/técnico"?: string | null
          "Atendimento na recepção"?: string | null
          categoria_cor?: string | null
          categoria_id?: number | null
          categoria_nome?: string | null
          cliente_codigo?: number | null
          comentarios?: string | null
          "Como nos conheceu?"?: string | null
          convenio?: string | null
          dados_adicionais?: string | null
          data_atendimento?: string | null
          data_resposta?: string | null
          destinatario?: number | null
          "Entrega do resultado"?: string | null
          idade?: number | null
          mensagem_tipo?: string | null
          motivo_rnc?: string | null
          negocio?: number | null
          nota_real?: number | null
          nps?: string | null
          nps_id?: number | null
          nps_rnc?: string | null
          nps_setor_codigo?: number | null
          ordem_servico?: number | null
          paciente?: string | null
          prestador_nome?: string | null
          qtd_revisoes?: string | null
          "Qualidade do serviço"?: string | null
          resposta?: string | null
          setor?: string | null
          sexo?: string | null
          telefone?: number | null
          "Tempo de espera"?: string | null
          unidade?: string | null
          unidade_codigo?: number | null
        }
        Update: {
          "Agendamento do exame"?: string | null
          atendente?: string | null
          "Atendimento médico/técnico"?: string | null
          "Atendimento na recepção"?: string | null
          categoria_cor?: string | null
          categoria_id?: number | null
          categoria_nome?: string | null
          cliente_codigo?: number | null
          comentarios?: string | null
          "Como nos conheceu?"?: string | null
          convenio?: string | null
          dados_adicionais?: string | null
          data_atendimento?: string | null
          data_resposta?: string | null
          destinatario?: number | null
          "Entrega do resultado"?: string | null
          idade?: number | null
          mensagem_tipo?: string | null
          motivo_rnc?: string | null
          negocio?: number | null
          nota_real?: number | null
          nps?: string | null
          nps_id?: number | null
          nps_rnc?: string | null
          nps_setor_codigo?: number | null
          ordem_servico?: number | null
          paciente?: string | null
          prestador_nome?: string | null
          qtd_revisoes?: string | null
          "Qualidade do serviço"?: string | null
          resposta?: string | null
          setor?: string | null
          sexo?: string | null
          telefone?: number | null
          "Tempo de espera"?: string | null
          unidade?: string | null
          unidade_codigo?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          medico_nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          medico_nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          medico_nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      Repasse: {
        Row: {
          Convênio: string | null
          "Dt. Atendimento": string | null
          Médico: string | null
          "Porcentagem Repasse": string | null
          Produto: string | null
          Qtde: string | null
          "Vl. Repasse": string | null
        }
        Insert: {
          Convênio?: string | null
          "Dt. Atendimento"?: string | null
          Médico?: string | null
          "Porcentagem Repasse"?: string | null
          Produto?: string | null
          Qtde?: string | null
          "Vl. Repasse"?: string | null
        }
        Update: {
          Convênio?: string | null
          "Dt. Atendimento"?: string | null
          Médico?: string | null
          "Porcentagem Repasse"?: string | null
          Produto?: string | null
          Qtde?: string | null
          "Vl. Repasse"?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
