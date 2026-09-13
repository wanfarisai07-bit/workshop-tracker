-- ============================================================
-- Reset/compact companies.seq back to 1, 2, 3, ... sequentially,
-- preserving the table's current relative order (the same ordering
-- renumber_companies.sql used to assign CUS-XXXX ids), and keep the
-- underlying sequence in step so the next INSERT continues correctly.
--
-- `seq` is a plain bigserial bookkeeping/ordering column — it has no
-- unique constraint and nothing else in the schema has a foreign key
-- to it (only companies.id is referenced, by
-- registered_vehicles.company_id), so this is a self-contained,
-- single-table, single-column fix. The only place `seq`'s *value*
-- matters is display order (`listCompanies()` in
-- src/api/supabaseApi.ts does `.order('seq', { ascending: true })`),
-- which this preserves exactly since rows keep their relative order —
-- only the gaps between numbers are removed.
--
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor ->
-- New query -> paste this whole file -> Run). Safe to re-run: once
-- seq is already 1..N with no gaps, a second run is a no-op.
-- ============================================================

begin;

-- 0. Guard: renumber_companies.sql should already have detached
--    companies.id from `seq` (id is now driven by its own
--    companies_id_seq default, not a live formula on seq). If id is
--    still a GENERATED column, updating seq here would silently
--    rewrite id too via the old ('CUS-' || (1000+seq)) formula —
--    stop and say so instead of doing that quietly.
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

-- 1. Compact seq to 1..N, keeping every row's relative order.
update companies c
set seq = ranked.new_seq
from (
  select seq as old_seq, row_number() over (order by seq) as new_seq
  from companies
) ranked
where c.seq = ranked.old_seq;

-- 2. Re-sync the bigserial's backing sequence so the next INSERT
--    continues at N+1 instead of jumping back to the old counter
--    (or colliding with a seq value we just assigned).
select setval(
  pg_get_serial_sequence('companies', 'seq'),
  (select count(*) from companies)
);

commit;

-- ---------- Verification ----------
-- Run after the commit above:
--
-- select seq, id, name from companies order by seq;
-- (seq should now read 1, 2, 3, ... with no gaps, and — since both
-- were derived from the same original order — seq N should line up
-- with id CUS-000N.)
