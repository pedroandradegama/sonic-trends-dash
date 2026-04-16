CREATE TABLE public.user_feature_flags (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, feature)
);

ALTER TABLE public.user_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own flags"
  ON public.user_feature_flags
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage flags"
  ON public.user_feature_flags
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master_admin'::app_role));

CREATE INDEX idx_user_feature_flags_user_id ON public.user_feature_flags(user_id);