
-- 1. Radioburger suggestions table
CREATE TABLE public.radioburger_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestion_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.radioburger_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own suggestions"
  ON public.radioburger_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own suggestions"
  ON public.radioburger_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Master admins can view all suggestions"
  ON public.radioburger_suggestions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Master admins can update suggestions"
  ON public.radioburger_suggestions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'master_admin'::app_role));

-- 2. Community hot topics (non-medical, shared by master)
CREATE TABLE public.community_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text,
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active topics"
  ON public.community_topics FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Master admins can manage topics"
  ON public.community_topics FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master_admin'::app_role));

-- 3. Member referrals (Member Get Member)
CREATE TABLE public.member_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_name text NOT NULL,
  referred_email text NOT NULL,
  referred_phone text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own referrals"
  ON public.member_referrals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "Users can view their own referrals"
  ON public.member_referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Master admins can view all referrals"
  ON public.member_referrals FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Master admins can update referrals"
  ON public.member_referrals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'master_admin'::app_role));

-- 4. Add status columns to agenda_comunicacoes
ALTER TABLE public.agenda_comunicacoes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
