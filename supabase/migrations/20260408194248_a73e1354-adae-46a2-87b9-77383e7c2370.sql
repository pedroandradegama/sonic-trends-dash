
-- Fix INSERT policy to allow both admin and master_admin
DROP POLICY IF EXISTS "Admins can insert authorized doctors" ON public.authorized_doctors;
CREATE POLICY "Admins can insert authorized doctors"
  ON public.authorized_doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

-- Also fix UPDATE and DELETE policies for consistency
DROP POLICY IF EXISTS "Admins can update authorized doctors" ON public.authorized_doctors;
CREATE POLICY "Admins can update authorized doctors"
  ON public.authorized_doctors FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins can delete authorized doctors" ON public.authorized_doctors;
CREATE POLICY "Admins can delete authorized doctors"
  ON public.authorized_doctors FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins can view all authorized doctors" ON public.authorized_doctors;
CREATE POLICY "Admins can view all authorized doctors"
  ON public.authorized_doctors FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
    OR true  -- keep existing public read for email check
  );
