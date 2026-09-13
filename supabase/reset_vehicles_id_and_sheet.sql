-- ============================================================
-- One-time fix for the freshly-imported vehicles table:
--
--   1. Renumber vehicles.id back to 1, 2, 3, ... in the table's
--      current id order (today that's just one row, sitting at
--      id = 21).
--   2. Fix each row's `sheet` to match, zero-padded 4 digits —
--      "SA-2026-0001" — matching the CUS-0001 / VEH-0001 convention.
--      src/api/supabaseApi.ts (checkIn / createAppointment) and
--      src/api/mockApi.ts have been updated alongside this script to
--      build `sheet` as 'SA-2026-' + String(seq).padStart(4, '0'), so
--      every future vehicle keeps the same zero-padded look this
--      script gives the existing row.
--   3. Reset both underlying counters so the *next* inserted vehicle
--      continues at id = 2 / sheet "SA-2026-0002":
--        - the identity sequence backing vehicles.id
--        - the `counters` table's 'vehicle_seq' row backing `sheet`
--
-- Nothing else in the schema has a foreign key to vehicles.id (it's
-- a standalone/leaf table — registered_vehicles and companies don't
-- reference it), so this is fully self-contained; no other table
-- needs updating.
--
-- Run once in the Supabase SQL Editor. Safe to re-run: once id/sheet
-- are already sequential from 1, a second run is a no-op.
-- ============================================================

begin;

-- ---------- 0. Digit-width guard for the 4-digit SA-2026-XXXX format ----------
do $$
begin
  if (select count(*) from vehicles) > 9999 then
    raise exception
      'vehicles has more than 9999 rows — widen the lpad width below before renumbering.';
  end if;
end $$;

-- ---------- 1 & 2. Renumber id and sheet together, in current id order ----------
create temporary table vehicle_map on commit drop as
select
  id as old_id,
  row_number() over (order by id) as new_id
from vehicles;

-- vehicles.id is GENERATED ALWAYS AS IDENTITY, which — like a stored
-- generated column — refuses direct UPDATEs of its own value.
-- Detach the identity property so it becomes a normal, writable
-- bigint column (still primary-key, still not-null).
alter table vehicles
  alter column id drop identity if exists;

update vehicles v
set id    = m.new_id,
    sheet = 'SA-2026-' || lpad(m.new_id::text, 4, '0')
from vehicle_map m
where v.id = m.old_id;

-- ---------- 3a. Re-attach identity on id, starting right after the last row ----------
do $$
declare
  next_id bigint;
begin
  select coalesce(max(id), 0) + 1 into next_id from vehicles;
  execute format(
    'alter table vehicles alter column id add generated always as identity (start with %s)',
    next_id
  );
end $$;

-- ---------- 3b. Reset the sheet counter the same way ----------
-- counters.value holds "the last sheet number already assigned";
-- next_counter() increments it *before* returning, so setting this to
-- the current row count makes the very next call return count + 1.
update counters
set value = (select count(*) from vehicles)
where key = 'vehicle_seq';

commit;

-- ---------- Verification ----------
-- select id, sheet, plate, stage from vehicles order by id;
-- select * from counters where key = 'vehicle_seq';
