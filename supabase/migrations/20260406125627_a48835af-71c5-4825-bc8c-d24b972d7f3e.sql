ALTER TABLE public.fn_services
  DROP CONSTRAINT IF EXISTS fn_services_distribution_frequency_check;

ALTER TABLE public.fn_services
  ADD CONSTRAINT fn_services_distribution_frequency_check
  CHECK (distribution_frequency IN ('monthly','quarterly','biannual','annual','irregular'));