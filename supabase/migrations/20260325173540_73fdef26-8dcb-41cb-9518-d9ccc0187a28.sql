create table public.revenue_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#378ADD',
  delta_months integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenue_services enable row level security;

create policy "Users manage own services"
  on public.revenue_services
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index revenue_services_user_id_idx on public.revenue_services(user_id);

-- revenue_shift_values
create table public.revenue_shift_values (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.revenue_services(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  shift_type text not null check (shift_type in ('manha','tarde','noite','p6','p12','p24')),
  value_brl numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_id, shift_type)
);

alter table public.revenue_shift_values enable row level security;

create policy "Users manage own shift values"
  on public.revenue_shift_values
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- revenue_shifts
create table public.revenue_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid not null references public.revenue_services(id) on delete cascade,
  shift_date date not null,
  shift_type text not null check (shift_type in ('manha','tarde','noite','p6','p12','p24')),
  status text not null default 'projetado' check (status in ('projetado','confirmado','realizado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, service_id, shift_date, shift_type)
);

alter table public.revenue_shifts enable row level security;

create policy "Users manage own shifts"
  on public.revenue_shifts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index revenue_shifts_user_date_idx on public.revenue_shifts(user_id, shift_date);

-- revenue_preferences
create table public.revenue_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  tax_rate numeric not null default 27,
  show_net boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenue_preferences enable row level security;

create policy "Users manage own preferences"
  on public.revenue_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);