Replace the entire contents of CLAUDE.md with the following:

@AGENTS.md

# Project: Weekday Poll Portal

## Stack
- Next.js 16.2.2 (App Router) / React 19 / TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth)
- Deployed on Vercel

## Repo structure
src/
  app/
    page.tsx              ← Home page (links to create, manage, morningmeeples)
    [slug]/page.tsx        ← PUBLIC voting page for the morningmeeples poll — actively maintained,
                              fetches both current + next week (see "morningmeeples poll" below)
    sauron/                ← Admin panel for morningmeeples — scoped to week_type = 'current' only
    api/cron/
      reset-weekly-poll/   ← Vercel cron route (Friday 11:00 UTC), calls resetWeeklyPoll()
    auth/
      page.tsx            ← Magic link request form
      callback/route.ts   ← Supabase auth callback handler
    create/               ← Create Poll wizard (protected) — being extracted to a separate
                              project/repo; treat as legacy, avoid building on top of it
    manage/               ← Manage Polls page (protected) — same, being extracted
    poll/[slug]/          ← PUBLIC voting page for user-created polls — same, being extracted
  components/
    PollVotingForm.tsx    ← Per-week voting list + submit button for morningmeeples.
                              Takes voterName as a controlled prop (owned by PollTabs) —
                              does not render its own name input.
    PollTabs.tsx           ← Tabbed "This Week" / "Next Week" UI for morningmeeples.
                              Owns the shared voterName state and the segmented tab control.
                              Active-tab highlight uses bg-[var(--foreground)]
                              text-[var(--background)], NOT bg-white/text-black — hardcoded
                              white is invisible in light mode since the page background
                              flips via prefers-color-scheme in globals.css.
    MagicLinkForm.tsx     ← Magic link email input
    DateGeneratorForm.tsx ← Date/frequency/time picker for Create Poll (legacy, being extracted)
  lib/
    generateDates.ts      ← Pure date generation utility (legacy, being extracted)
    resetWeeklyPoll.ts     ← Weekly rollover for morningmeeples (see below)
    supabase/
      client.ts           ← Browser client (used by morningmeeples)
      server.ts           ← SSR server client (new features only)
      middleware-client.ts ← Session refresh for middleware
  middleware.ts           ← Session middleware (scoped to /auth, /create, /manage, /poll)
supabase/
  migrations/             ← Hand-run SQL migrations (no migration tool wired up — run manually
                              in the Supabase SQL editor and note it here when you add one)

## morningmeeples poll (two-week model)

`poll_dates` rows for the morningmeeples poll have a `week_type` column: `'current'` or `'next'`.
Both weeks exist in the table simultaneously.

- `[slug]/page.tsx` fetches all `poll_dates` for the poll, splits them into `currentWeekDates`
  and `nextWeekDates` by `week_type`, and passes both into `PollTabs`.
- `PollTabs` renders a segmented tab control ("This Week" / "Next Week") and a shared name
  field above it. Each tab renders an independent `PollVotingForm` with its own date
  selection/submit button, but the name field is shared across both.
- `resetWeeklyPoll()` runs every Friday 11:00 UTC via the Vercel cron
  (`/api/cron/reset-weekly-poll`, schedule in `vercel.json`). It does NOT wipe everything —
  it deletes the outgoing current week (dates + votes), promotes the next week's dates
  (and its votes, untouched) to `week_type = 'current'`, then generates a fresh empty week
  as the new `'next'`, one week after the just-promoted week.
- `sauron/AdminPanel.tsx`'s manual "Reset Votes"/"Reset Poll" actions are scoped to
  `week_type = 'current'` only — they don't touch the auto-generated next week.

If you're changing this flow, keep `[slug]/page.tsx`, `PollVotingForm.tsx`, `PollTabs.tsx`,
`sauron/`, and `resetWeeklyPoll.ts` in sync — a schema or query change in one usually needs
a matching change in the others.

## Supabase tables

### morningmeeples
- polls
- poll_dates   → includes week_type ('current' | 'next'), see migration below
- votes

Migration for week_type: supabase/migrations/20260701_add_week_type_to_poll_dates.sql
(additive only — safe to re-run, never deletes existing dates/votes).

### User-created polls (legacy — being extracted to a separate project)
- user_polls        → id, owner_id, owner_email, title, description, slug, is_active, created_at
- user_poll_dates   → id, poll_id, weekday_name, poll_date, time_slot, created_at
- user_votes        → id, poll_id, poll_date_id, voter_name, session_token, created_at

All new tables have RLS enabled.

## Supabase clients
- Server Components / Route Handlers → import { createSupabaseServerClient } from "@/lib/supabase/server"
- Client Components → createBrowserClient from "@supabase/ssr"
- morningmeeples code (client components) uses src/lib/supabase/client.ts

## Auth
- Passwordless magic link via Supabase Auth
- Protected routes: /create, /manage
- Auth guard pattern: call createSupabaseServerClient, getUser(), redirect to /auth?next=<path> if no session
- After magic link click → /auth/callback/route.ts exchanges code, redirects to intended page

## Design rules
- Dark minimal aesthetic — see src/app/page.tsx for reference
- Tailwind only, no external UI libraries
- Buttons: rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition
- Inputs: w-full rounded-lg border px-3 py-2 bg-transparent
- Cards: border rounded-xl p-6 space-y-4
- IMPORTANT: the page background/text flips light↔dark via `--background`/`--foreground` CSS
  vars in globals.css (prefers-color-scheme), but component classes like `bg-white` or
  `text-black` do NOT flip — they're always literally white/black. Any element meant to look
  "highlighted" or "inverted" relative to the current theme (not just always-white) should use
  `bg-[var(--foreground)] text-[var(--background)]` instead of `bg-white text-black`, or it
  will be invisible in light mode. Plain `border` (no explicit color) is fine in both modes.

## Key conventions
- All user-created-poll voting pages live at /poll/[slug] (NOT /[slug] — that is morningmeeples only)
- Slugs are stored in user_polls.slug and must be unique
- voter_name is the only identity for voters (no auth required to vote)
- generateDates() in src/lib/generateDates.ts returns GeneratedDate[] — use this for all
  user-created-poll date generation (not used by morningmeeples)

## Linear project
- Project: Boardgames Polls Portal (kaminolabs team)
- Current tasks: KAM-22 through KAM-32
- Task naming: feat/kam-{number}-{short-description}

## Rules
- Never use the polls/poll_dates/votes tables for the user-created-polls feature (and vice versa)
- Always use the SSR client (server.ts) in Server Components, never client.ts
- Always check auth in protected server components before rendering
- The user-created-polls feature (create/, manage/, poll/[slug]/, generateDates.ts,
  user_polls/user_poll_dates/user_votes tables) is being moved out of this repo into its own
  project — avoid new investment here unless asked