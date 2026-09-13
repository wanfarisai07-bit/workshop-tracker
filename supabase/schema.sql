-- ============================================================
-- SA Workshop Progress — Supabase schema
--
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste this whole file -> Run).
-- It's safe to re-run: every statement drops/recreates its own object.
-- ============================================================

-- ---------- Counter (job-sheet numbering) ----------
-- Mirrors the in-memory `this.seq` the mock API used to keep, but as a
-- single atomic increment so two staff checking a vehicle in at the same
-- moment never collide on a job-sheet number. Company and registered-vehicle
-- codes don't need this: their `id` columns are generated straight from each
-- table's own `seq bigserial`, which Postgres already increments atomically.
drop table if exists counters cascade;
create table counters (
  key   text primary key,
  value bigint not null
);
insert into counters (key, value) values
  ('vehicle_seq', 134)   -- next job sheet is SA-2026-135, matching the original seed
on conflict (key) do nothing;

create or replace function next_counter(counter_key text)
returns bigint
language sql
security definer
as $$
  update counters set value = value + 1 where key = counter_key returning value;
$$;

-- ---------- Companies (the Customers CRM) ----------
drop table if exists registered_vehicles cascade;
drop table if exists companies cascade;

create table companies (
  seq     bigserial,
  id      text generated always as ('CUS-' || (1000 + seq)) stored primary key,
  name    text not null,
  phone   text not null default '—',
  type    text not null default '',   -- 'Individual' | 'Company' | 'Government' | ''
  pic     text not null default '',
  address text not null default '—',
  created_at timestamptz not null default now()
);

