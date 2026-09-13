-- ============================================================
-- One-time cleanup, combining:
--
--   1. companies.seq       -> compacted back to 1, 2, 3, ...
--   2. registered_vehicles.seq -> compacted back to 1, 2, 3, ...
--   3. registered_vehicles.id  -> renumbered to VEH-0001, VEH-0002, ...
--      (companies.id / CUS-XXXX is NOT touched here — it was already
--      fixed by renumber_companies.sql and this script assumes that
--      already happened; see the guard below)
--
-- All four numbers are recomputed in each table's CURRENT seq order,
-- so nothing gets reshuffled relative to today — only the gaps
-- (companies.seq starting near 1834, registered_vehicles.seq near
-- 1576) are removed.
--
-- Why this can't break the companies <-> registered_vehicles FK:
--   registered_vehicles.company_id references companies.id, and this
--   script never changes any companies.id value — only companies.seq
--   (an unreferenced bookkeeping column). So that relationship is
--   simply never touched. Likewise, nothing in the schema has a
--   foreign key pointing at registered_vehicles.id or .seq, so
--   renumbering those is fully self-contained to this one table.
--
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor ->
-- New query -> paste this whole file -> Run). Safe to re-run: once
-- both tables' seq/id are already gap-free, a second run is a no-op.
-- ============================================================

begin;

-- ---------- Guards ----------

-- 0a. companies.id must already be a plain column (renumbered to
--     CUS-0001-style by renumber_companies.sql). If it's still
--     GENERATED, this script stops instead of assuming state that
--     isn't there.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'companies' and column_name = 'id' and is_generated = 'ALWAYS'
  ) then
    raise exception
      'companies.id is still a generated column — run renumber_companies.sql first, then re-run this script.';
  end if;
end $$;

-- 0b. Digit-width guard for the 4-digit VEH-XXXX format used below.
do $$
begin
  if (select count(*) from registered_vehicles) > 9999 then
    raise exception
      'registered_vehicles has more than 9999 rows — widen the lpad width below before renumbering.';
  end if;
end $$;

-- ---------- 1. companies.seq: compact to 1..N ----------
-- companies.id no longer depends on seq (guarded above), so this
-- cannot disturb the CUS-XXXX ids already in place — it only
-- affects display order, which is preserved exactly since every
-- row keeps its position relative to the others.
update companies c
set seq = ranked.new_seq
from (
  select seq as old_seq, row_number() over (order by seq) as new_seq
  from companies
) ranked
where c.seq = ranked.old_seq;

select setval(
  pg_get_serial_sequence('companies', 'seq'),
  (select count(*) from companies)
);

-- ---------- 2. registered_vehicles: renumber id + seq together ----------
-- Snapshot the plan once, in the table's CURRENT seq order, so seq N
-- and the new VEH-000N line up for the same row (auto-cleaned at commit).
create temporary table rv_map on commit drop as
select
  id  as old_id,
  seq as old_seq,
  row_number() over (order by seq) as new_seq
from registered_vehicles;

-- registered_vehicles.id is currently
--   GENERATED ALWAYS AS ('VEH-' || seq) STORED
-- (note: no zero-padding in that old formula, so today's ids look
-- like "VEH-1576", not "VEH-0001"). Detach that formula so id
-- becomes a plain, writable (still primary-key, still not-null)
-- column. Nothing references registered_vehicles.id via FK, so no
-- constraint needs dropping/re-adding for this step.
alter table registered_vehicles
  alter column id drop expression if exists;

update registered_vehicles rv
set id  = 'VEH-' || lpad(m.new_seq::text, 4, '0'),
    seq = m.new_seq
from rv_map m
where rv.id = m.old_id;

-- registered_vehicles.company_id (the FK column) is completely
-- untouched by the update above — it still points at whatever
-- companies.id it always did, and those values haven't changed.

-- ---------- 3. Keep future inserts working ----------
-- createRegisteredVehicle() in src/api/supabaseApi.ts never sets
-- `id` itself — it relied on the generated column to fill it in.
-- Give id a default driven by its own dedicated sequence (seeded to
-- the current row count) so new registered vehicles keep getting
-- auto-assigned VEH-0001-style ids, continuing on from here.
create sequence if not exists registered_vehicles_id_seq owned by registered_vehicles.id;
select setval('registered_vehicles_id_seq', (select count(*) from registered_vehicles));
alter table registered_vehicles
  alter column id set default ('VEH-' || lpad(nextval('registered_vehicles_id_seq')::text, 4, '0'));

-- And re-sync seq's own backing sequence so the next INSERT
-- continues at N+1 instead of jumping back to the old ~1576 counter.
select setval(
  pg_get_serial_sequence('registered_vehicles', 'seq'),
  (select count(*) from registered_vehicles)
);

commit;

-- ---------- Verification ----------
-- Run these after the commit above:
--
-- select seq, id, name from companies order by seq;
--
-- select seq, id, company_id from registered_vehicles order by seq;
-- (seq should read 1, 2, 3, ... with no gaps, and id should read
-- VEH-0001, VEH-0002, ... lining up with seq the same way
-- companies' seq now lines up with CUS-000N.)
--
-- select rv.id, rv.plate, rv.company_id, c.name
-- from registered_vehicles rv
-- join companies c on c.id = rv.company_id
-- order by rv.seq;
-- (confirms every registered vehicle still resolves to the right
-- company after all the renumbering above.)
