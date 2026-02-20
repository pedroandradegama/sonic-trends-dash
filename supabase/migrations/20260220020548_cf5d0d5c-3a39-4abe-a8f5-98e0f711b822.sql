
-- Tabela para logs de notificações WhatsApp enviadas
CREATE TABLE public.whatsapp_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL, -- 'nova_calculadora', 'radioburger', 'custom', etc.
  recipient_phone TEXT NOT NULL,   -- número destino (pode ser diferente do corporativo)
  recipient_name TEXT,
  template_name TEXT NOT NULL,
  template_params JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  meta_message_id TEXT,            -- ID retornado pela API Meta
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID                  -- user_id de quem disparou (NULL = automático)
);

-- RLS
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all whatsapp notifications"
ON public.whatsapp_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Admins can insert whatsapp notifications"
ON public.whatsapp_notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Tabela de configuração de regras de notificação
CREATE TABLE public.whatsapp_notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,             -- nome legível ex: "Antes do Radioburger"
  is_active BOOLEAN NOT NULL DEFAULT true,
  days_before INTEGER,             -- quantos dias antes do evento (para eventos com data)
  template_name TEXT NOT NULL,     -- nome do template aprovado no Meta
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification rules"
ON public.whatsapp_notification_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Authenticated users can view active rules"
ON public.whatsapp_notification_rules
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

-- Seed com regras iniciais
INSERT INTO public.whatsapp_notification_rules (notification_type, label, template_name, days_before, description) VALUES
  ('radioburger_reminder', 'Lembrete Radioburger', 'radioburger_reminder', 7, 'Notificação X dias antes do próximo Radioburger'),
  ('nova_calculadora', 'Nova Calculadora Disponível', 'nova_calculadora', NULL, 'Avisar médicos quando uma nova ferramenta/calculadora for lançada'),
  ('custom', 'Mensagem Personalizada', 'custom_message', NULL, 'Envio manual de mensagem customizada');
