
-- 1. Calendar shifts table
create table public.fn_calendar_shifts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  service_id    uuid not null references public.fn_services(id) on delete cascade,
  shift_date    date not null,
  shift_type    text not null check (shift_type in (
    'slot1','slot2','slot3','slot4',
    'plantao_6h','plantao_12h','plantao_24h'
  )),
  status        text not null default 'projetado' check (status in (
    'projetado','confirmado','realizado','cancelado'
  )),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.fn_calendar_shifts enable row level security;
create policy "own shifts" on public.fn_calendar_shifts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index fn_shifts_user_date_idx
  on public.fn_calendar_shifts(user_id, shift_date);

-- 2. Voice commands log
create table public.fn_voice_commands (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  raw_transcript  text not null,
  parsed_actions  jsonb,
  applied         boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.fn_voice_commands enable row level security;
create policy "own voice" on public.fn_voice_commands
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Commute cache
create table public.fn_commute_cache (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  service_id      uuid not null references public.fn_services(id) on delete cascade,
  slot_type       text not null,
  duration_min    integer,
  distance_km     numeric(8,2),
  fetched_at      timestamptz not null default now(),
  unique(user_id, service_id, slot_type)
);

alter table public.fn_commute_cache enable row level security;
create policy "own commute" on public.fn_commute_cache
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
