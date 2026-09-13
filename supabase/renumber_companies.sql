-- ============================================================
-- Renumber companies.id -> CUS-0001, CUS-0002, ... sequentially,
-- in the table's current `seq` order (i.e. original creation order),
-- and propagate the new ids everywhere they're referenced by FK
-- (currently just registered_vehicles.company_id) so no relationship
-- breaks.
--
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor ->
-- New query -> paste this whole file -> Run). It's safe to re-run:
-- once ids are already CUS-0001-style, a second run just re-derives
-- the same mapping and is a no-op.
-- ============================================================

begin;

-- 0. Sanity guard: CUS-XXXX only has 4 digits of headroom.
do $$
begin
  if (select count(*) from companies) > 9999 then
    raise exception
      'companies has more than 9999 rows — widen the lpad width below before renumbering.';
  end if;
end $$;

-- 1. Snapshot the renumbering plan: new id assigned in current seq order.
--    (`on commit drop` cleans this up automatically once the transaction ends.)
create temporary table id_map on commit drop as
select
  id as old_id,
  'CUS-' || lpad(row_number() over (order by seq)::text, 4, '0') as new_id
from companies;

-- 2. Drop every FK that points at companies(id) so its referencing
--    columns can be repointed to the new ids. (Looked up dynamically
--    rather than hardcoding the constraint name, in case it was ever
--    renamed from Postgres's default.)
do $$
declare
  fk record;
begin
  for fk in
    select conname, conrelid::regclass::text as tbl
    from pg_constraint
    where confrelid = 'companies'::regclass and contype = 'f'
  loop
    execute format('alter table %s drop constraint %I', fk.tbl, fk.conname);
  end loop;
end $$;

-- 3. companies.id is currently
--      GENERATED ALWAYS AS ('CUS-' || (1000 + seq)) STORED
--    so it can't be written to directly. Detach that formula so the
--    column becomes a plain (still primary-key, still not-null) column.
alter table companies
  alter column id drop expression if exists;

-- 4. Apply the new sequential ids to companies...
update companies c
set id = m.new_id
from id_map m
where c.id = m.old_id;

-- 5. ...and cascade the exact same mapping to every table that
--    referenced the old ids.
update registered_vehicles rv
set company_id = m.new_id
from id_map m
where rv.company_id = m.old_id;

-- 6. Re-attach the foreign key, unchanged from schema.sql.
alter table registered_vehicles
  add constraint registered_vehicles_company_id_fkey
  foreign key (company_id) references companies(id) on delete cascade;

-- 7. companies.id is no longer a generated column, but the app's
--    "add new customer" flow still never sets `id` itself on insert
--    (see createCompany in src/api/supabaseApi.ts) — it relies on the
--    database to fill it in. Give the column a default, driven by its
--    own dedicated sequence, so future companies keep getting
--    auto-assigned CUS-0001-style ids, continuing on from here.
create sequence if not exists companies_id_seq owned by companies.id;
select setval('companies_id_seq', (select count(*) from companies));
alter table companies
  alter column id set default ('CUS-' || lpad(nextval('companies_id_seq')::text, 4, '0'));

commit;

-- ---------- Verification ----------
-- Run these after the commit above to eyeball the result:
--
-- select id, name, seq from companies order by seq;
--
-- select rv.id, rv.company_id, c.name
-- from registered_vehicles rv
-- join companies c on c.id = rv.company_id
-- order by rv.seq;
