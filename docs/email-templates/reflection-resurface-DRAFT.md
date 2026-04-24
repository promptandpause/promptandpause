# Reflection Resurface — Design Draft (NOT IMPLEMENTED)

Status: **design only, do not ship without explicit approval**.

This document describes the one retention email the brand can ethically send.
Every element is deliberate — if you shortcut any of them, the result lands
in the anti-pattern category (see
`.windsurf/memories` → *Email anti-patterns (never build)*).

## Purpose

Gently re-engage a user who has drifted without scolding, bribing, or
quantifying. The email's entire surface is **the user's own writing**.
Nothing external is added beyond a single calm CTA.

This is the Headspace / Calm pattern: surface something you already said to
yourself, and let that do the work.

## Trigger rules

A user is eligible for a resurface email when **all** of the following hold:

1. `subscription_status IN ('premium','active','trialing','free')` — all tiers
2. `user_preferences.weekly_digest = true` — opted in to summary emails
3. Last reflection's `created_at` is between **7 and 21 days ago**
4. The user has at least **3 historical reflections** (no point resurfacing
   the single first entry — the selection logic below won't work)
5. No `email_logs` row with `template_name = 'reflection_resurface'` in the
   last **60 days** — hard rate-limit; this email fires at most ~6×/year
6. No dashboard session in the last 48h (proxy: last `ip_logs` row or a
   bespoke `last_active_at` column if we add one)

## Selection algorithm

From the user's reflections older than 30 days but newer than 180 days:

1. Filter to entries with `word_count >= 40` (longer-than-throwaway)
2. Prefer entries whose `tags` overlap with the user's active focus areas
3. Among those, pick the one with the highest `word_count` × `age_weight`
   where `age_weight = 1 / sqrt(days_since)` — biases toward both substance
   and temporal relevance
4. Ties broken by `created_at DESC`

The selected reflection's `prompt_text` becomes the email subject line, and
a ~120-char snippet of `reflection_text` appears in the body. **Never send
the full reflection** — the value is the remembering, not the re-reading.

## Copy skeleton

```
Subject: "{prompt_text truncated to 60 chars}"

Hi {name},

Something you wrote {relative_date, e.g. "last month"}:

  "{120-char snippet}…"

No reply needed. Just thought you might want to sit with it again.

[ Revisit this entry ]   ← links to /dashboard/archive/{id}

If this feels like an interruption, you can turn these off in Settings.
```

Every phrase here is load-bearing:

- No "we miss you" framing
- No counts, streaks, or averages
- Single CTA, optional to follow
- Opt-out mentioned inline, once, at the bottom — Apple HIG / Stripe standard

## Why this is still a draft

Three things must be decided before implementation:

1. **Who owns the "last_active_at" signal?** Without it, we'd fire this at
   users who are active on the mobile app but haven't returned to the web
   dashboard — they'd rightly find it tone-deaf.
2. **Opt-in granularity.** Riding on `weekly_digest` is convenient but
   conflates two different things. If a user disables weekly digests they
   likely *still* want the monthly + resurface. A new
   `user_preferences.summary_emails` column would resolve it.
3. **Copy review.** Every phrase above should be reviewed by the founder /
   someone with brand authority before it goes into any generator. Tone here
   is more fragile than in any other lifecycle email.

## When ready to ship

The implementation is straightforward: add
`sendReflectionResurfaceEmail` to `lib/services/emailService.ts` following
the same sender pattern as `sendMonthlyReflectionEmail`; create
`/api/cron/send-reflection-resurface/route.ts` running **weekly** (not
daily — hitting 7-day-silent users more than once a week is itself a nag);
enforce the trigger rules and selection algorithm above exactly as written.

Don't build it until the three open questions are answered.
