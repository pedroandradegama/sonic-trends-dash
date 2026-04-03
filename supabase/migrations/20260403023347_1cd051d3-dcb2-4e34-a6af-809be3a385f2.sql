
CREATE TABLE public.fn_recurrence_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.fn_services(id) ON DELETE CASCADE NOT NULL,
  shift_type TEXT NOT NULL,
  weekday INT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly')),
  start_month TEXT NOT NULL,
  end_month TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fn_recurrence_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recurrence rules"
  ON public.fn_recurrence_rules
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
