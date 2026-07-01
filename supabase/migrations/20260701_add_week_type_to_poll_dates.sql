-- Adds two-week support to the morningmeeples poll_dates table.
-- Purely additive: does not delete or modify any existing poll_dates or
-- votes rows. Safe to re-run — each step is guarded so running this twice
-- won't duplicate data or error out.
--
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

begin;

-- 1. Add week_type column. Existing rows all get 'current' automatically
--    via the default — no existing data is touched.
alter table poll_dates
  add column if not exists week_type text not null default 'current';

-- 2. Add the validation constraint, but only if it doesn't already exist
--    (safe to re-run).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'poll_dates_week_type_check'
  ) then
    alter table poll_dates
      add constraint poll_dates_week_type_check check (week_type in ('current', 'next'));
  end if;
end $$;

-- 3. Backfill: create the initial "next week" (7 days after the existing
--    current week), with no votes attached. Only runs if a "next" week
--    doesn't already exist for this poll, so re-running is a no-op.
insert into poll_dates (poll_id, weekday_name, poll_date, week_type)
select poll_id, weekday_name, (poll_date::date + interval '7 day')::date, 'next'
from poll_dates
where poll_id = (select id from polls where slug = 'morningmeeples')
  and week_type = 'current'
  and not exists (
    select 1 from poll_dates pd2
    where pd2.poll_id = (select id from polls where slug = 'morningmeeples')
      and pd2.week_type = 'next'
  );

-- 4. Helpful index for the new week_type-scoped queries.
create index if not exists poll_dates_poll_week_idx on poll_dates (poll_id, week_type);

commit;

-- Sanity check after running: this should show your existing dates as
-- 'current' (with their original votes intact) plus 5 new empty 'next' rows.
-- select weekday_name, poll_date, week_type from poll_dates
-- where poll_id = (select id from polls where slug = 'morningmeeples')
-- order by week_type, poll_date;
