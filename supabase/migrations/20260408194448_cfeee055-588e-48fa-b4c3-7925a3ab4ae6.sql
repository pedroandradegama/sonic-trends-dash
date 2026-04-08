
-- Function to check if a doctor has confirmed agendas in the current month
CREATE OR REPLACE FUNCTION public.is_doctor_agenda_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agenda_comunicacoes
    WHERE user_id = _user_id
      AND status = 'confirmada'
      AND date_trunc('month', data_agenda::date) = date_trunc('month', CURRENT_DATE)
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'master_admin')
  )
$$;
