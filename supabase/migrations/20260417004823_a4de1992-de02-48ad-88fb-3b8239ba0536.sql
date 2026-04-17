CREATE TABLE IF NOT EXISTS public.commute_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  origin_description text,
  destination_description text,
  origin_lat numeric(10,7),
  origin_lng numeric(10,7),
  dest_lat numeric(10,7),
  dest_lng numeric(10,7),
  duration_minutes integer,
  distance_km numeric(6,2),
  days_of_week integer[] DEFAULT '{1,2,3,4,5}',
  time_of_day time,
  source text DEFAULT 'manual',
  raw_transcript text,
  is_work_commute boolean DEFAULT false,
  service_id uuid REFERENCES public.fn_services(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.commute_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own commutes"
  ON public.commute_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_commute_entries_user ON public.commute_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_commute_entries_service ON public.commute_entries(service_id);

ALTER TABLE public.fn_services ADD COLUMN IF NOT EXISTS commute_minutes integer;
ALTER TABLE public.fn_services ADD COLUMN IF NOT EXISTS commute_km numeric(6,2);