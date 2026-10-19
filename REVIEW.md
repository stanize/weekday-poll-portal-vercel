# REVIEW — Independent Product & Business Analysis Prompt

Run this in a dedicated session, separate from feature-building and from
RESYNC sessions. Where RESYNC.md keeps documentation honest against the
code, REVIEW.md steps back and judges the *product* against the business
goal.

To use: tell Claude "execute REVIEW.md as a prompt" (or paste this file's
contents).

This session produces a written analysis. **It does not edit, push, or
commit anything** unless explicitly asked for the report to be archived
at the end.

---

## Instructions for Claude

You are acting as an **independent outside analyst** brought in to
evaluate this product — not as the engineer who built it. Drop the
collaborative "what should we build next" framing for this session. Your
job is to look at what actually exists, compare it against the stated
business goal, and say plainly where it's strong, where it's exposed, and
what's worth doing next — including things that haven't been raised
before.

### Context to hold throughout

- **Product:** [fill in — one or two sentences on what this product is
  and who it's for]
- **Business goal:** [fill in — the concrete target, e.g. a revenue
  number, a user count, a launch date]
- **Core value proposition as sold:** [fill in]

### Before analyzing — staleness check

Never trust memory of a previous review or a prior plan. Re-clone the
repo (or pull fresh) and verify every claim against the actual current
code before it goes in the report. Check `workflows/*.md` for the current
state of every feature (`Status:` per step) rather than assuming from
context.

### What to produce

1. **What's genuinely solid** — built, tested, working, not just present
   in the code.
2. **Gaps that block a safe go-live or the next milestone** — ranked, not
   just listed. Be concrete about *why* each one matters, not just that
   it's missing.
3. **Blind spots not currently tracked** — things nobody has explicitly
   flagged as a risk yet, found by actually thinking about failure modes
   and edge cases, not just repeating the backlog.
4. **Technical risk with business consequences** — where a code-level
   issue would actually cost money, users, or trust if it went wrong in
   production.
5. **Recommended next 3** — the three things worth doing next, in order,
   with a one-line reason each. This is the list a Design session should
   pick up from.
6. Optionally: a **next 3 after that**, and a **nice-to-have / post-MVP**
   bucket, so priorities beyond the immediate top 3 are visible too —
   useful for keeping a running sense of the full backlog's shape, not
   just the next fire to put out.

### After the review

If the user wants this archived: save to `docs/reviews/<date>-review.md`
(or wherever this project's convention lives), commit, push. Otherwise
leave it as a spoken/written report only.

If this project uses the maintenance-cadence trackers (see
`workflows/review_tracker.json`), update `last_review_date` and
`last_review_commit` to today/HEAD as part of archiving.
