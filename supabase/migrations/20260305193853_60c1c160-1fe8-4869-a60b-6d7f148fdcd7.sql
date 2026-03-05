
-- Admin holidays table
CREATE TABLE public.admin_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage holidays" ON public.admin_holidays FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));
CREATE POLICY "Authenticated can view holidays" ON public.admin_holidays FOR SELECT USING (auth.role() = 'authenticated'::text);

-- Admin radioburger dates table
CREATE TABLE public.admin_radioburger_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_radioburger_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage radioburger" ON public.admin_radioburger_dates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));
CREATE POLICY "Authenticated can view radioburger" ON public.admin_radioburger_dates FOR SELECT USING (auth.role() = 'authenticated'::text);

-- Admin agenda email recipients
CREATE TABLE public.admin_agenda_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_agenda_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage agenda emails" ON public.admin_agenda_emails FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));
CREATE POLICY "Authenticated can view agenda emails" ON public.admin_agenda_emails FOR SELECT USING (auth.role() = 'authenticated'::text);

-- Interesting cases: add sharing columns
ALTER TABLE public.interesting_cases ADD COLUMN shared_with_team boolean NOT NULL DEFAULT false;
ALTER TABLE public.interesting_cases ADD COLUMN request_opinion boolean NOT NULL DEFAULT false;

-- RLS policy: authenticated users can view shared cases
CREATE POLICY "Authenticated can view shared cases" ON public.interesting_cases FOR SELECT USING (shared_with_team = true AND auth.role() = 'authenticated'::text);

-- Seed initial holidays for 2026
INSERT INTO public.admin_holidays (date, name) VALUES
  ('2026-01-01', 'Confraternização Universal'),
  ('2026-02-15', 'Domingo de Carnaval'),
  ('2026-02-17', 'Terça-feira de Carnaval'),
  ('2026-04-03', 'Sexta-feira Santa'),
  ('2026-05-01', 'Dia do Trabalhador'),
  ('2026-09-07', 'Independência do Brasil'),
  ('2026-11-02', 'Finados'),
  ('2026-12-25', 'Natal');

-- Seed initial radioburger date
INSERT INTO public.admin_radioburger_dates (date, description) VALUES
  ('2026-02-20', 'Radioburger Fevereiro 2026');
