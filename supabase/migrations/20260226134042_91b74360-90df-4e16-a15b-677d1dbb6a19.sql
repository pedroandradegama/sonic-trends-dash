
-- 1. Add whatsapp_number to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add digest columns to doctor_preferences
ALTER TABLE public.doctor_preferences
  ADD COLUMN IF NOT EXISTS digest_frequency TEXT NOT NULL DEFAULT 'weekly'
    CHECK (digest_frequency IN ('weekly', 'biweekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS digest_article_limit INTEGER NOT NULL DEFAULT 5
    CHECK (digest_article_limit BETWEEN 1 AND 30),
  ADD COLUMN IF NOT EXISTS digest_reading_time INTEGER NOT NULL DEFAULT 5
    CHECK (digest_reading_time IN (3, 5, 10)),
  ADD COLUMN IF NOT EXISTS digest_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS digest_next_dispatch TIMESTAMPTZ;

-- 3. Trigger to auto-calculate digest_next_dispatch
CREATE OR REPLACE FUNCTION public.calc_digest_next_dispatch()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.digest_next_dispatch IS NULL OR
     OLD.digest_frequency IS DISTINCT FROM NEW.digest_frequency THEN
    NEW.digest_next_dispatch := CASE NEW.digest_frequency
      WHEN 'weekly'   THEN now() + INTERVAL '7 days'
      WHEN 'biweekly' THEN now() + INTERVAL '14 days'
      WHEN 'monthly'  THEN now() + INTERVAL '30 days'
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_calc_digest_next_dispatch ON public.doctor_preferences;
CREATE TRIGGER trg_calc_digest_next_dispatch
BEFORE INSERT OR UPDATE OF digest_frequency, digest_active
ON public.doctor_preferences
FOR EACH ROW EXECUTE FUNCTION public.calc_digest_next_dispatch();

-- 4. article_summaries table
CREATE TABLE IF NOT EXISTS public.article_summaries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id       UUID NOT NULL REFERENCES public.ultrasound_articles(id) ON DELETE CASCADE,
  short_title      TEXT,
  hot_topics       TEXT[] NOT NULL DEFAULT '{}',
  evidence_level   TEXT CHECK (evidence_level IN ('Alto', 'Moderado', 'Baixo')),
  emoji_highlight  TEXT DEFAULT '🔬',
  clinical_impact  TEXT,
  summary_3min     TEXT,
  summary_5min     TEXT,
  summary_10min    TEXT,
  summarized_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id)
);

ALTER TABLE public.article_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view article summaries"
ON public.article_summaries FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can manage article summaries"
ON public.article_summaries FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. digest_dispatch_queue table
CREATE TABLE IF NOT EXISTS public.digest_dispatch_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL,
  article_id    UUID NOT NULL REFERENCES public.ultrasound_articles(id) ON DELETE CASCADE,
  scheduled_for DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ,
  UNIQUE (doctor_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_ddq_scheduled ON public.digest_dispatch_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_ddq_doctor ON public.digest_dispatch_queue(doctor_id, status);

ALTER TABLE public.digest_dispatch_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dispatch queue"
ON public.digest_dispatch_queue FOR SELECT
USING (auth.uid() = doctor_id);

CREATE POLICY "Admins can manage dispatch queue"
ON public.digest_dispatch_queue FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. SQL helper function for cleanup
CREATE OR REPLACE FUNCTION public.get_fully_dispatched_article_ids()
RETURNS TABLE(article_id UUID) AS $$
  SELECT DISTINCT asm.article_id
  FROM public.article_summaries asm
  WHERE (asm.summary_3min IS NOT NULL OR asm.summary_5min IS NOT NULL OR asm.summary_10min IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.digest_dispatch_queue ddq
    WHERE ddq.article_id = asm.article_id
    AND ddq.status IN ('pending', 'failed')
  );
$$ LANGUAGE sql SET search_path = public;

-- 7. Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 9. Delete Ultrasound Med Biol articles
DELETE FROM public.ultrasound_articles WHERE source = 'Ultrasound Med Biol';

-- 10. Add unique constraint on url for ultrasound_articles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ultrasound_articles_url_key'
  ) THEN
    ALTER TABLE public.ultrasound_articles ADD CONSTRAINT ultrasound_articles_url_key UNIQUE (url);
  END IF;
END $$;
