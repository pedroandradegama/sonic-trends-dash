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
      admin_agenda_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      admin_holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      admin_radioburger_dates: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      adult_reference_favorites: {
        Row: {
          created_at: string
          id: string
          measurement_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          measurement_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          measurement_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adult_reference_favorites_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "adult_reference_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      adult_reference_measurements: {
        Row: {
          category: string
          created_at: string
          cutoff_text: string | null
          id: string
          modality: string
          normal_text: string
          notes: string | null
          parameter: string
          source_title: string
          source_url: string
          structure: string
          unit: string | null
        }
        Insert: {
          category: string
          created_at?: string
          cutoff_text?: string | null
          id?: string
          modality: string
          normal_text: string
          notes?: string | null
          parameter: string
          source_title: string
          source_url: string
          structure: string
          unit?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          cutoff_text?: string | null
          id?: string
          modality?: string
          normal_text?: string
          notes?: string | null
          parameter?: string
          source_title?: string
          source_url?: string
          structure?: string
          unit?: string | null
        }
        Relationships: []
      }
      agenda_comunicacoes: {
        Row: {
          comentarios: string | null
          created_at: string
          data_agenda: string
          horario_fim: string | null
          horario_inicio: string
          id: string
          medico_nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comentarios?: string | null
          created_at?: string
          data_agenda: string
          horario_fim?: string | null
          horario_inicio: string
          id?: string
          medico_nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comentarios?: string | null
          created_at?: string
          data_agenda?: string
          horario_fim?: string | null
          horario_inicio?: string
          id?: string
          medico_nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      article_clicks: {
        Row: {
          article_id: string
          clicked_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          clicked_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          clicked_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_clicks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "ultrasound_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_summaries: {
        Row: {
          article_id: string
          clinical_impact: string | null
          emoji_highlight: string | null
          evidence_level: string | null
          hot_topics: string[]
          id: string
          short_title: string | null
          summarized_at: string
          summary_10min: string | null
          summary_3min: string | null
          summary_5min: string | null
        }
        Insert: {
          article_id: string
          clinical_impact?: string | null
          emoji_highlight?: string | null
          evidence_level?: string | null
          hot_topics?: string[]
          id?: string
          short_title?: string | null
          summarized_at?: string
          summary_10min?: string | null
          summary_3min?: string | null
          summary_5min?: string | null
        }
        Update: {
          article_id?: string
          clinical_impact?: string | null
          emoji_highlight?: string | null
          evidence_level?: string | null
          hot_topics?: string[]
          id?: string
          short_title?: string | null
          summarized_at?: string
          summary_10min?: string | null
          summary_3min?: string | null
          summary_5min?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_summaries_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "ultrasound_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_doctors: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          nome: string
          registered_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          nome: string
          registered_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          nome?: string
          registered_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      cimt_norms: {
        Row: {
          age_band_max: number | null
          age_band_min: number | null
          age_point: number | null
          age_type: string
          created_at: string
          ethnicity: string
          id: string
          p25: number
          p50: number
          p75: number
          p90: number | null
          segment: string
          sex: string
          source: string
        }
        Insert: {
          age_band_max?: number | null
          age_band_min?: number | null
          age_point?: number | null
          age_type: string
          created_at?: string
          ethnicity: string
          id?: string
          p25: number
          p50: number
          p75: number
          p90?: number | null
          segment: string
          sex: string
          source: string
        }
        Update: {
          age_band_max?: number | null
          age_band_min?: number | null
          age_point?: number | null
          age_type?: string
          created_at?: string
          ethnicity?: string
          id?: string
          p25?: number
          p50?: number
          p75?: number
          p90?: number | null
          segment?: string
          sex?: string
          source?: string
        }
        Relationships: []
      }
      digest_dispatch_queue: {
        Row: {
          article_id: string
          created_at: string
          doctor_id: string
          id: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          article_id: string
          created_at?: string
          doctor_id: string
          id?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "digest_dispatch_queue_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "ultrasound_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_preferences: {
        Row: {
          ambient_music: boolean
          coffee: boolean
          created_at: string
          digest_active: boolean
          digest_article_limit: number
          digest_frequency: string
          digest_next_dispatch: string | null
          digest_reading_time: number
          id: string
          music_genre: string | null
          overbooking_enabled: boolean
          overbooking_percentage: number | null
          overbooking_time_slot: string | null
          scheduling_profile: string
          tea: boolean
          updated_at: string
          user_id: string
          water: boolean
        }
        Insert: {
          ambient_music?: boolean
          coffee?: boolean
          created_at?: string
          digest_active?: boolean
          digest_article_limit?: number
          digest_frequency?: string
          digest_next_dispatch?: string | null
          digest_reading_time?: number
          id?: string
          music_genre?: string | null
          overbooking_enabled?: boolean
          overbooking_percentage?: number | null
          overbooking_time_slot?: string | null
          scheduling_profile?: string
          tea?: boolean
          updated_at?: string
          user_id: string
          water?: boolean
        }
        Update: {
          ambient_music?: boolean
          coffee?: boolean
          created_at?: string
          digest_active?: boolean
          digest_article_limit?: number
          digest_frequency?: string
          digest_next_dispatch?: string | null
          digest_reading_time?: number
          id?: string
          music_genre?: string | null
          overbooking_enabled?: boolean
          overbooking_percentage?: number | null
          overbooking_time_slot?: string | null
          scheduling_profile?: string
          tea?: boolean
          updated_at?: string
          user_id?: string
          water?: boolean
        }
        Relationships: []
      }
      Exames: {
        Row: {
          Atendimento: number | null
          "Dt. Digitação": string | null
          "Dt. Pedido": string | null
          Empresa: string | null
          Exame: string | null
          Laudo: number | null
          "Local de atendimento": string | null
          "Médico executante": string | null
          "Médico solicitante": string | null
          Paciente: string | null
          Pedido: number | null
          "Prefixo ate.": string | null
          "Previsão de entrega": string | null
          Prontuário: number | null
          SLA: string | null
          Status: string | null
        }
        Insert: {
          Atendimento?: number | null
          "Dt. Digitação"?: string | null
          "Dt. Pedido"?: string | null
          Empresa?: string | null
          Exame?: string | null
          Laudo?: number | null
          "Local de atendimento"?: string | null
          "Médico executante"?: string | null
          "Médico solicitante"?: string | null
          Paciente?: string | null
          Pedido?: number | null
          "Prefixo ate."?: string | null
          "Previsão de entrega"?: string | null
          Prontuário?: number | null
          SLA?: string | null
          Status?: string | null
        }
        Update: {
          Atendimento?: number | null
          "Dt. Digitação"?: string | null
          "Dt. Pedido"?: string | null
          Empresa?: string | null
          Exame?: string | null
          Laudo?: number | null
          "Local de atendimento"?: string | null
          "Médico executante"?: string | null
          "Médico solicitante"?: string | null
          Paciente?: string | null
          Pedido?: number | null
          "Prefixo ate."?: string | null
          "Previsão de entrega"?: string | null
          Prontuário?: number | null
          SLA?: string | null
          Status?: string | null
        }
        Relationships: []
      }
      interesting_cases: {
        Row: {
          created_at: string
          diagnostic_hypothesis: string | null
          exam_date: string
          followup_days: number | null
          id: string
          patient_name: string
          request_opinion: boolean
          shared_with_team: boolean
          updated_at: string
          user_id: string
          wants_followup: boolean
        }
        Insert: {
          created_at?: string
          diagnostic_hypothesis?: string | null
          exam_date: string
          followup_days?: number | null
          id?: string
          patient_name: string
          request_opinion?: boolean
          shared_with_team?: boolean
          updated_at?: string
          user_id: string
          wants_followup?: boolean
        }
        Update: {
          created_at?: string
          diagnostic_hypothesis?: string | null
          exam_date?: string
          followup_days?: number | null
          id?: string
          patient_name?: string
          request_opinion?: boolean
          shared_with_team?: boolean
          updated_at?: string
          user_id?: string
          wants_followup?: boolean
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
      orads_us_lesions: {
        Row: {
          created_at: string
          id: string
          menopausal_status: string
          payload: Json
          result: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menopausal_status: string
          payload?: Json
          result?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menopausal_status?: string
          payload?: Json
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      orads_us_rules_version: {
        Row: {
          created_at: string
          id: string
          source_refs: Json
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_refs?: Json
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          source_refs?: Json
          version?: string
        }
        Relationships: []
      }
      peds_us_organ_norms: {
        Row: {
          age_max_mo: number
          age_min_mo: number
          created_at: string | null
          id: string
          low_suggested_mm: number
          max_mm: number | null
          mean_mm: number | null
          min_mm: number | null
          organ_key: string
          p5_mm: number
          p95_mm: number
          sd_mm: number | null
          source: string
          table_ref: string
          up_suggested_mm: number
        }
        Insert: {
          age_max_mo: number
          age_min_mo: number
          created_at?: string | null
          id?: string
          low_suggested_mm: number
          max_mm?: number | null
          mean_mm?: number | null
          min_mm?: number | null
          organ_key: string
          p5_mm: number
          p95_mm: number
          sd_mm?: number | null
          source: string
          table_ref: string
          up_suggested_mm: number
        }
        Update: {
          age_max_mo?: number
          age_min_mo?: number
          created_at?: string | null
          id?: string
          low_suggested_mm?: number
          max_mm?: number | null
          mean_mm?: number | null
          min_mm?: number | null
          organ_key?: string
          p5_mm?: number
          p95_mm?: number
          sd_mm?: number | null
          source?: string
          table_ref?: string
          up_suggested_mm?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          medico_nome: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          medico_nome: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          medico_nome?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      reminder_preferences: {
        Row: {
          created_at: string
          email: string
          frequency: string
          id: string
          is_active: boolean
          medico_nome: string
          preferred_day: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          frequency: string
          id?: string
          is_active?: boolean
          medico_nome: string
          preferred_day?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          is_active?: boolean
          medico_nome?: string
          preferred_day?: number | null
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
      tirads_rules: {
        Row: {
          category_group: string
          created_at: string | null
          id: string
          option_key: string
          option_label: string
          points: number
        }
        Insert: {
          category_group: string
          created_at?: string | null
          id?: string
          option_key: string
          option_label: string
          points: number
        }
        Update: {
          category_group?: string
          created_at?: string | null
          id?: string
          option_key?: string
          option_label?: string
          points?: number
        }
        Relationships: []
      }
      tirads_thresholds: {
        Row: {
          created_at: string | null
          fna_min_cm: number | null
          follow_up_min_cm: number | null
          follow_up_schedule: string | null
          id: string
          note: string | null
          tr_level: string
        }
        Insert: {
          created_at?: string | null
          fna_min_cm?: number | null
          follow_up_min_cm?: number | null
          follow_up_schedule?: string | null
          id?: string
          note?: string | null
          tr_level: string
        }
        Update: {
          created_at?: string | null
          fna_min_cm?: number | null
          follow_up_min_cm?: number | null
          follow_up_schedule?: string | null
          id?: string
          note?: string | null
          tr_level?: string
        }
        Relationships: []
      }
      tool_usage_log: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          tool_key: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          tool_key: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          tool_key?: string
          user_id?: string
        }
        Relationships: []
      }
      ultrasound_articles: {
        Row: {
          click_count: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_highlighted: boolean
          publication_date: string | null
          source: string
          subgroup: string
          tags: string[] | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          publication_date?: string | null
          source: string
          subgroup?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          publication_date?: string | null
          source?: string
          subgroup?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_notification_rules: {
        Row: {
          created_at: string
          days_before: number | null
          description: string | null
          id: string
          is_active: boolean
          label: string
          notification_type: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_before?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          notification_type: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_before?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          notification_type?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          meta_message_id: string | null
          notification_type: string
          recipient_name: string | null
          recipient_phone: string
          sent_at: string | null
          status: string
          template_name: string
          template_params: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          meta_message_id?: string | null
          notification_type: string
          recipient_name?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string
          template_name: string
          template_params?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          meta_message_id?: string | null
          notification_type?: string
          recipient_name?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string
          template_name?: string
          template_params?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_fully_dispatched_article_ids: {
        Args: never
        Returns: {
          article_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_authorized: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "medico" | "master_admin"
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
    Enums: {
      app_role: ["admin", "medico", "master_admin"],
    },
  },
} as const
