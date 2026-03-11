
ALTER TABLE public.member_referrals
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referrer_nome text DEFAULT NULL;

-- Allow master admins to update (already exists but ensure started_at is updateable)
-- No new policy needed, existing UPDATE policy for master_admin covers this
