# Workspace / B2B Architecture — Design Doc

**Status:** Decisions finalized, implementation starting.
**Author:** Designed with Claude, informed by industry research (Headspace for Work / Calm
for Business privacy models, B2B SaaS pricing conventions), [date of this session].

## Finalized Decisions

1. **Per-member visibility:** Admins see the roster only -- name, email, join date, last
   active date -- for seat management. This matches the Headspace for Work / Calm for
   Business precedent exactly (confirmed via research: both show registration/last-active
   info to employers, never content). Reflection content, mood data, and any wellbeing
   signal remain aggregate-only, never per-member, with the k-anonymity floor described
   below.
2. **Pricing:** Per-seat, monthly, with a 20% annual discount option. Simple allocated-seat
   billing for MVP (not active-user metering) -- metering is real infrastructure not worth
   building speculatively before a single org customer exists. Straightforward to tighten
   later.
   **Final numbers (set via `scripts/setup-org-stripe-prices.js`):** £7.50/seat/month,
   £72/seat/year (£6/mo equivalent). £7.50/mo matches the "Starting at £75/month for 10
   users" already published on the pricing page, and sits inside the £5-15/employee/month
   range found for comparable SME wellbeing tools (Headspace for Work, Calm Business) --
   not their heavily-negotiated 100+ seat enterprise floor, which isn't a realistic
   comparison without a sales team.
3. **Self-serve:** The product supports self-serve org creation for any team size. The
   marketing site's "Contact Sales" positioning for 10+ seats is a business/positioning
   choice layered on top, not a technical restriction.
4. **Org defaults:** Cosmetic and opt-in only (e.g. a branded focus area or theme an org can
   offer). Never auto-applied to a member's personal reflections without their explicit
   choice -- consistent with the personal product's existing visibility-control principle.

## Core Principle

This feature is purely additive. It must never require changing `profiles`, `reflections`,
`users`, or any existing RLS policy or API route. An individual user who never joins or
creates a workspace should be completely unaffected -- their data model, their app
experience, and their code paths stay exactly as they are today.

This is a hard constraint, not a preference. The personal product is stable and tested;
this feature must not be able to destabilize it, even accidentally.

## Data Model

Five new tables. Nothing else touched.

```sql
organizations
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid not null references auth.users(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  seat_count int not null default 0,
  plan text not null default 'team',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()

organization_members
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('invited', 'active', 'removed')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique(organization_id, user_id)

organization_invites
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  token text unique not null,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()

-- AGGREGATE ONLY. Never contains reflection text or per-user mood data.
-- Populated by a scheduled service-role job, same pattern as existing cron jobs.
organization_engagement_daily
  organization_id uuid not null references organizations(id) on delete cascade,
  date date not null,
  active_member_count int not null,
  reflections_count int not null,
  avg_mood_score numeric,
  primary key (organization_id, date)

-- Explicit, separate consent from ToS. Required before a member's activity
-- contributes to organization_engagement_daily at all.
organization_consent
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  consented_at timestamptz not null default now(),
  consent_version text not null,
  primary key (organization_id, user_id)
```

## Privacy Architecture (the part that matters most)

This is a mental wellness product used inside a workplace -- a materially different trust
context than consumer use. The design reflects that:

1. **Org admins never see individual reflections.** No live query ever joins org tables to
   `reflections` on behalf of an admin-facing endpoint. `organization_engagement_daily` is
   the only thing an admin dashboard reads from, and it only ever contains counts and
   averages.
2. **k-anonymity floor of 5.** If fewer than 5 members were active on a given day, the
   dashboard shows "Not enough data yet" instead of a real number. This is a hard rule in
   the aggregation job itself, not a UI-layer suggestion -- the row shouldn't even be
   queryable below the threshold.
3. **Explicit separate consent**, distinct from account-level ToS, required before a user's
   activity is counted in any aggregate at all (`organization_consent`). Buried-in-ToS
   consent is weaker than a real, separate screen -- doubly so given workplace power
   dynamics.
4. **Leaving an org never touches personal data.** Removing a member from
   `organization_members` has zero effect on their `reflections` or `profiles` rows, because
   the org schema never references them directly -- only through the aggregate layer.

## RLS Strategy

- `organizations`: SELECT/UPDATE restricted to `owner_id = auth.uid()` or membership with
  role `admin`/`owner` via `organization_members`. INSERT happens server-side via API route
  (post-Stripe-checkout), not directly from the client.
- `organization_members`: members can SELECT rows in orgs they belong to (roster visibility:
  name/role, not reflections). Row creation only via the invite-acceptance flow or an
  admin-triggered invite, both server-side.
- `organization_engagement_daily`: SELECT restricted to `admin`/`owner` members of that org.
  INSERT is service-role only (the aggregation job).

## Billing

Org checkout sets `metadata: { type: 'organization', organization_id }` on the Stripe
session. The existing webhook handler (`app/api/webhooks/stripe/route.ts`) gets exactly one
new branch at the top of the handler:

```ts
if (session.metadata?.type === 'organization') {
  return handleOrgCheckout(session) // new, isolated function
}
// everything below is the existing, untouched individual-user logic
```

## UI

New route group: `/workspace/[orgId]/...`, not nested under `/dashboard`. A user who is both
an individual and an org member gets a workspace switcher, but the personal dashboard code
path never executes org-aware logic.

Screens: Members (roster/invite/roles), Billing (seats, Stripe customer portal), Analytics
(aggregate, phase 2), Settings.

## Rollout Order

1. **MVP** -- org creation, seat billing, invite/join flow, roster management. Ship the
   paying container before analytics.
2. **Analytics dashboard**, k-anonymity guardrail built in from day one.
3. **Org-level Slack app install**, replacing the current per-user webhook URL in
   `user_preferences` with one org-wide integration.
4. **SSO/SAML** -- only if real enterprise demand appears. Not built speculatively.

## Open Decisions (blocking implementation start)

Resolved -- see "Finalized Decisions" at the top of this document.
