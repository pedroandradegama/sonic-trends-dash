
CREATE TABLE public.fn_actual_production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES fn_services(id) ON DELETE CASCADE,
  production_month date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id, production_month)
);

ALTER TABLE public.fn_actual_production ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own production" ON public.fn_actual_production
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
