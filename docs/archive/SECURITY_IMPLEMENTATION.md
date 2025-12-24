# Prompt & Pause - Security Implementation Guide

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** ✅ All Core Security Features Implemented

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Implemented Security Features](#implemented-security-features)
3. [Environment Variables](#environment-variables)
4. [Security Testing](#security-testing)
5. [Deployment Checklist](#deployment-checklist)
6. [Incident Response](#incident-response)
7. [Compliance & Regulations](#compliance--regulations)

---

## 🎯 Executive Summary

This document provides a comprehensive overview of all security measures implemented in Prompt & Pause. The application processes sensitive mental health data (GDPR Special Category Data) and requires robust security controls.

### Current Security Posture
- ✅ **Admin authentication** - Enforced on all privileged operations
- ✅ **Rate limiting** - Upstash Redis-backed with in-memory fallback
- ✅ **Webhook verification** - Stripe & Slack signature validation
- ✅ **Security headers** - CSP, HSTS, X-Frame-Options, etc.
- ✅ **Cron job security** - HMAC-signed requests
- ✅ **Input validation** - Zod schemas on critical endpoints
- ✅ **PII redaction** - Structured logging with automatic redaction
- ✅ **OAuth security** - CSRF state protection for Slack
- ✅ **RLS policies** - Supabase Row Level Security enforced

### Risk Level
**Current:** Low-Medium (with all mitigations implemented)  
**Target:** Low (with additional app-layer encryption)

---

## 🔒 Implemented Security Features

### 1. Authentication & Authorization

#### Admin Route Protection
**Location:** `app/api/admin/update-subscription/route.ts`

```typescript
// Requires Supabase session + ADMIN_EMAIL verification
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()
const adminAuth = await checkAdminAuth(user.email || '')
if (!adminAuth.isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Features:**
- Session-based authentication via Supabase
- Email-based admin verification (`ADMIN_EMAIL` env var)
- Service role usage only after admin verification
- Input validation with Zod schemas

#### Supabase Row Level Security (RLS)
All user data tables have RLS policies enforcing per-user access:
- `profiles` - Users can only read/update their own profile
- `reflections` - Users can only access their own reflections
- `moods` - Users can only manage their own mood data
- `prompts_history` - Users can only view their own prompts

---

### 2. Rate Limiting

**Location:** `lib/utils/rateLimit.ts`

**Backend:** Upstash Redis (production) with in-memory fallback (development)

**Protected Endpoints:**
| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| `/api/prompts/generate` | 5 requests | 1 minute | User ID or IP |
| `/api/emails/send-prompt` | 3 requests | 10 minutes | User ID |
| `/api/emails/send-digest` | 1 request | 10 minutes | User ID |
| `/api/integrations/slack/interactive` | 30 requests | 1 minute | IP address |

**Response Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1705845600000
```

**429 Response Example:**
```json
{
  "error": "Too many requests",
  "retryAfter": 45000
}
```

---

### 3. Webhook Security

#### Stripe Webhook Verification
**Location:** `app/api/webhooks/stripe/route.ts`

```typescript
const signature = headers().get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  body,
  signature!,
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

**Features:**
- HMAC-SHA256 signature verification
- Automatic timestamp validation
- Prevents replay attacks

#### Slack Interactive Endpoint
**Location:** `app/api/integrations/slack/interactive/route.ts`

```typescript
function verifySlackSignature(signingSecret, timestamp, body, signature) {
  // 5-minute timestamp window
  const fiveMinutes = 60 * 5
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > fiveMinutes) {
    return false
  }
  
  const computed = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(`v0:${timestamp}:${body}`)
    .digest('hex')
    
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  )
}
```

**Features:**
- Request signature verification
- 5-minute timestamp window (replay protection)
- Timing-safe comparison
- Rate limiting per IP

---

### 4. Cron Job Security

**Location:** `app/api/cron/send-daily-prompts/route.ts`

**Two Authorization Methods:**

#### Method 1: POST with Bearer Token
```bash
curl -X POST https://promptandpause.com/api/cron/send-daily-prompts \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Method 2: GET with HMAC Signature
```bash
# Generate signature
ts=$(date +%s)
sig=$(echo -n "$ts" | openssl dgst -sha256 -hmac "$CRON_SECRET" -hex | cut -d' ' -f2)

# Make request
curl "https://promptandpause.com/api/cron/send-daily-prompts?ts=$ts&sig=$sig"
```

**Features:**
- HMAC-SHA256 signed requests
- 5-minute timestamp window
- Forwards to POST handler after verification
- Supports manual admin trigger (for testing)

---

### 5. Security Headers

**Location:** `next.config.mjs`

```javascript
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': '...'
}
```

**Content Security Policy (CSP):**
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://m.stripe.network https://va.vercel-scripts.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.groq.com https://api.stripe.com https://api.resend.com https://hooks.slack.com https://*.upstash.io https://vitals.vercel-insights.com;
img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

**What This Prevents:**
- Clickjacking (X-Frame-Options, frame-ancestors)
- MIME-type sniffing (X-Content-Type-Options)
- XSS attacks (CSP script-src restrictions)
- Mixed content (upgrade-insecure-requests)
- Insecure connections (Strict-Transport-Security)

---

### 6. Structured Logging with PII Redaction

**Location:** `lib/utils/logger.ts`

**Auto-redacted Fields:**
- `email`
- `admin_email`
- `user_id`
- `stripe_customer_id`
- `subscription_id`
- `target_user_email`

**Usage Example:**
```typescript
import { logger } from '@/lib/utils/logger'

logger.info('user_subscribed', {
  email: 'user@example.com',        // Redacted: u***@example.com
  user_id: 'uuid-1234',             // Redacted: uv***
  tier: 'premium'                   // Not redacted
})
```

**Output:**
```json
{
  "level": "info",
  "event": "user_subscribed",
  "ts": "2025-01-10T12:00:00.000Z",
  "meta": {
    "email": "u***@example.com",
    "user_id": "uv***",
    "tier": "premium"
  }
}
```

---

### 7. OAuth Security (Slack)

#### State Parameter Protection
**Locations:**
- `app/api/integrations/slack/auth-url/route.ts` - Generate state
- `app/api/integrations/slack/oauth/callback/route.ts` - Verify state

**Flow:**
1. Generate random state token
2. Store in HTTP-only cookie
3. Include in OAuth authorization URL
4. Verify state matches on callback
5. Clear cookie after successful verification

**Prevents:** OAuth CSRF attacks

---

### 8. Input Validation

**Framework:** Zod schemas

**Example (Admin Update Subscription):**
```typescript
const BodySchema = z.object({
  userEmail: z.string().email(),
  tier: z.enum(['premium', 'freemium']),
  durationMonths: z.number().int().min(1).max(24).optional(),
})

const parsed = BodySchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
}
```

**Validated Endpoints:**
- Admin subscription updates
- User profile updates
- Reflection creation
- Prompt generation requests

---

## 🔑 Environment Variables

### Required for Production

Copy `.env.example` to `.env.local` and set all variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Services
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-proj-...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=prompts@promptandpause.com

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...

# Security
CRON_SECRET=<generate with: openssl rand -base64 32>
ADMIN_EMAIL=admin@promptandpause.com

# Application
NEXT_PUBLIC_APP_URL=https://promptandpause.com
NODE_ENV=production
```

### Optional (Recommended for Production)

```bash
# Upstash Redis (for distributed rate limiting)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxXXX...

# Slack Integration
SLACK_CLIENT_ID=1234567890.1234567890
SLACK_CLIENT_SECRET=xxxxxxxxxxxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxxx
```

### Validation Script

Run before deployment:
```bash
node scripts/check-env.js
```

This script validates:
- All required variables are set
- No placeholder values remain
- HTTPS is used for URLs
- Sensitive values are properly formatted

---

## 🧪 Security Testing

### 1. Rate Limit Testing

Test that endpoints are properly rate-limited:

```bash
# Test prompt generation (5/min limit)
for i in {1..10}; do
  curl -X POST https://promptandpause.com/api/prompts/generate \
    -H "Content-Type: application/json" \
    -H "Cookie: sb-access-token=..." \
    -d '{"focus_areas": ["mindfulness"]}'
  echo ""
done

# Expected: First 5 succeed, then 429 responses
```

**Check Rate Limit Backend:**
```bash
curl https://promptandpause.com/api/health/rate-limit \
  -H "Cookie: admin-session=..."

# Expected: { "backend": "upstash", "upstashConfigured": true }
```

---

### 2. Admin Authorization Testing

**Positive Test (as admin):**
```bash
curl -X POST https://promptandpause.com/api/admin/update-subscription \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<admin-token>" \
  -d '{
    "userEmail": "test@example.com",
    "tier": "premium",
    "durationMonths": 1
  }'

# Expected: 200 OK
```

**Negative Test (as non-admin):**
```bash
# Same request with non-admin token
# Expected: 403 Forbidden
```

---

### 3. Slack Signature Verification

**Invalid Signature Test:**
```bash
curl -X POST https://promptandpause.com/api/integrations/slack/interactive \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Slack-Signature: v0=invalid_signature" \
  -H "X-Slack-Request-Timestamp: $(date +%s)" \
  -d "payload={}"

# Expected: 401 Unauthorized
```

**Expired Timestamp Test:**
```bash
# Use timestamp > 5 minutes old
old_ts=$(($(date +%s) - 400))

curl -X POST https://promptandpause.com/api/integrations/slack/interactive \
  -H "X-Slack-Request-Timestamp: $old_ts" \
  ...

# Expected: 401 Unauthorized
```

---

### 4. Cron Job Security Testing

**Test Signed GET:**
```bash
# Generate valid signature
ts=$(date +%s)
sig=$(echo -n "$ts" | openssl dgst -sha256 -hmac "$CRON_SECRET" -hex | cut -d' ' -f2)

# Make request
curl "https://promptandpause.com/api/cron/send-daily-prompts?ts=$ts&sig=$sig"

# Expected: 200 OK with job execution details
```

**Test Invalid Signature:**
```bash
curl "https://promptandpause.com/api/cron/send-daily-prompts?ts=$(date +%s)&sig=invalid"

# Expected: Returns info payload (non-breaking)
```

---

### 5. Security Headers Verification

```bash
curl -I https://promptandpause.com

# Verify presence of:
# - Strict-Transport-Security
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Content-Security-Policy: ...
# - Referrer-Policy: no-referrer
```

---

### 6. XSS Protection Testing

Test that user input is properly sanitized:

```bash
# Attempt XSS in reflection
curl -X POST https://promptandpause.com/api/reflections \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "reflection_text": "<script>alert(\"XSS\")</script>",
    "mood": "happy"
  }'

# Expected: Saved as plain text, not executed
# Verify in dashboard that script tags are displayed as text
```

---

### 7. Automated Security Scanning

**NPM Audit:**
```bash
npm audit
npm audit fix
```

**OWASP ZAP Baseline Scan:**
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.promptandpause.com
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Run `node scripts/check-env.js` to validate environment variables
- [ ] Verify all secrets are production values (not test/dev)
- [ ] Confirm `NODE_ENV=production`
- [ ] Confirm `NEXT_PUBLIC_APP_URL=https://promptandpause.com`
- [ ] Generate new `CRON_SECRET` for production
- [ ] Set up Upstash Redis account and configure environment variables
- [ ] Verify `ADMIN_EMAIL` matches Supabase admin user
- [ ] Run `npm audit` and fix any vulnerabilities
- [ ] Run full test suite: `npm test`
- [ ] Run build: `npm run build` (must succeed with 0 errors)

### Supabase Configuration

- [ ] Confirm project region is EU/UK
- [ ] Verify RLS policies are enabled on all tables
- [ ] Review and apply any pending migrations
- [ ] Set up database backups (daily recommended)
- [ ] Configure auth settings (password requirements, session duration)
- [ ] Test email templates (signup, password reset)

### Stripe Configuration

- [ ] Switch to live API keys
- [ ] Configure webhook endpoint: `https://promptandpause.com/api/webhooks/stripe`
- [ ] Verify webhook signing secret matches `STRIPE_WEBHOOK_SECRET`
- [ ] Test subscription creation flow
- [ ] Test webhook delivery and signature verification
- [ ] Set up Stripe Dashboard alerts

### Vercel Deployment

- [ ] Add all environment variables to Vercel project settings
- [ ] Configure custom domain: `promptandpause.com`
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Configure cron job:
  ```json
  {
    "crons": [{
      "path": "/api/cron/send-daily-prompts",
      "schedule": "0 * * * *"
    }]
  }
  ```
- [ ] Set up preview deployments for staging
- [ ] Configure deployment protection (optional)

### Post-Deployment Verification

- [ ] Test admin login and panel access
- [ ] Test subscription upgrade/downgrade flows
- [ ] Verify cron job executes hourly (check logs)
- [ ] Test rate limiting on key endpoints
- [ ] Verify security headers are present
- [ ] Test Slack integration (if enabled)
- [ ] Verify email delivery (daily prompts, transactional)
- [ ] Run smoke tests on all critical user flows
- [ ] Check error tracking (Sentry if configured)

### Monitoring Setup

- [ ] Set up Vercel Analytics
- [ ] Configure uptime monitoring (e.g., UptimeRobot, Pingdom)
- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure alert thresholds:
  - API error rate > 5%
  - Cron job failures
  - Rate limit exceeded events
  - Database connection errors
- [ ] Set up Slack/email notifications for critical alerts

---

## 🚨 Incident Response

### Severity Levels

**Critical (P0):**
- Data breach or unauthorized access to user data
- Service completely down
- Payment processing failure

**High (P1):**
- Admin panel compromised
- Webhook verification bypassed
- Multiple user reports of data issues

**Medium (P2):**
- Rate limiting not working
- Email delivery failures
- Non-critical API endpoints down

**Low (P3):**
- UI bugs
- Performance degradation
- Non-urgent security improvements

### Response Procedures

#### Suspected Security Breach

1. **Immediate Actions (< 1 hour)**
   - Rotate all API keys and secrets
   - Review access logs in Supabase
   - Disable affected API endpoints if necessary
   - Document timeline and scope

2. **Investigation (< 4 hours)**
   - Identify attack vector
   - Assess data exposure
   - Review recent deployments and code changes
   - Check for unusual database queries

3. **Remediation (< 24 hours)**
   - Apply security patches
   - Reset affected user passwords
   - Deploy fixes to production
   - Update security documentation

4. **Communication (< 72 hours)**
   - Notify affected users (if personal data compromised)
   - Submit GDPR breach notification if required
   - Post-mortem and lessons learned

#### API Key Compromise

```bash
# Emergency key rotation script
# 1. Generate new secrets
NEW_CRON_SECRET=$(openssl rand -base64 32)
NEW_STRIPE_SECRET=<from Stripe dashboard>
NEW_SUPABASE_KEY=<from Supabase dashboard>

# 2. Update Vercel environment variables
vercel env add CRON_SECRET production <<< "$NEW_CRON_SECRET"
vercel env add STRIPE_SECRET_KEY production <<< "$NEW_STRIPE_SECRET"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$NEW_SUPABASE_KEY"

# 3. Redeploy
vercel --prod

# 4. Revoke old keys at provider dashboards
```

#### Rate Limit Bypass

1. Enable IP blocking at Vercel/Cloudflare level
2. Review and tighten rate limit thresholds
3. Switch to Upstash Redis if using in-memory fallback
4. Add additional rate limit keys (e.g., per user + per IP)

---

## 📜 Compliance & Regulations

### GDPR Compliance

**Legal Basis:**
- Contractual necessity (account services)
- Explicit consent (email notifications)
- Legitimate interest (security, fraud prevention)

**Special Category Data:**
Mental health reflections require heightened protection.

**User Rights Implementation:**
- **Access:** `/api/user/export-data` (PDF export)
- **Rectification:** User settings page
- **Erasure:** `/api/user/delete` (self-serve deletion)
- **Portability:** Data export includes all user data
- **Objection:** Support channel for analytics opt-out

**Data Retention:**
- Active users: Indefinite (until account deletion)
- Deleted accounts: 30-day soft delete, then hard delete
- Logs: 90 days maximum
- Backups: 30 days

### DPIA (Data Protection Impact Assessment)

**Status:** Completed  
**Location:** `Security Audit/DPIA_Checklist.md`

**Key Findings:**
- Residual risk: Medium (acceptable with current controls)
- Recommended: App-layer encryption for reflections
- Review cadence: Semi-annual or upon material changes

### PCI-DSS

**Scope:** Minimal - Stripe handles all card data

**Our Responsibilities:**
- ✅ Verify webhook signatures
- ✅ Use HTTPS only
- ✅ No storage of card data
- ✅ Regular security updates

### Data Processing Agreements (DPAs)

Required from all third-party processors:
- [x] Supabase (EU/UK region confirmed)
- [x] Vercel (hosting)
- [x] Stripe (payments)
- [x] Resend (email)
- [ ] Upstash (Redis) - *Obtain before production*
- [ ] Slack - *Review terms*

---

## 📞 Security Contacts

**Security Lead:** [Your Name]  
**Email:** security@promptandpause.com  
**Emergency:** [On-call phone]

**Responsible Disclosure:**
If you discover a security vulnerability, please email security@promptandpause.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your contact information (optional)

We commit to:
- Acknowledge within 24 hours
- Provide status updates every 48 hours
- Credit researchers (with permission) in our security changelog

---

## 🔄 Maintenance & Updates

### Quarterly Security Review

- [ ] Rotate all API keys and secrets
- [ ] Review and update CSP if new services added
- [ ] Run comprehensive security scan (OWASP ZAP)
- [ ] Update dependencies: `npm audit fix`
- [ ] Review access logs for anomalies
- [ ] Test incident response procedures
- [ ] Update security documentation

### Continuous Monitoring

**Daily:**
- Cron job execution logs
- Error rates (> 5% threshold)
- Failed authentication attempts

**Weekly:**
- Rate limit hit rates
- Webhook delivery status
- Database query performance

**Monthly:**
- NPM audit results
- Dependency updates
- Security patch releases
- User-reported security issues

---

## 📚 Additional Resources

- [Security Audit Report](Security%20Audit/PromptAndPause_Security_Audit.md)
- [DPIA Checklist](Security%20Audit/DPIA_Checklist.md)
- [Actionable Fixes Playbook](Actionable%20Fixes%20for%20Production/README.md)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Guidelines](https://gdpr-info.eu/)

---

**Document Version:** 1.0  
**Last Review:** January 2025  
**Next Review:** April 2025
