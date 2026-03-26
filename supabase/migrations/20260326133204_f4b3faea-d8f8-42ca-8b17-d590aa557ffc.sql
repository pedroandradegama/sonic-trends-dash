-- Revenue: add regime/CLT fields to services
ALTER TABLE public.revenue_services
  ADD COLUMN IF NOT EXISTS regime text NOT NULL DEFAULT 'pj',
  ADD COLUMN IF NOT EXISTS monthly_gross numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_net numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enabled_shifts text[] DEFAULT ARRAY[]::text[];

-- Revenue: add shift hours
ALTER TABLE public.revenue_shift_values
  ADD COLUMN IF NOT EXISTS start_hour text DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS end_hour text DEFAULT '12:00';

-- OTP codes for 2FA
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role" ON public.otp_codes
  FOR ALL USING (true) WITH CHECK (true);