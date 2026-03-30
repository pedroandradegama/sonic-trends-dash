
-- Block 3: shift adjustments log
create table public.fn_shift_adjustments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  shift_id      uuid references public.fn_calendar_shifts(id) on delete set null,
  adjustment_type text not null check (adjustment_type in ('added','removed','changed')),
  shift_date    date not null,
  service_id    uuid references public.fn_services(id) on delete set null,
  shift_type    text,
  reason        text,
  gross_impact  numeric(12,2) default 0,
  created_at    timestamptz not null default now()
);

alter table public.fn_shift_adjustments enable row level security;
create policy "own adjustments" on public.fn_shift_adjustments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index fn_adjustments_user_date_idx
  on public.fn_shift_adjustments(user_id, shift_date);

-- Block 3: projection preferences
create table public.fn_projection_prefs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade unique,
  show_net        boolean not null default false,
  tax_rate        numeric(5,2) not null default 27,
  filter_service  text default 'all',
  filter_regime   text default 'all',
  filter_method   text default 'all',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.fn_projection_prefs enable row level security;
create policy "own prefs" on public.fn_projection_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
