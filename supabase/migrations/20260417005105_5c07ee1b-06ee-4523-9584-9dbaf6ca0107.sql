CREATE UNIQUE INDEX IF NOT EXISTS commute_entries_service_unique
  ON public.commute_entries(service_id)
  WHERE service_id IS NOT NULL;