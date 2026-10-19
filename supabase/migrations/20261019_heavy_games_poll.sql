-- Heavy games poll: one month-long poll, separate from morningmeeples.
-- Run once in the Supabase SQL editor. Safe to re-run.
-- The admin launches a poll with a start/end date (single row, slug 'heavy-games-poll');
-- voters mark the days they can make, shown as a month grid.

begin;

create table if not exists heavy_polls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists heavy_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references heavy_polls(id) on delete cascade,
  vote_date date not null,
  voter_name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists heavy_votes_unique
  on heavy_votes (poll_id, vote_date, lower(voter_name));

alter table heavy_polls enable row level security;
alter table heavy_votes enable row level security;

-- Same trust model as morningmeeples: anon key may read/write (voting needs no login).
-- The /sauron login only gates the UI; see workflows/heavy-games-poll.md.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'heavy_polls' and policyname = 'heavy_polls_all') then
    create policy heavy_polls_all on heavy_polls for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'heavy_votes' and policyname = 'heavy_votes_all') then
    create policy heavy_votes_all on heavy_votes for all to anon using (true) with check (true);
  end if;
end $$;

commit;
