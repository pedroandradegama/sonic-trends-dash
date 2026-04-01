
-- Frente 1: Tabela de clínicas pré-cadastradas
create table public.fn_preset_clinics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  address     text not null,
  city        text not null default 'Recife',
  state       text not null default 'PE',
  lat         numeric(10,7),
  lng         numeric(10,7),
  place_id    text,
  specialty   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.fn_preset_clinics enable row level security;
create policy "public read fn_preset_clinics" on public.fn_preset_clinics
  for select using (true);
create policy "admin write fn_preset_clinics" on public.fn_preset_clinics
  for all using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'master_admin'));

create index fn_preset_clinics_name_idx on public.fn_preset_clinics using gin(to_tsvector('portuguese', name));

-- Seed 20 clínicas
insert into public.fn_preset_clinics (name, short_name, address, city, state, specialty) values
('IMAG – Diagnóstico por Imagem', 'IMAG', 'Av. Visconde de Jequitinhonha, 209, Boa Viagem', 'Recife', 'PE', 'radiologia'),
('Hospital Esperança Recife', 'H. Esperança', 'Av. Agamenon Magalhães, 4760, Espinheiro', 'Recife', 'PE', 'radiologia'),
('Hospital da Restauração', 'H. Restauração', 'Av. Gov. Agamenon Magalhães, s/n, Derby', 'Recife', 'PE', 'radiologia'),
('Hospital Universitário Oswaldo Cruz', 'HUOC', 'Rua Arnóbio Marques, 310, Santo Amaro', 'Recife', 'PE', 'radiologia'),
('Real Hospital Português', 'RHP', 'Av. Agamenon Magalhães, 4760, Paissandu', 'Recife', 'PE', 'radiologia'),
('Hospital Santa Joana', 'H. Santa Joana', 'Av. Eng. Domingos Ferreira, 2826, Boa Viagem', 'Recife', 'PE', 'radiologia'),
('Hospital Memorial São José', 'Memorial', 'Av. Gov. Agamenon Magalhães, 1296, Empresarial', 'Recife', 'PE', 'radiologia'),
('Hospital da Unimed Recife', 'Unimed', 'Av. Conselheiro Rosa e Silva, 1021, Aflitos', 'Recife', 'PE', 'radiologia'),
('Clínica CEDO', 'CEDO', 'Rua Padre Carapuceiro, 858, Boa Viagem', 'Recife', 'PE', 'radiologia'),
('Clínica SIM – Serviço de Imagem', 'SIM', 'Av. Domingos Ferreira, 3532, Boa Viagem', 'Recife', 'PE', 'radiologia'),
('Clínica CDI', 'CDI', 'Rua João Eugênio de Lima, 235, Boa Viagem', 'Recife', 'PE', 'imagem'),
('Diagnósticos da América – DASA Recife', 'DASA', 'Av. Visconde de Jequitinhonha, 630, Boa Viagem', 'Recife', 'PE', 'laboratorio'),
('Clínica IMEB', 'IMEB', 'Rua Padre Carapuceiro, 730, Boa Viagem', 'Recife', 'PE', 'imagem'),
('UDI – Ultrassom e Diagnóstico por Imagem', 'UDI', 'Av. Agamenon Magalhães, 2200, Espinheiro', 'Recife', 'PE', 'ultrassom'),
('Hospital Barão de Lucena', 'Barão de Lucena', 'Av. Caxangá, 3860, Cordeiro', 'Recife', 'PE', 'radiologia'),
('Hospital IMIP', 'IMIP', 'Rua dos Coelhos, 300, Boa Vista', 'Recife', 'PE', 'radiologia'),
('Hospital Agamenon Magalhães', 'H. Agamenon', 'Estrada do Arraial, 2723, Casa Amarela', 'Recife', 'PE', 'radiologia'),
('Clínica Multimagem', 'Multimagem', 'Av. Boa Viagem, 5200, Boa Viagem', 'Recife', 'PE', 'imagem'),
('Centro Médico Bezerra de Menezes', 'CMBM', 'Rua Padre Carapuceiro, 500, Boa Viagem', 'Recife', 'PE', 'radiologia'),
('Hospital da Brigada Militar – HBM', 'HBM', 'Av. Cruz Cabugá, 1780, Santo Amaro', 'Recife', 'PE', 'radiologia');

-- Frente 3: WhatsApp no perfil do médico + log de queries
alter table public.fn_doctor_profile
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_digest_enabled boolean not null default true;

create table if not exists public.fn_whatsapp_queries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  from_number text not null,
  query_type  text not null,
  query_text  text,
  response    text,
  month_ref   text,
  created_at  timestamptz not null default now()
);

alter table public.fn_whatsapp_queries enable row level security;
create policy "own queries fn_whatsapp_queries" on public.fn_whatsapp_queries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
