
-- O-RADS US lesion history per user
CREATE TABLE public.orads_us_lesions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  menopausal_status text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.orads_us_lesions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orads lesions"
  ON public.orads_us_lesions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orads lesions"
  ON public.orads_us_lesions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orads lesions"
  ON public.orads_us_lesions FOR DELETE
  USING (auth.uid() = user_id);

-- O-RADS rules version tracking
CREATE TABLE public.orads_us_rules_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orads_us_rules_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orads rules version"
  ON public.orads_us_rules_version FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed the current version
INSERT INTO public.orads_us_rules_version (version, source_refs) VALUES (
  'v2022-11',
  '[
    {"title":"O-RADS US Risk Stratification and Management System","source":"Radiology 2020"},
    {"title":"O-RADS US v2022 Update","source":"Radiology 2023"},
    {"title":"O-RADS US v2022 Assessment Categories + Classic Benign Lesions","source":"ACR Release Nov 2022"},
    {"title":"O-RADS: A User''s Guide","source":"AJR 2021"}
  ]'::jsonb
);
