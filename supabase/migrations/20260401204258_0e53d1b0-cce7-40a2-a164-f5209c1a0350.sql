
create table public.fn_service_evaluations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  service_id      uuid not null references public.fn_services(id) on delete cascade,
  evaluated_at    date not null default current_date,
  period_label    text not null,

  score_remuneration    smallint check (score_remuneration between 0 and 10),
  score_punctuality     smallint check (score_punctuality between 0 and 10),
  score_transparency    smallint check (score_transparency between 0 and 10),
  score_legal_security  smallint check (score_legal_security between 0 and 10),

  score_equipment       smallint check (score_equipment between 0 and 10),
  score_environment     smallint check (score_environment between 0 and 10),
  score_volume          smallint check (score_volume between 0 and 10),
  score_development     smallint check (score_development between 0 and 10),
  score_perspective     smallint check (score_perspective between 0 and 10),
  score_reputation      smallint check (score_reputation between 0 and 10),

  score_commute         smallint check (score_commute between 0 and 10),
  score_flexibility     smallint check (score_flexibility between 0 and 10),
  score_bureaucracy     smallint check (score_bureaucracy between 0 and 10),

  weight_financial      smallint not null default 50,
  weight_work           smallint not null default 35,
  weight_logistics      smallint not null default 15,

  notes           text,
  created_at      timestamptz not null default now()
);

alter table public.fn_service_evaluations enable row level security;
create policy "own evaluations" on public.fn_service_evaluations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index fn_evals_user_service_idx
  on public.fn_service_evaluations(user_id, service_id, evaluated_at desc);

create table public.fn_kpi_snapshots (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  snapshot_month  date not null,
  total_gross     numeric(12,2) not null default 0,
  total_net       numeric(12,2) not null default 0,
  total_hours     numeric(8,2) not null default 0,
  effective_rate  numeric(8,2) not null default 0,
  shift_count     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, snapshot_month)
);

alter table public.fn_kpi_snapshots enable row level security;
create policy "own snapshots" on public.fn_kpi_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index fn_snapshots_user_month_idx
  on public.fn_kpi_snapshots(user_id, snapshot_month desc);
