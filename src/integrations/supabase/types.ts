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
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          data_agenda: string
          horario_fim: string | null
          horario_inicio: string
          id: string
          medico_nome: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comentarios?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          data_agenda: string
          horario_fim?: string | null
          horario_inicio: string
          id?: string
          medico_nome: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comentarios?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          data_agenda?: string
          horario_fim?: string | null
          horario_inicio?: string
          id?: string
          medico_nome?: string
          status?: string
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
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "Casuistica_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
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
      clinic_data_mappings: {
        Row: {
          clinic_id: string | null
          column_mappings: Json
          created_at: string | null
          file_format: string
          id: string
          parsing_rules: Json | null
          source_type: string
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          column_mappings: Json
          created_at?: string | null
          file_format: string
          id?: string
          parsing_rules?: Json | null
          source_type: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          column_mappings?: Json
          created_at?: string | null
          file_format?: string
          id?: string
          parsing_rules?: Json | null
          source_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_data_mappings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
        }
        Relationships: []
      }
      community_topics: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      commute_entries: {
        Row: {
          created_at: string | null
          days_of_week: number[] | null
          dest_lat: number | null
          dest_lng: number | null
          destination_description: string | null
          distance_km: number | null
          duration_minutes: number | null
          id: string
          is_work_commute: boolean | null
          label: string
          origin_description: string | null
          origin_lat: number | null
          origin_lng: number | null
          raw_transcript: string | null
          service_id: string | null
          source: string | null
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days_of_week?: number[] | null
          dest_lat?: number | null
          dest_lng?: number | null
          destination_description?: string | null
          distance_km?: number | null
          duration_minutes?: number | null
          id?: string
          is_work_commute?: boolean | null
          label: string
          origin_description?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          raw_transcript?: string | null
          service_id?: string | null
          source?: string | null
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days_of_week?: number[] | null
          dest_lat?: number | null
          dest_lng?: number | null
          destination_description?: string | null
          distance_km?: number | null
          duration_minutes?: number | null
          id?: string
          is_work_commute?: boolean | null
          label?: string
          origin_description?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          raw_transcript?: string | null
          service_id?: string | null
          source?: string | null
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commute_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
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
      fn_actual_production: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          production_month: string
          service_id: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          production_month: string
          service_id: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          production_month?: string
          service_id?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fn_actual_production_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_bank_connections: {
        Row: {
          account_type: string | null
          connector_id: number | null
          connector_name: string
          created_at: string
          id: string
          is_pj: boolean
          label: string | null
          last_synced_at: string | null
          pluggy_item_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          connector_id?: number | null
          connector_name: string
          created_at?: string
          id?: string
          is_pj?: boolean
          label?: string | null
          last_synced_at?: string | null
          pluggy_item_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          connector_id?: number | null
          connector_name?: string
          created_at?: string
          id?: string
          is_pj?: boolean
          label?: string | null
          last_synced_at?: string | null
          pluggy_item_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fn_calendar_shifts: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          service_id: string
          shift_date: string
          shift_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          service_id: string
          shift_date: string
          shift_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          shift_date?: string
          shift_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fn_calendar_shifts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_commute_cache: {
        Row: {
          distance_km: number | null
          duration_min: number | null
          fetched_at: string
          id: string
          service_id: string
          slot_type: string
          user_id: string
        }
        Insert: {
          distance_km?: number | null
          duration_min?: number | null
          fetched_at?: string
          id?: string
          service_id: string
          slot_type: string
          user_id: string
        }
        Update: {
          distance_km?: number | null
          duration_min?: number | null
          fetched_at?: string
          id?: string
          service_id?: string
          slot_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fn_commute_cache_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_doctor_profile: {
        Row: {
          created_at: string
          home_address: string | null
          home_lat: number | null
          home_lng: number | null
          home_place_id: string | null
          id: string
          include_13th: boolean
          include_vacation: boolean
          monthly_net_goal: number | null
          primary_regime: string | null
          updated_at: string
          user_id: string
          whatsapp_digest_enabled: boolean
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          home_place_id?: string | null
          id?: string
          include_13th?: boolean
          include_vacation?: boolean
          monthly_net_goal?: number | null
          primary_regime?: string | null
          updated_at?: string
          user_id: string
          whatsapp_digest_enabled?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          home_place_id?: string | null
          id?: string
          include_13th?: boolean
          include_vacation?: boolean
          monthly_net_goal?: number | null
          primary_regime?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_digest_enabled?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      fn_faq_history: {
        Row: {
          answer: string
          created_at: string
          id: string
          model_used: string
          question: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          model_used?: string
          question: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          model_used?: string
          question?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      fn_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          source_url: string | null
          title: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_url?: string | null
          title: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_url?: string | null
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      fn_kpi_snapshots: {
        Row: {
          created_at: string
          effective_rate: number
          id: string
          shift_count: number
          snapshot_month: string
          total_gross: number
          total_hours: number
          total_net: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effective_rate?: number
          id?: string
          shift_count?: number
          snapshot_month: string
          total_gross?: number
          total_hours?: number
          total_net?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effective_rate?: number
          id?: string
          shift_count?: number
          snapshot_month?: string
          total_gross?: number
          total_hours?: number
          total_net?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fn_onboarding_progress: {
        Row: {
          block1_pct: number
          block2_pct: number
          block3_pct: number
          block4_pct: number
          completed_at: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block1_pct?: number
          block2_pct?: number
          block3_pct?: number
          block4_pct?: number
          completed_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block1_pct?: number
          block2_pct?: number
          block3_pct?: number
          block4_pct?: number
          completed_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fn_preset_clinics: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          place_id: string | null
          short_name: string | null
          specialty: string | null
          state: string
        }
        Insert: {
          address: string
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          place_id?: string | null
          short_name?: string | null
          specialty?: string | null
          state?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          place_id?: string | null
          short_name?: string | null
          specialty?: string | null
          state?: string
        }
        Relationships: []
      }
      fn_projection_prefs: {
        Row: {
          created_at: string
          filter_method: string | null
          filter_regime: string | null
          filter_service: string | null
          id: string
          show_net: boolean
          tax_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filter_method?: string | null
          filter_regime?: string | null
          filter_service?: string | null
          id?: string
          show_net?: boolean
          tax_rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filter_method?: string | null
          filter_regime?: string | null
          filter_service?: string | null
          id?: string
          show_net?: boolean
          tax_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fn_recurrence_rules: {
        Row: {
          created_at: string
          end_month: string
          frequency: string
          id: string
          is_active: boolean
          service_id: string
          shift_type: string
          start_month: string
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_month: string
          frequency?: string
          id?: string
          is_active?: boolean
          service_id: string
          shift_type: string
          start_month: string
          updated_at?: string
          user_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_month?: string
          frequency?: string
          id?: string
          is_active?: boolean
          service_id?: string
          shift_type?: string
          start_month?: string
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "fn_recurrence_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_service_evaluations: {
        Row: {
          created_at: string
          evaluated_at: string
          id: string
          notes: string | null
          period_label: string
          score_bureaucracy: number | null
          score_commute: number | null
          score_development: number | null
          score_environment: number | null
          score_equipment: number | null
          score_flexibility: number | null
          score_legal_security: number | null
          score_perspective: number | null
          score_punctuality: number | null
          score_remuneration: number | null
          score_reputation: number | null
          score_transparency: number | null
          score_volume: number | null
          service_id: string
          user_id: string
          weight_financial: number
          weight_logistics: number
          weight_work: number
        }
        Insert: {
          created_at?: string
          evaluated_at?: string
          id?: string
          notes?: string | null
          period_label: string
          score_bureaucracy?: number | null
          score_commute?: number | null
          score_development?: number | null
          score_environment?: number | null
          score_equipment?: number | null
          score_flexibility?: number | null
          score_legal_security?: number | null
          score_perspective?: number | null
          score_punctuality?: number | null
          score_remuneration?: number | null
          score_reputation?: number | null
          score_transparency?: number | null
          score_volume?: number | null
          service_id: string
          user_id: string
          weight_financial?: number
          weight_logistics?: number
          weight_work?: number
        }
        Update: {
          created_at?: string
          evaluated_at?: string
          id?: string
          notes?: string | null
          period_label?: string
          score_bureaucracy?: number | null
          score_commute?: number | null
          score_development?: number | null
          score_environment?: number | null
          score_equipment?: number | null
          score_flexibility?: number | null
          score_legal_security?: number | null
          score_perspective?: number | null
          score_punctuality?: number | null
          score_remuneration?: number | null
          score_reputation?: number | null
          score_transparency?: number | null
          score_volume?: number | null
          service_id?: string
          user_id?: string
          weight_financial?: number
          weight_logistics?: number
          weight_work?: number
        }
        Relationships: [
          {
            foreignKeyName: "fn_service_evaluations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_service_expenses: {
        Row: {
          amount_brl: number
          created_at: string
          frequency: string
          id: string
          label: string
          service_id: string
          user_id: string
        }
        Insert: {
          amount_brl?: number
          created_at?: string
          frequency?: string
          id?: string
          label: string
          service_id: string
          user_id: string
        }
        Update: {
          amount_brl?: number
          created_at?: string
          frequency?: string
          id?: string
          label?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fn_service_expenses_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_services: {
        Row: {
          address: string | null
          color: string
          commute_km: number | null
          commute_minutes: number | null
          created_at: string
          distribution_frequency: string | null
          distribution_months: number[] | null
          fiscal_fixed_costs: number | null
          fiscal_mode: string
          fiscal_pct_base: number | null
          fiscal_pct_total: number | null
          fixed_monthly_salary: number | null
          fixed_monthly_value: number | null
          id: string
          is_active: boolean
          is_taxed: boolean
          lat: number | null
          lng: number | null
          method_mix: Json | null
          monthly_hours: number | null
          name: string
          payment_delta: number
          place_id: string | null
          primary_method: string | null
          regime: string
          required_hours_month: number | null
          sort_order: number
          tax_pct: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          color?: string
          commute_km?: number | null
          commute_minutes?: number | null
          created_at?: string
          distribution_frequency?: string | null
          distribution_months?: number[] | null
          fiscal_fixed_costs?: number | null
          fiscal_mode?: string
          fiscal_pct_base?: number | null
          fiscal_pct_total?: number | null
          fixed_monthly_salary?: number | null
          fixed_monthly_value?: number | null
          id?: string
          is_active?: boolean
          is_taxed?: boolean
          lat?: number | null
          lng?: number | null
          method_mix?: Json | null
          monthly_hours?: number | null
          name: string
          payment_delta?: number
          place_id?: string | null
          primary_method?: string | null
          regime?: string
          required_hours_month?: number | null
          sort_order?: number
          tax_pct?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          color?: string
          commute_km?: number | null
          commute_minutes?: number | null
          created_at?: string
          distribution_frequency?: string | null
          distribution_months?: number[] | null
          fiscal_fixed_costs?: number | null
          fiscal_mode?: string
          fiscal_pct_base?: number | null
          fiscal_pct_total?: number | null
          fixed_monthly_salary?: number | null
          fixed_monthly_value?: number | null
          id?: string
          is_active?: boolean
          is_taxed?: boolean
          lat?: number | null
          lng?: number | null
          method_mix?: Json | null
          monthly_hours?: number | null
          name?: string
          payment_delta?: number
          place_id?: string | null
          primary_method?: string | null
          regime?: string
          required_hours_month?: number | null
          sort_order?: number
          tax_pct?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fn_shift_adjustments: {
        Row: {
          adjustment_type: string
          created_at: string
          gross_impact: number | null
          id: string
          reason: string | null
          service_id: string | null
          shift_date: string
          shift_id: string | null
          shift_type: string | null
          user_id: string
        }
        Insert: {
          adjustment_type: string
          created_at?: string
          gross_impact?: number | null
          id?: string
          reason?: string | null
          service_id?: string | null
          shift_date: string
          shift_id?: string | null
          shift_type?: string | null
          user_id: string
        }
        Update: {
          adjustment_type?: string
          created_at?: string
          gross_impact?: number | null
          id?: string
          reason?: string | null
          service_id?: string | null
          shift_date?: string
          shift_id?: string | null
          shift_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fn_shift_adjustments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fn_shift_adjustments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "fn_calendar_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_shift_values: {
        Row: {
          id: string
          service_id: string
          shift_type: string
          user_id: string
          value_brl: number
        }
        Insert: {
          id?: string
          service_id: string
          shift_type: string
          user_id: string
          value_brl?: number
        }
        Update: {
          id?: string
          service_id?: string
          shift_type?: string
          user_id?: string
          value_brl?: number
        }
        Relationships: [
          {
            foreignKeyName: "fn_shift_values_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_spending_summaries: {
        Row: {
          by_category: Json | null
          credit_card_total: number
          id: string
          month: string
          pj_expenses: number
          savings_rate: number | null
          total_income: number
          total_spending: number
          updated_at: string
          user_id: string
        }
        Insert: {
          by_category?: Json | null
          credit_card_total?: number
          id?: string
          month: string
          pj_expenses?: number
          savings_rate?: number | null
          total_income?: number
          total_spending?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          by_category?: Json | null
          credit_card_total?: number
          id?: string
          month?: string
          pj_expenses?: number
          savings_rate?: number | null
          total_income?: number
          total_spending?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fn_transactions: {
        Row: {
          amount: number
          bill_id: string | null
          card_number: string | null
          category: string | null
          category_id: string | null
          connection_id: string
          created_at: string
          custom_category: string | null
          date: string
          description: string
          detected_as_income: boolean
          fn_service_id: string | null
          id: string
          installment_number: number | null
          is_credit_card: boolean
          is_pj_expense: boolean | null
          matched_service_id: string | null
          merchant_category: string | null
          merchant_cnpj: string | null
          merchant_name: string | null
          note: string | null
          pluggy_account_id: string
          pluggy_tx_id: string
          status: string
          total_amount: number | null
          total_installments: number | null
          user_id: string
        }
        Insert: {
          amount: number
          bill_id?: string | null
          card_number?: string | null
          category?: string | null
          category_id?: string | null
          connection_id: string
          created_at?: string
          custom_category?: string | null
          date: string
          description: string
          detected_as_income?: boolean
          fn_service_id?: string | null
          id?: string
          installment_number?: number | null
          is_credit_card?: boolean
          is_pj_expense?: boolean | null
          matched_service_id?: string | null
          merchant_category?: string | null
          merchant_cnpj?: string | null
          merchant_name?: string | null
          note?: string | null
          pluggy_account_id: string
          pluggy_tx_id: string
          status?: string
          total_amount?: number | null
          total_installments?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          bill_id?: string | null
          card_number?: string | null
          category?: string | null
          category_id?: string | null
          connection_id?: string
          created_at?: string
          custom_category?: string | null
          date?: string
          description?: string
          detected_as_income?: boolean
          fn_service_id?: string | null
          id?: string
          installment_number?: number | null
          is_credit_card?: boolean
          is_pj_expense?: boolean | null
          matched_service_id?: string | null
          merchant_category?: string | null
          merchant_cnpj?: string | null
          merchant_name?: string | null
          note?: string | null
          pluggy_account_id?: string
          pluggy_tx_id?: string
          status?: string
          total_amount?: number | null
          total_installments?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fn_transactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "fn_bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fn_transactions_fn_service_id_fkey"
            columns: ["fn_service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fn_transactions_matched_service_id_fkey"
            columns: ["matched_service_id"]
            isOneToOne: false
            referencedRelation: "fn_services"
            referencedColumns: ["id"]
          },
        ]
      }
      fn_voice_commands: {
        Row: {
          applied: boolean
          created_at: string
          id: string
          parsed_actions: Json | null
          raw_transcript: string
          user_id: string
        }
        Insert: {
          applied?: boolean
          created_at?: string
          id?: string
          parsed_actions?: Json | null
          raw_transcript: string
          user_id: string
        }
        Update: {
          applied?: boolean
          created_at?: string
          id?: string
          parsed_actions?: Json | null
          raw_transcript?: string
          user_id?: string
        }
        Relationships: []
      }
      fn_whatsapp_queries: {
        Row: {
          created_at: string
          from_number: string
          id: string
          month_ref: string | null
          query_text: string | null
          query_type: string
          response: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          from_number: string
          id?: string
          month_ref?: string | null
          query_text?: string | null
          query_type: string
          response?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          from_number?: string
          id?: string
          month_ref?: string | null
          query_text?: string | null
          query_type?: string
          response?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      google_drive_integrations: {
        Row: {
          access_token_encrypted: string | null
          auto_process: boolean | null
          clinic_id: string | null
          created_at: string | null
          file_patterns: string[] | null
          folder_id: string
          folder_name: string | null
          id: string
          last_sync: string | null
          medico_id: string | null
          refresh_token_encrypted: string | null
          status: string | null
          token_expires_at: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          auto_process?: boolean | null
          clinic_id?: string | null
          created_at?: string | null
          file_patterns?: string[] | null
          folder_id: string
          folder_name?: string | null
          id?: string
          last_sync?: string | null
          medico_id?: string | null
          refresh_token_encrypted?: string | null
          status?: string | null
          token_expires_at?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          auto_process?: boolean | null
          clinic_id?: string | null
          created_at?: string | null
          file_patterns?: string[] | null
          folder_id?: string
          folder_name?: string | null
          id?: string
          last_sync?: string | null
          medico_id?: string | null
          refresh_token_encrypted?: string | null
          status?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_drive_integrations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_drive_integrations_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          resolved: boolean
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
          resolved?: boolean
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
          resolved?: boolean
          shared_with_team?: boolean
          updated_at?: string
          user_id?: string
          wants_followup?: boolean
        }
        Relationships: []
      }
      market_benchmark_data: {
        Row: {
          created_at: string | null
          id: string
          metric: string
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          percentile_90: number | null
          reference_period: string | null
          region: string
          sample_size: number | null
          source: string | null
          specialty: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric: string
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          reference_period?: string | null
          region: string
          sample_size?: number | null
          source?: string | null
          specialty: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metric?: string
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          reference_period?: string | null
          region?: string
          sample_size?: number | null
          source?: string | null
          specialty?: string
          value?: number
        }
        Relationships: []
      }
      member_referrals: {
        Row: {
          created_at: string
          id: string
          referred_email: string
          referred_name: string
          referred_phone: string | null
          referrer_nome: string | null
          referrer_user_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_email: string
          referred_name: string
          referred_phone?: string | null
          referrer_nome?: string | null
          referrer_user_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_email?: string
          referred_name?: string
          referred_phone?: string | null
          referrer_nome?: string | null
          referrer_user_id?: string
          started_at?: string | null
          status?: string
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
      otp_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          used: boolean | null
          user_email: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          used?: boolean | null
          user_email: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          user_email?: string
        }
        Relationships: []
      }
      parsed_documents: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          parsed_data: Json
          raw_document_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          parsed_data: Json
          raw_document_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          parsed_data?: Json
          raw_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parsed_documents_raw_document_id_fkey"
            columns: ["raw_document_id"]
            isOneToOne: false
            referencedRelation: "raw_documents"
            referencedColumns: ["id"]
          },
        ]
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
          clinic_id: string | null
          created_at: string
          email: string
          id: string
          medico_nome: string
          role: string | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string
          email: string
          id?: string
          medico_nome: string
          role?: string | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string
          id?: string
          medico_nome?: string
          role?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      radioburger_suggestions: {
        Row: {
          created_at: string
          id: string
          status: string
          suggestion_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          suggestion_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          suggestion_text?: string
          user_id?: string
        }
        Relationships: []
      }
      raw_documents: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          document_type: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          medico_id: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          document_type?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          medico_id?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          document_type?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          medico_id?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_documents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_documents_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          clinic_id: string | null
          Convênio: string | null
          "Dt. Atendimento": string | null
          Médico: string | null
          "Porcentagem Repasse": string | null
          Produto: string | null
          Qtde: string | null
          "Vl. Repasse": string | null
        }
        Insert: {
          clinic_id?: string | null
          Convênio?: string | null
          "Dt. Atendimento"?: string | null
          Médico?: string | null
          "Porcentagem Repasse"?: string | null
          Produto?: string | null
          Qtde?: string | null
          "Vl. Repasse"?: string | null
        }
        Update: {
          clinic_id?: string | null
          Convênio?: string | null
          "Dt. Atendimento"?: string | null
          Médico?: string | null
          "Porcentagem Repasse"?: string | null
          Produto?: string | null
          Qtde?: string | null
          "Vl. Repasse"?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Repasse_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_preferences: {
        Row: {
          created_at: string
          id: string
          show_net: boolean
          tax_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_net?: boolean
          tax_rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          show_net?: boolean
          tax_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenue_services: {
        Row: {
          color: string
          created_at: string
          delta_months: number
          enabled_shifts: string[] | null
          id: string
          monthly_gross: number | null
          monthly_net: number | null
          name: string
          regime: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          delta_months?: number
          enabled_shifts?: string[] | null
          id?: string
          monthly_gross?: number | null
          monthly_net?: number | null
          name: string
          regime?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          delta_months?: number
          enabled_shifts?: string[] | null
          id?: string
          monthly_gross?: number | null
          monthly_net?: number | null
          name?: string
          regime?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenue_shift_values: {
        Row: {
          created_at: string
          end_hour: string | null
          id: string
          service_id: string
          shift_type: string
          start_hour: string | null
          updated_at: string
          user_id: string
          value_brl: number
        }
        Insert: {
          created_at?: string
          end_hour?: string | null
          id?: string
          service_id: string
          shift_type: string
          start_hour?: string | null
          updated_at?: string
          user_id: string
          value_brl?: number
        }
        Update: {
          created_at?: string
          end_hour?: string | null
          id?: string
          service_id?: string
          shift_type?: string
          start_hour?: string | null
          updated_at?: string
          user_id?: string
          value_brl?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_shift_values_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "revenue_services"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_shifts: {
        Row: {
          created_at: string
          id: string
          service_id: string
          shift_date: string
          shift_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          shift_date: string
          shift_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          shift_date?: string
          shift_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_shifts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "revenue_services"
            referencedColumns: ["id"]
          },
        ]
      }
      task_occurrences: {
        Row: {
          completed_at: string | null
          id: string
          reminded_at: string | null
          scheduled_date: string
          status: string | null
          task_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          reminded_at?: string | null
          scheduled_date: string
          status?: string | null
          task_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          reminded_at?: string | null
          scheduled_date?: string
          status?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_occurrences_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_via: string | null
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          medico_id: string | null
          parent_task_id: string | null
          recurrence_rule: Json | null
          reminder_config: Json | null
          snoozed_until: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_via?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          medico_id?: string | null
          parent_task_id?: string | null
          recurrence_rule?: Json | null
          reminder_config?: Json | null
          snoozed_until?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_via?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          medico_id?: string | null
          parent_task_id?: string | null
          recurrence_rule?: Json | null
          reminder_config?: Json | null
          snoozed_until?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
      user_feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature?: string
          granted_by?: string | null
          user_id?: string
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
      whatsapp_conversations: {
        Row: {
          context: Json | null
          id: string
          last_intent: string | null
          medico_id: string | null
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          context?: Json | null
          id?: string
          last_intent?: string | null
          medico_id?: string | null
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          context?: Json | null
          id?: string
          last_intent?: string | null
          medico_id?: string | null
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      whatsapp_message_log: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          direction: string
          id: string
          intent_detected: string | null
          media_url: string | null
          message_type: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction: string
          id?: string
          intent_detected?: string | null
          media_url?: string | null
          message_type?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          intent_detected?: string | null
          media_url?: string | null
          message_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      rph_analytics: {
        Row: {
          clinic_id: string | null
          convenio: string | null
          estimated_hours: number | null
          medico_nome: string | null
          month: string | null
          produto_exame: string | null
          rph: number | null
          total_procedures: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Repasse_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
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
      is_doctor_agenda_active: { Args: { _user_id: string }; Returns: boolean }
      is_email_authorized: { Args: { _email: string }; Returns: boolean }
      refresh_rph_analytics: { Args: never; Returns: undefined }
      trigger_dispatch_task_reminders: { Args: never; Returns: undefined }
      trigger_generate_task_occurrences: { Args: never; Returns: undefined }
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