-- ---------- Registered vehicles (each company's fleet) ----------
create table registered_vehicles (
  seq        bigserial,
  id         text generated always as ('VEH-' || seq) stored primary key,
  company_id text not null references companies(id) on delete cascade,
  plate      text not null,
  chassis    text not null default '—',
  brand      text not null default '',
  type       text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- Vehicles (the live status board) ----------
drop table if exists vehicles cascade;
create table vehicles (
  id       bigint generated always as identity primary key,
  sheet    text not null,
  plate    text not null,
  type     text not null,
  customer text not null default 'Walk-in',
  stage    text not null default 'arrived', -- booked | arrived | inbay | ready | closed
  bay      int,
  at       bigint not null,   -- ms epoch: when this vehicle entered its current stage
  checkin  bigint,            -- ms epoch: when the vehicle was actually checked in
  promised text not null default 'To be confirmed',
  odo      text not null default '—',
  jobs     jsonb not null default '[]'::jsonb, -- [{ name: string, state: 0|1|2 }]
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
-- This app authenticates with Supabase's anon key only (its own "Sign in" screen
-- is a demo gate, not real Supabase auth), so every policy below simply allows
-- the anon role full access. Fine for an internal/prototype tool — if this ever
-- needs to be locked down per-user, replace these with policies keyed off `auth.uid()`.
alter table companies enable row level security;
alter table registered_vehicles enable row level security;
alter table vehicles enable row level security;

drop policy if exists "anon full access" on companies;
create policy "anon full access" on companies for all to anon, authenticated using (true) with check (true);

drop policy if exists "anon full access" on registered_vehicles;
create policy "anon full access" on registered_vehicles for all to anon, authenticated using (true) with check (true);

drop policy if exists "anon full access" on vehicles;
create policy "anon full access" on vehicles for all to anon, authenticated using (true) with check (true);

-- ---------- Realtime ----------
-- Lets every open tab/device (desktop + mobile) see each other's changes live.
alter publication supabase_realtime add table companies;
alter publication supabase_realtime add table registered_vehicles;
alter publication supabase_realtime add table vehicles;

-- ============================================================
-- Seed data — the same fleet/customers/companies the mock API shipped with.
-- ============================================================

insert into companies (name, phone, type, pic, address) values
  ('Kemaman Quarry', '09-859 2201', 'Company', 'Ahmad Zaki', 'Lot 22, Kawasan Perindustrian Kemaman, 24000 Kemaman, Terengganu'),
  ('Terengganu Aggregates', '09-622 4410', 'Company', 'Rosli Hamid', 'No. 8, Jalan Sultan Ismail, 21300 Kuala Terengganu, Terengganu'),
  ('MPKT Fleet', '09-773 5590', 'Government', 'Faridah Yusof', 'Majlis Perbandaran Kuala Terengganu, 20916 Kuala Terengganu, Terengganu'),
  ('Sri Iskandar Logistics', '05-411 8827', 'Company', 'Kumar Selvam', 'Lot 5, Jalan Perusahaan, 32600 Bota, Perak'),
  ('Petra Marine', '09-517 3302', 'Company', 'Wan Aziz', 'Jalan Kastam, Kuantan Port, 26080 Kuantan, Pahang');

-- Registered vehicles, matched to the companies just inserted (by name, since
-- their generated 'CUS-100x' codes depend on insert order but this keeps the
-- script robust either way).
insert into registered_vehicles (company_id, plate, chassis, brand, type)
select c.id, v.plate, v.chassis, v.brand, v.type
from (values
  ('Kemaman Quarry',           'TCM 6634', 'MHFC1JG8K12345678', 'Hino',     'Tipper trailer'),
  ('Terengganu Aggregates',    'WTB 4412', 'JHDCS1234567890AB', 'Isuzu',    'Tipper trailer'),
  ('MPKT Fleet',               'TAB 9078', 'KMFEB17JPGA012233', 'UD Truck', 'Compactor truck'),
  ('Sri Iskandar Logistics',   'WPQ 8815', 'JALFR16E7L7000921', 'Foton',    'Cargo body truck'),
  ('Petra Marine',             'WMN 4471', 'VF6JC000012345678', 'Scania',   'Lorry skylift'),
  ('MPKT Fleet',               'TAF 2290', 'KMFGB17JPGB044120', 'UD Truck', 'Compactor truck'),
  ('MPKT Fleet',               'WKL 7724', 'MHFA1JG5K88801234', 'Hino',     'Car'),
  ('Terengganu Aggregates',    'TAK 9902', 'JHDCS9988776655AB', 'Isuzu',    'Tipper trailer')
) as v(company_name, plate, chassis, brand, type)
join companies c on c.name = v.company_name;

-- Vehicles on the live board. `at`/`checkin` are seeded relative to the moment
-- this script runs (mirroring the mock API's `ago(minutes)` helper) so overdue
-- flags and elapsed times look sensible right after setup.
insert into vehicles (sheet, plate, type, customer, stage, bay, at, checkin, promised, odo, jobs)
values
  ('SA-2026-122', 'TCM 6634',  'Tipper trailer',   'Kemaman Quarry',          'inbay',   7,    (extract(epoch from now())*1000 - 318*60000)::bigint, (extract(epoch from now())*1000 - 402*60000)::bigint, 'Today 14:00',   '214 880', '[{"name":"Body fabrication & welding","state":1},{"name":"Hydraulic system repair","state":0}]'),
  ('SA-2026-118', 'WTB 4412',  'Tipper trailer',   'Terengganu Aggregates',   'inbay',   3,    (extract(epoch from now())*1000 - 205*60000)::bigint, (extract(epoch from now())*1000 - 268*60000)::bigint, 'Today 17:00',   '186 402', '[{"name":"Hydraulic system repair","state":2},{"name":"Brakes & suspension","state":1}]'),
  ('SA-2026-121', 'TAB 9078',  'Compactor truck',  'MPKT Fleet',              'inbay',   5,    (extract(epoch from now())*1000 - 96*60000)::bigint,  (extract(epoch from now())*1000 - 152*60000)::bigint, 'Tomorrow 10:00','98 130',  '[{"name":"Service minor","state":1},{"name":"Electrical & wiring","state":0}]'),
  ('SA-2026-123', 'WPQ 8815',  'Cargo body truck', 'Sri Iskandar Logistics',  'inbay',   1,    (extract(epoch from now())*1000 - 58*60000)::bigint,  (extract(epoch from now())*1000 - 110*60000)::bigint, 'Tomorrow 12:00','142 615', '[{"name":"Painting & finishing","state":1}]'),
  ('SA-2026-124', 'WA 3356 K', 'Cargo body truck', 'Sri Iskandar Logistics',  'arrived', null, (extract(epoch from now())*1000 - 74*60000)::bigint,  (extract(epoch from now())*1000 - 96*60000)::bigint,  'Thu 09:00',     '76 240',  '[{"name":"Body fabrication & welding","state":0},{"name":"Painting & finishing","state":0}]'),
  ('SA-2026-126', 'TBH 1208',  'Car',              'Jabatan Kerja Raya',      'arrived', null, (extract(epoch from now())*1000 - 16*60000)::bigint,  (extract(epoch from now())*1000 - 34*60000)::bigint,  'Today 16:00',   '54 018',  '[{"name":"Service minor","state":0},{"name":"Electrical & wiring","state":0}]'),
  ('SA-2026-128', 'TAK 9902',  'Tipper trailer',   'Terengganu Aggregates',   'arrived', null, (extract(epoch from now())*1000 - 41*60000)::bigint,  (extract(epoch from now())*1000 - 41*60000)::bigint,  'Thu 12:00',     '201 744', '[{"name":"Brakes & suspension","state":0},{"name":"Tyres","state":0}]'),
  ('SA-2026-129', 'WMN 4471',  'Lorry skylift',    'Petra Marine',            'arrived', null, (extract(epoch from now())*1000 - 12*60000)::bigint,  (extract(epoch from now())*1000 - 12*60000)::bigint,  'Today 18:00',   '33 905',  '[{"name":"Electrical & wiring","state":0}]'),
  ('SA-2026-119', 'TAF 2290',  'Compactor truck',  'MPKT Fleet',              'ready',   null, (extract(epoch from now())*1000 - 134*60000)::bigint, (extract(epoch from now())*1000 - 520*60000)::bigint, 'Today 11:00',   '117 260', '[{"name":"Service minor","state":2},{"name":"Brakes & suspension","state":2}]'),
  ('SA-2026-120', 'WKL 7724',  'Car',              'SUMAI internal pool',     'ready',   null, (extract(epoch from now())*1000 - 47*60000)::bigint,  (extract(epoch from now())*1000 - 290*60000)::bigint, 'Today 15:00',   '61 470',  '[{"name":"Tyres","state":2}]'),
  ('SA-2026-131', 'TBM 7781',  'Cargo body truck', 'Kuantan Freight',         'booked',  null, (extract(epoch from now())*1000)::bigint,             null,                                                  'Thu 09:00',     '—',       '[{"name":"Service minor","state":0},{"name":"Tyres","state":0}]'),
  ('SA-2026-132', 'TDA 5519',  'Compactor truck',  'MPKT Fleet',              'booked',  null, (extract(epoch from now())*1000)::bigint,             null,                                                  'Fri 08:30',     '—',       '[{"name":"Hydraulic system repair","state":0},{"name":"Puspakom","state":0}]'),
  ('SA-2026-133', 'WXP 2043',  'Car',              'SUMAI internal pool',     'booked',  null, (extract(epoch from now())*1000)::bigint,             null,                                                  'Fri 14:00',     '—',       '[{"name":"Service minor","state":0}]'),
  ('SA-2026-117', 'TCZ 3301',  'Lorry skylift',    'Petra Marine',            'closed',  null, (extract(epoch from now())*1000 - 1210*60000)::bigint,(extract(epoch from now())*1000 - 2180*60000)::bigint,'Mon 17:00',     '29 118',  '[{"name":"Puspakom","state":2}]');
