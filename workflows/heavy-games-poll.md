# Heavy Games Poll (month-long)

Separate module from morningmeeples (which stays untouched). Group can't coordinate weekly, so one poll spans a whole month.

## Step 1: Design — Status: not_started
Settled:
- Slug: `heavy-games-poll`
- Own routes and own tables; does not use polls/poll_dates/votes or the legacy user_* tables.
- One poll covers a full month; no weekly rollover/cron.
Open (ask owner): what is being decided (single day vs several sessions), month grid vs list, who creates it (owner-only?).

## Step: Admin auth for /sauron — Status: in_progress
Code implemented (pending manual testing): login gate in `src/app/sauron/layout.tsx`, signed httpOnly cookie, creds from env `ADMIN_USERNAME` / `ADMIN_PASSWORD` (optional `ADMIN_SESSION_SECRET`). Must be set in Vercel before deploy.
Known gap: AdminPanel still writes to Supabase with the public anon key from the browser, so this gates the UI only; closing it needs RLS or server-side actions.
