-- Insert dispatch items for test
INSERT INTO public.digest_dispatch_queue (doctor_id, article_id, scheduled_for, status)
VALUES
  ('a2c10ae4-0324-4b15-ae01-8e770f567440', '5db5efee-eb1c-406f-9f1f-33fd2393f13d', CURRENT_DATE, 'pending'),
  ('a2c10ae4-0324-4b15-ae01-8e770f567440', '98f00b4c-ce29-423e-b3e4-f4aa1b6da62c', CURRENT_DATE, 'pending'),
  ('a2c10ae4-0324-4b15-ae01-8e770f567440', 'd8781f12-51ea-4199-b8f9-3a254262c45d', CURRENT_DATE, 'pending');

-- Update template name
UPDATE public.whatsapp_notification_rules
SET template_name = 'digest_radiologia_introducao'
WHERE template_name = 'digest_radiologia_cabecalho';

-- Ensure digest_radiologia_artigo rule exists
INSERT INTO public.whatsapp_notification_rules (notification_type, template_name, label, is_active, description)
VALUES ('artigos_resumo', 'digest_radiologia_artigo', 'Digest - Artigo Individual', true, 'Template para envio de artigo individual do digest')
ON CONFLICT DO NOTHING;