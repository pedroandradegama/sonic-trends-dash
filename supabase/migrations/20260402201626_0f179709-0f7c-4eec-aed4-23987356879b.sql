
create table public.fn_bank_connections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  pluggy_item_id  text not null unique,
  connector_name  text not null,
  connector_id    integer,
  account_type    text,
  label           text,
  is_pj           boolean not null default false,
  status          text not null default 'UPDATED'
                  check (status in ('UPDATED','UPDATING','LOGIN_ERROR','OUTDATED')),
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.fn_bank_connections enable row level security;
create policy "own connections" on public.fn_bank_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index fn_bank_conn_user_idx on public.fn_bank_connections(user_id);

create table public.fn_transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  connection_id       uuid not null references public.fn_bank_connections(id) on delete cascade,
  pluggy_tx_id        text not null unique,
  pluggy_account_id   text not null,
  description         text not null,
  amount              numeric(12,2) not null,
  date                date not null,
  status              text not null default 'POSTED' check (status in ('POSTED','PENDING')),
  category            text,
  category_id         text,
  merchant_name       text,
  merchant_cnpj       text,
  merchant_category   text,
  is_credit_card      boolean not null default false,
  installment_number  integer,
  total_installments  integer,
  total_amount        numeric(12,2),
  bill_id             text,
  card_number         text,
  is_pj_expense       boolean,
  fn_service_id       uuid references public.fn_services(id) on delete set null,
  custom_category     text,
  note                text,
  detected_as_income  boolean not null default false,
  matched_service_id  uuid references public.fn_services(id) on delete set null,
  created_at          timestamptz not null default now()
);

alter table public.fn_transactions enable row level security;
create policy "own transactions" on public.fn_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index fn_tx_user_date_idx   on public.fn_transactions(user_id, date desc);
create index fn_tx_pluggy_id_idx   on public.fn_transactions(pluggy_tx_id);
create index fn_tx_bill_idx        on public.fn_transactions(bill_id) where bill_id is not null;

create table public.fn_spending_summaries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  month           date not null,
  total_spending  numeric(12,2) not null default 0,
  total_income    numeric(12,2) not null default 0,
  savings_rate    numeric(5,2),
  by_category     jsonb,
  pj_expenses     numeric(12,2) not null default 0,
  credit_card_total numeric(12,2) not null default 0,
  updated_at      timestamptz not null default now(),
  unique(user_id, month)
);

alter table public.fn_spending_summaries enable row level security;
create policy "own summaries" on public.fn_spending_summaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
