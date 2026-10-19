# Heavy Games Poll (month-long)

Separate module from morningmeeples (which stays untouched). Group can't coordinate weekly, so one poll spans a start→end date range chosen by the admin.

## Step 1: Month-grid poll + Sauron tab — Status: in_progress
Code implemented and builds/lints clean; **pending manual testing** (needs the migration run first).

Decisions:
- Slug `heavy-games-poll`, public page `/heavy-games-poll` (static route, wins over `/[slug]`).
- Tables `heavy_polls` (single row, slug unique) and `heavy_votes` (poll_id, vote_date, voter_name; cascade delete; unique per poll/date/lower(name)). Migration: `supabase/migrations/20261019_heavy_games_poll.sql` — run manually in the Supabase SQL editor.
- Voters: enter a name, tap days on a Monday-first month grid (one grid per month in range), submit. Re-using a name replaces their earlier votes. Cells show vote count + green heat; hover shows who.
- `/sauron` has two tabs: Morning Meeples (existing AdminPanel, unchanged) and Heavy Games. Heavy Games tab: shows current poll + vote count, start/end date pickers, launch. If a poll exists, launching asks for confirmation, then deletes the old poll and its votes. Range max 92 days.
- No cron/rollover for this poll.

Open: home page link to the poll not added; poll title is fixed ("Heavy Games Poll").

## Step 2: Admin auth for /sauron — Status: in_progress
Login gate in `src/app/sauron/layout.tsx`, signed httpOnly cookie, creds from env `ADMIN_USERNAME` / `ADMIN_PASSWORD` (optional `ADMIN_SESSION_SECRET`). Set in Vercel before deploy; pending manual testing.
Known gap: AdminPanel and HeavyGamesAdmin write to Supabase with the public anon key from the browser, so this gates the UI only; closing it needs RLS or server-side actions.
