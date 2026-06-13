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
    [slug]/page.tsx       ← PUBLIC voting page for morningmeeples poll (DO NOT TOUCH)
    sauron/               ← Admin panel for morningmeeples poll (DO NOT TOUCH)
    auth/
      page.tsx            ← Magic link request form
      callback/route.ts   ← Supabase auth callback handler
    create/               ← Create Poll wizard (protected)
    manage/               ← Manage Polls page (protected)
    poll/[slug]/          ← PUBLIC voting page for user-created polls
  components/
    PollVotingForm.tsx    ← Voting form for morningmeeples (DO NOT TOUCH)
    MagicLinkForm.tsx     ← Magic link email input
    DateGeneratorForm.tsx ← Date/frequency/time picker for Create Poll
  lib/
    generateDates.ts      ← Pure date generation utility
    supabase/
      client.ts           ← Browser client (used by morningmeeples — DO NOT TOUCH)
      server.ts           ← SSR server client (new features only)
      middleware-client.ts ← Session refresh for middleware
  middleware.ts           ← Session middleware (scoped to /auth, /create, /manage, /poll)

## Supabase tables

### Existing (morningmeeples — DO NOT TOUCH)
- polls
- poll_dates  
- votes

### New (user-created polls feature)
- user_polls        → id, owner_id, owner_email, title, description, slug, is_active, created_at
- user_poll_dates   → id, poll_id, weekday_name, poll_date, time_slot, created_at
- user_votes        → id, poll_id, poll_date_id, voter_name, session_token, created_at

All new tables have RLS enabled.

## Supabase clients
- Server Components / Route Handlers → import { createSupabaseServerClient } from "@/lib/supabase/server"
- Client Components → createBrowserClient from "@supabase/ssr"
- DO NOT use src/lib/supabase/client.ts in any new code — it is reserved for morningmeeples

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

## Key conventions
- All new voting pages live at /poll/[slug] (NOT /[slug] — that is morningmeeples only)
- Slugs are stored in user_polls.slug and must be unique
- voter_name is the only identity for voters (no auth required to vote)
- generateDates() in src/lib/generateDates.ts returns GeneratedDate[] — use this for all date generation

## Linear project
- Project: Boardgames Polls Portal (kaminolabs team)
- Current tasks: KAM-22 through KAM-32
- Task naming: feat/kam-{number}-{short-description}

## Rules
- Never modify files marked DO NOT TOUCH
- Never use the existing polls/poll_dates/votes tables in new code
- Always use the SSR client (server.ts) in Server Components, never client.ts
- Always check auth in protected server components before rendering