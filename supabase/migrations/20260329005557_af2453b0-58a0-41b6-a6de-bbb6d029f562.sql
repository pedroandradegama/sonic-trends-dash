-- 1.1 Perfil financeiro do médico
create table public.fn_doctor_profile (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade unique,
  home_address        text,
  home_lat            numeric(10,7),
  home_lng            numeric(10,7),
  home_place_id       text,
  monthly_net_goal    numeric(12,2) default 0,
  include_13th        boolean not null default false,
  include_vacation    boolean not null default false,
  primary_regime      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.fn_doctor_profile enable row level security;
create policy "own profile" on public.fn_doctor_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 1.2 Serviços
create table public.fn_services (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  color         text not null default '#378ADD',
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  address       text,
  lat           numeric(10,7),
  lng           numeric(10,7),
  place_id      text,
  regime        text not null default 'pj_turno',
  primary_method      text,
  method_mix          jsonb,
  payment_delta       integer not null default 1,
  fiscal_mode         text not null default 'A',
  fiscal_pct_total    numeric(5,2) default 15,
  fiscal_pct_base     numeric(5,2) default 10,
  fiscal_fixed_costs  numeric(12,2) default 0,
  fixed_monthly_salary numeric(12,2),
  required_hours_month integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.fn_services enable row level security;
create policy "own services" on public.fn_services
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index fn_services_user_idx on public.fn_services(user_id);

-- 1.3 Valores por tipo de turno
create table public.fn_shift_values (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references public.fn_services(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  shift_type    text not null,
  value_brl     numeric(12,2) not null default 0,
  unique(service_id, shift_type)
);

alter table public.fn_shift_values enable row level security;
create policy "own shift values" on public.fn_shift_values
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 1.4 Despesas fixas detalhadas
create table public.fn_service_expenses (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references public.fn_services(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  label         text not null,
  amount_brl    numeric(12,2) not null default 0,
  frequency     text not null default 'monthly',
  created_at    timestamptz not null default now()
);

alter table public.fn_service_expenses enable row level security;
create policy "own expenses" on public.fn_service_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 1.5 Progresso de onboarding
create table public.fn_onboarding_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade unique,
  block1_pct    integer not null default 0,
  block2_pct    integer not null default 0,
  block3_pct    integer not null default 0,
  block4_pct    integer not null default 0,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now()
);

alter table public.fn_onboarding_progress enable row level security;
create policy "own progress" on public.fn_onboarding_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);