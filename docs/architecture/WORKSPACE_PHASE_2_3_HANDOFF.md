# Handoff Brief: Remaining Workspace/B2B Work

Context for whichever tool picks this up: Prompt & Pause is a Next.js 14 (App Router) +
Supabase app. This session's prior work built the core social layer and Phase 1 of a
workspace/B2B feature. Three items were identified as non-blocking for launch but still
need doing. Full architecture context lives in
`docs/architecture/WORKSPACE_B2B_ARCHITECTURE.md` -- read that first.

**Codebase conventions to follow (established across this whole app, not optional style
preferences):**
- Business logic lives in `lib/services/*.ts`, API routes are thin wrappers that call it
  (see `lib/services/orgService.ts` for the pattern this feature already uses)
- Supabase embeds like `profiles(...)` frequently fail because several tables' FKs point
  at `public.users`, not `profiles`, directly. If you write a query that embeds `profiles`
  and get a "could not find a relationship" or "more than one relationship" error, don't
  fight it -- fetch the two tables separately and merge in JS. Every fix like this in the
  codebase has an inline comment explaining it; search for `// NOTE:` or `// circle_members`
  for examples.
- All new tables need RLS from the start, restricted appropriately, plus a
  `_service_role_all` policy for `service_role` only (see `Sql scripts/workspace_b2b_phase1.sql`
  for the exact pattern used throughout this feature)
- Rate-limit any new POST/write endpoint using `rateLimitOr429` from
  `lib/utils/rateLimitResponse.ts`

---

## Task 1: Verify the Circles feature actually works

**Status:** A suspected bug (same class as several others found this session -- an
ambiguous/missing PostgREST relationship on a `profiles(...)` embed) was fixed at
`app/api/social/circles/route.ts`, but was never actually tested end-to-end because the
feature hadn't been used yet.

**What to do:**
1. Create a circle via `POST /api/social/circles`
2. Add a member via whatever UI/route exists for `circle_members` (check if this route
   exists yet -- it may not; if there's no way to add a member to a circle currently, that's
   also worth flagging/building)
3. Fetch via `GET /api/social/circles` and confirm the member's profile (name, avatar,
   username) comes back correctly, not `null`
4. If it's still broken, the fix pattern is already in the file's comments -- follow the
   same two-query-then-merge approach used everywhere else

---

## Task 2: Workspace Analytics (Phase 2)

**Status:** Not started. Schema exists (`organization_engagement_daily`,
`organization_consent` tables, already migrated), nothing reads or writes them yet.

**Non-negotiable privacy rules (see architecture doc for full reasoning):**
- Org admins get aggregate numbers only -- counts and averages. Never a query that could
  expose what an individual member wrote or how they're doing.
- **k-anonymity floor of 5.** If fewer than 5 members were active on a given day, don't
  write a row for that date at all (or write it with values suppressed) -- a team of 3
  showing "1 active today" is a de-anonymization risk even without a name attached. This
  must be enforced in the aggregation job itself, not the UI layer.
- A member's activity only counts toward the aggregate if they have a row in
  `organization_consent` for that org. No consent record = excluded entirely, silently.

**What to build:**
1. **Aggregation cron job** (`app/api/cron/aggregate-org-engagement/route.ts`, following the
   pattern of existing cron routes in `app/api/cron/*` -- Bearer-token-protected via
   `CRON_SECRET`, service-role client). For each active organization, for each day needing
   backfill: count active members (must have a `organization_consent` row + at least one
   reflection that day), count total reflections, average mood score. Skip writing the row
   entirely if active member count < 5. Insert into `organization_engagement_daily`.
2. **Consent UI**: a screen or modal, separate from any other consent/ToS, shown when a
   member joins an org (or an explicit opt-in toggle in `/workspace/[id]`), that plainly
   states what's tracked and what isn't, before writing to `organization_consent`.
3. **Analytics API**: `GET /api/org/[id]/analytics` -- owner/admin only (reuse
   `isOrgAdminOrOwner` from `lib/services/orgService.ts`), returns the
   `organization_engagement_daily` rows for that org, date-ranged.
4. **Analytics UI**: a new tab/section in `/workspace/[id]/page.tsx` (or a dedicated
   `/workspace/[id]/analytics/page.tsx`) with a simple trend chart (recharts is already a
   project dependency, used elsewhere in the app) for reflections count and active member
   count over time. Any date with no row (below the k-anonymity floor) should render as
   "Not enough data yet," not a zero or a gap that implies something.

---

## Task 3: Org-level Slack Integration (Phase 3)

**Status:** Not started. Currently each individual user can set `delivery_method: 'slack'`
in `user_preferences` with their own personal webhook URL -- this task formalizes that into
one Slack app install per organization.

**What to build:**
1. Add `slack_team_id`, `slack_access_token`, `slack_default_channel_id` (or similar) to
   `organizations.settings` (jsonb) or a new `organization_integrations` table -- prefer
   the jsonb column unless this grows more integrations later, to avoid another table for
   one feature.
2. Standard Slack OAuth install flow: `GET /api/org/[id]/slack/install` (redirects to
   Slack's OAuth authorize URL) and `GET /api/org/[id]/slack/callback` (exchanges the code,
   stores the token). Existing `SLACK_CLIENT_ID`/`SLACK_CLIENT_SECRET`/`SLACK_SIGNING_SECRET`
   env vars already exist in `.env.example` for the personal integration -- confirm whether
   this needs its own Slack app or can reuse the existing one with an expanded OAuth scope.
3. A member-level setting: "receive workspace prompts via org Slack" (opt-in, doesn't
   override their personal delivery preference unless they choose it)
4. Update the daily prompt delivery cron (`app/api/cron/send-daily-prompts/route.ts` --
   read it first to understand the existing per-user delivery loop) to also check for
   org-level Slack delivery preference and send there instead of/alongside email

---

## Priority order
Task 1 (quick verification, do first) -> Task 2 (meaningful feature, most value) -> Task 3
(nice-to-have, lowest urgency -- no organization has hit this need yet).
