
-- Cron 1: Gerar ocorrências de tarefas (diário às 1h UTC)
SELECT cron.schedule(
  'generate-task-occurrences',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/generate-task-occurrences',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Cron 2: Disparar lembretes de tarefas (a cada hora)
SELECT cron.schedule(
  'dispatch-task-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/dispatch-task-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Cron 3: Refresh RPH Analytics (a cada hora)
SELECT cron.schedule(
  'refresh-rph-analytics',
  '0 * * * *',
  $$
  SELECT public.refresh_rph_analytics();
  $$
);
