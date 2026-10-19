# RESYNC — Maintenance Prompt for Project Documentation

Run this in a dedicated session after a feature has shipped and been
tested, before starting the next feature. Do NOT run this mid-feature —
it assumes the repo is in a clean, working state.

Scope: this resyncs the project's architecture documentation (CLAUDE.md,
and any companion file like MODULES.md) against the actual codebase.
Nothing gets edited without the user's go-ahead — this session's job is
to produce a point-by-point proposal, not to rewrite files on its own
judgment.

To use: tell Claude "execute RESYNC.md" (or paste this file's contents as
the prompt).

---

## Instructions for Claude

You are performing a maintenance pass, not building a feature. Follow
these steps in order:

1. **Re-clone the repo fresh** (do not trust any warm clone from earlier
   in the conversation — another session may have pushed since).
2. **Read the current CLAUDE.md** (and MODULES.md or equivalent, if it
   exists) end to end.
3. **For every factual claim in it, verify against the actual code** —
   file paths, function names, described behavior, environment variables,
   schema. Never assume a claim is still true because it was true when
   written.
4. **Check `workflows/*.md`** for anything marked `done` since the last
   resync that isn't yet reflected in the architecture docs — a shipped
   feature's key decisions (why Better-Auth-over-X, why this table shape,
   etc.) belong in the docs, not only in the workflow file.
5. **Produce a point-by-point proposal**: for each stale/missing/wrong
   claim, state what the doc currently says, what's actually true, and
   the proposed replacement text. Group by section.
6. **Wait for the user's go-ahead** before editing anything. Once
   approved, make the edits, commit, push.

If this project uses the maintenance-cadence trackers (see
`workflows/resync_tracker.json`), update `last_resync_date` and
`last_resync_commit` to today/HEAD as part of pushing the approved
changes.
