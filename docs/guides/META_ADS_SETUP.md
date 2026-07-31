# Meta (Facebook) Ads Setup Guide

**Last Updated:** 2026-07-31  
**Status:** ⚠️ Configuration required (code is consent-gated)

---

## Overview

Prompt & Pause tracks conversions for Meta/Facebook ads using two complementary mechanisms:

1. **Meta Pixel (browser)** — loads only after the visitor accepts the cookie banner. Fires `PageView` and `InitiateCheckout` from the browser.
2. **Conversions API (server)** — fires consent-gated `InitiateCheckout` (at checkout start) and `Purchase` (from the Stripe webhook) so conversions survive ad blockers, cookie restrictions, and cross-device journeys.

Events use **shared `event_id`s** (Meta deduplicates the browser + server copies), and PII is minimised: only a **SHA-256-hashed email** (`em` field) and Meta's own `_fbp`/`_fbc` cookies are ever sent.

### Product positioning (important)

Meta restricts ad accounts that promote health conditions. The product is positioned as **daily reflection/journaling** — ad creative must **never** claim to treat or diagnose anxiety, depression, or any condition. The pixel fires generic commerce events (`PageView`, `InitiateCheckout`, `Purchase`) with no wellness/mood content attached.

---

## 1. Create the Pixel

1. Go to [Meta Events Manager](https://www.facebook.com/events_manager2/) → **Connect data sources** → **Web** → **Meta Pixel**.
2. Name it (e.g. `Prompt & Pause – Web`).
3. Copy the **Pixel ID** (a ~15-digit number).

## 2. Create a Conversions API access token

1. In the same Events Manager data source, open **Settings** → **Conversions API** → **Add a new access token**.
2. Copy the token (server-side only — never expose it to the browser).

> The app calls `POST https://graph.facebook.com/v23.0/{pixel_id}/events` (version pinned in `lib/meta/metaEventService.ts`).

## 3. Environment variables

Add to `.env.local` and your Vercel project:

```
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_CAPI_TOKEN=EAAxxx
```

| Variable | Required | Scope | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | no (pixel stays inert) | browser | Pixel loading + browser `InitiateCheckout` |
| `META_CAPI_TOKEN` | no (no server events) | server | Conversions API `InitiateCheckout`/`Purchase` |

If either variable is missing, the related code path **no-ops** — the app is unaffected.

## 4. What gets tracked

| Event | Trigger | Where |
|---|---|---|
| `PageView` | Consent accepted (or already present on load) | `components/MetaPixel.tsx` |
| `InitiateCheckout` | Checkout session created (consumer, org, or gift) | `app/api/stripe/create-checkout/route.ts`, `app/api/org/create/route.ts`, `app/api/gifts/create-checkout/route.ts` |
| `Purchase` | Stripe webhook `checkout.session.completed` | `app/api/webhooks/stripe/route.ts` (`sendMetaPurchase`) |

Attribution is threaded into the Stripe session metadata (`meta_consent`, `meta_fbp`, `meta_fbc`) at checkout time; the webhook replays it — it never reads browser cookies.

## 5. Consent (GDPR)

- The banner (`app/(homepage)/CookieConsent.tsx`) sets `cookieConsent=accepted` (1 year, SameSite=Lax) and dispatches `analytics-consent-granted`.
- `components/MetaPixel.tsx` only loads the pixel script after that cookie/event exists.
- `lib/meta/metaEventService.ts` refuses to send any CAPI event unless the request carries `cookieConsent=accepted`.
- Declining = no pixel, no CAPI events, no `_fbp`/`_fbc` in checkout metadata.

## 6. Verify

1. **Browser:** open DevTools → Network → filter `fbevents.js`. After accepting cookies, `PageView` should appear and a `fbq('track', ...)` call fires with `em` absent (browser pixel doesn't send email).
2. **Server:** run a test checkout. In Meta Events Manager → **Test Events**, confirm `InitiateCheckout` (deduped with the browser event via matching `event_id`) and, after completing payment, `Purchase`.
3. Check Vercel function logs for `meta_capi_send_error` / `meta_capi_response_error` warnings (logged via `logger.warn`, non-fatal).

## 8. Running your first ad via the Marketing API

Prerequisites (outside the repo):

1. **Ad account** — Business Settings → **Ad accounts → Add**. Needs a **payment method** (Billing & payments). Brand-new businesses usually must complete **business verification** before Meta will open an ad account; expect a starting daily spend limit.
2. **Developer app** — developers.facebook.com → **Create app → Business** → add the **Marketing API** product.
3. **System-user token** — Business Settings → **Users → System users → Add** (Admin). Assign it the **ad account** and the **page** (full access), then **Generate token** with scopes `ads_management`, `ads_read`, `pages_read_engagement`. Set it as `META_ADS_TOKEN`.

Then:

```bash
# 1. Put a 1080x1080 (or 1080x1350) creative at scripts/assets/meta-launch-creative.jpg
# 2. Set your real ad account ID in scripts/meta-ad-config.json
$env:META_ADS_TOKEN="EAA..."   # or export META_ADS_TOKEN=...
node scripts/create-meta-ad.js            # creates campaign + ad set + creative + ad, all PAUSED
node scripts/create-meta-ad.js --activate # after reviewing in Ads Manager
```

**Marketing API access tier:** Meta requires **500 API calls with <15% error rate** before the `ads_management` tier unlocks. Every failed call counts against the 15% budget, so avoid junk/exploratory calls. Pull live performance and accumulate legitimate calls with:

```bash
node scripts/meta-stats.js                            # one snapshot
node scripts/meta-stats.js --count 20 --interval 60   # poll 20x, 60s apart (monitoring)
```

The script prints a running call/error tally and whether the tier requirement is met.

Notes:

- Defaults: `OUTCOME_TRAFFIC` (falls back to `TRAFFIC`), `LANDING_PAGE_VIEWS` optimization (falls back to `LINK_CLICKS`), GBP 7.00/day (`dailyBudgetMinor: 700`), GB broad 18–65, Facebook + Instagram placements, CTA `LEARN_MORE`.
- Purchase-optimized (`OUTCOME_SALES`) ads are unavailable on brand-new ad accounts until they accumulate conversion history — run traffic first to gather data, then move to sales.
- Everything is created **PAUSED**; the `--activate` flag (or Ads Manager) turns it on.
- Creative copy must stay in the reflection/journaling positioning — no health claims (see section 1).

## 9. Notes

- Email is always **SHA-256 hashed** (`em: [hash]`) — raw emails never leave the server.
- If conversion accuracy is a concern, Meta recommends a dedicated domain or first-party cookie setup; out of scope here.
- The CSP in `proxy.ts` already allowlists `connect.facebook.net`, `*.facebook.com`, and `graph.facebook.com` for the pixel.
