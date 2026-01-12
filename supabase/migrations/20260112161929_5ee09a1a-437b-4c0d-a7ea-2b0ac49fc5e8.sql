-- Insert master_admin role for Pedro
INSERT INTO public.user_roles (user_id, role)
VALUES ('a2c10ae4-0324-4b15-ae01-8e770f567440', 'master_admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create RLS policy for master admins to view all profiles
CREATE POLICY "Master admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'master_admin'::app_role));

-- Create RLS policy for master admins to view all Repasse data
CREATE POLICY "Master admins can view all repasse"
ON public."Repasse"
FOR SELECT
USING (public.has_role(auth.uid(), 'master_admin'::app_role));

-- Create RLS policy for master admins to view all NPS data
CREATE POLICY "Master admins can view all NPS data"
ON public."NPS"
FOR SELECT
USING (public.has_role(auth.uid(), 'master_admin'::app_role));

-- Create RLS policy for master admins to view all Casuistica data
CREATE POLICY "Master admins can view all casuistica"
ON public."Casuistica"
FOR SELECT
USING (public.has_role(auth.uid(), 'master_admin'::app_role));