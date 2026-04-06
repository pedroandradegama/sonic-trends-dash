ALTER TABLE public.fn_services
  DROP CONSTRAINT IF EXISTS fn_services_regime_check;

ALTER TABLE public.fn_services
  ADD CONSTRAINT fn_services_regime_check
  CHECK (regime IN (
    'pj_turno','pj_producao','clt','residencia','fellowship',
    'pro_labore','distribuicao_lucros'
  ));

ALTER TABLE public.fn_services
  ADD COLUMN IF NOT EXISTS fixed_monthly_value    numeric(12,2),
  ADD COLUMN IF NOT EXISTS monthly_hours          integer,
  ADD COLUMN IF NOT EXISTS is_taxed               boolean not null default false,
  ADD COLUMN IF NOT EXISTS tax_pct                numeric(5,2) default 0,
  ADD COLUMN IF NOT EXISTS distribution_frequency text check (
    distribution_frequency in ('monthly','biannual','annual','irregular')
  ),
  ADD COLUMN IF NOT EXISTS distribution_months    integer[];