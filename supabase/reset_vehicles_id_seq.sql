-- ============================================================
-- Check, and if needed reset, the identity sequence backing
-- vehicles.id (bigint generated always as identity), now that the
-- table is empty — so the next inserted vehicle starts at id = 1
-- instead of continuing from wherever earlier testing left off.
--
-- Run in the Supabase SQL Editor (Dashboard -> SQL Editor -> New
-- query -> paste this whole file -> Run):
--   - Part 1 is a plain read-only SELECT — safe to run any time,
--     even against a non-empty table, just to see the current state.
--   - Part 2 only touches anything if vehicles is currently empty
--     (it raises an exception and does nothing otherwise), and only
--     runs ALTER SEQUENCE if the sequence isn't already effectively
--     at 1 — so it's safe to run repeatedly.
-- ============================================================

-- ---------- 1. Check ----------
select
  sequencename,
  last_value,
  is_called,
  case when is_called then coalesce(last_value, 0) + 1 else coalesce(last_value, 1) end
    as next_value_that_would_be_assigned
from pg_sequences
where sequencename = split_part(pg_get_serial_sequence('vehicles', 'id'), '.', 2);

-- ---------- 2. Reset (only if empty, only if actually needed) ----------
do $$
declare
  seqname  text := pg_get_serial_sequence('vehicles', 'id');
  next_val bigint;
begin
  if (select count(*) from vehicles) > 0 then
    raise exception
      'vehicles has % row(s) — refusing to reset its id sequence while it is not empty.',
      (select count(*) from vehicles);
  end if;

  select case when is_called then coalesce(last_value, 0) + 1 else coalesce(last_value, 1) end
  into next_val
  from pg_sequences
  where sequencename = split_part(seqname, '.', 2);

  if next_val = 1 then
    raise notice 'vehicles.id sequence already yields 1 next — nothing to do.';
  else
    execute format('alter sequence %s restart with 1', seqname);
    raise notice 'vehicles.id sequence reset: next value was % -> now 1.', next_val;
  end if;
end $$;
