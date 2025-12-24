# Production Deployment Guide - Prompt & Pause

**Last Updated:** 2025-01-07  
**Goal:** Zero-downtime, secure production deployment

---

## 🎯 Overview

This guide covers deploying Prompt & Pause to production with:
- ✅ Zero-downtime deployment strategy
- 🔒 Security hardening
- 📊 Monitoring setup
- 🔄 Rollback procedures
- ⚡ Performance optimization

**Recommended Platform:** Vercel (optimal for Next.js 15)

---

## ⚠️ CRITICAL: Pre-Deployment Requirements

### Before You Deploy - Fix These Issues First!

❌ **BUILD CURRENTLY FAILS** - Must fix before deployment:

1. **Client/Server Component Boundary Issues**
   - See `TASK_12_TESTING_ISSUES.md` for details
   - Replace `userService` imports with API calls in:
     - `app/dashboard/page.tsx`
     - `app/dashboard/settings/page.tsx`
   - Run `npm run build` - must pass ✅

2. **Environment Variables**
   - Clean `.env.example` (remove actual keys)
   - Prepare production environment variables

3. **Testing**
   - Complete at least critical flows from `TEST_FLOWS.md`
   - Verify Stripe test mode works
   - Test email delivery

**DO NOT PROCEED** until build passes and critical flows work locally!

---

## 📋 Pre-Deployment Checklist

### Phase 1: Code Preparation

- [ ] **Fix build errors** (see TASK_12_TESTING_ISSUES.md)
- [ ] **Run `npm run build`** - passes successfully
- [ ] **Run `npm run lint`** - no critical errors
- [ ] **Test locally** - all critical flows work
- [ ] **Git branch** - create `production` or `main` branch
- [ ] **Version tag** - tag release (e.g., `v1.0.0`)
- [ ] **Commit all changes** with descriptive message

### Phase 2: Database Preparation

- [ ] **Supabase project** - create production project (separate from dev)
- [ ] **Run all migrations** in production database
- [ ] **Enable RLS policies** on all tables
- [ ] **Test RLS** - ensure users can only access own data
- [ ] **Create database backup** before deployment
- [ ] **Set up automated backups** (daily recommended)

### Phase 3: External Services

- [ ] **Stripe** - switch to live mode, get live keys
- [ ] **Resend** - verify production domain, get live API key
- [ ] **AI Services** - upgrade Groq/OpenAI if needed
- [ ] **Domain** - DNS configured and propagated
- [ ] **SSL Certificate** - HTTPS enabled (automatic with Vercel)

### Phase 4: Environment Variables

- [ ] **Prepare production `.env`** with all variables
- [ ] **No test/development keys** in production
- [ ] **Verify all secrets** are secure and not exposed
- [ ] **Document all environment variables** needed

---

## 🔐 Security Hardening

### Environment Variables Security

**Critical Rules:**
1. ❌ **NEVER** commit `.env.local` or `.env.production` to Git
2. ❌ **NEVER** use test keys in production
3. ✅ **ALWAYS** use separate production keys
4. ✅ **ROTATE** keys regularly (every 90 days)

**Production Environment Variables:**

```env
# ============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# ============================================================================
# Copy these to Vercel/deployment platform environment variables

# DATABASE - Supabase (PRODUCTION PROJECT)
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... # Production anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Production service role key

# AI SERVICES
GROQ_API_KEY=gsk_... # Production key
OPENAI_API_KEY=sk-proj-... # Production key (backup)

# EMAIL - Resend (PRODUCTION)
RESEND_API_KEY=re_live_... # LIVE key, not test
RESEND_FROM_EMAIL=prompts@promptandpause.com # Verified domain

# PAYMENTS - Stripe (LIVE MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # LIVE, not test
STRIPE_SECRET_KEY=sk_live_... # LIVE, not test
STRIPE_PRICE_MONTHLY=price_... # LIVE price ID
STRIPE_PRICE_ANNUAL=price_... # LIVE price ID
STRIPE_WEBHOOK_SECRET=whsec_... # Production webhook secret

# APPLICATION
NEXT_PUBLIC_APP_URL=https://promptandpause.com # Your domain
NODE_ENV=production

# OPTIONAL - Cron security
CRON_SECRET=<generate_random_32_char_string> # For scheduled tasks
```

### Supabase Security

**1. Row Level Security (RLS) Policies:**

```sql
-- Verify these policies are enabled in production:

-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can only read own reflections
CREATE POLICY "Users can view own reflections"
ON reflections FOR SELECT
USING (auth.uid() = user_id);

-- Users can only create own reflections
CREATE POLICY "Users can create own reflections"
ON reflections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Check all tables have RLS enabled:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- Should return 0 rows
```

**2. API Key Security:**
- ✅ Service role key only in server-side code
- ✅ Never expose in client bundles
- ✅ Rotate keys if compromised

**3. Authentication:**
- ✅ Email verification required
- ✅ Password minimum 8 characters
- ✅ Rate limiting on auth endpoints
- ✅ Session expiry configured (default 24h)

### Stripe Security

**1. Switch to Live Mode:**
```bash
# Verify you're using LIVE keys:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... ✅
STRIPE_SECRET_KEY=sk_live_... ✅

# NOT test keys:
pk_test_... ❌
sk_test_... ❌
```

**2. Configure Webhooks:**
- Webhook URL: `https://promptandpause.com/api/stripe/webhook`
- Events to listen to:
  - ✅ `checkout.session.completed`
  - ✅ `customer.subscription.updated`
  - ✅ `customer.subscription.deleted`
  - ✅ `invoice.payment_failed`
  - ✅ `invoice.payment_succeeded`
- Copy webhook signing secret to environment variables

**3. Security Settings:**
- Enable Radar (fraud detection)
- Set up email receipts
- Configure failed payment notifications
- Enable 3D Secure for cards

### Email Security (Resend)

**1. Domain Verification:**
```
1. Add domain in Resend dashboard
2. Add DNS records:
   - SPF record
   - DKIM record
   - DMARC record
3. Wait for verification (5-15 minutes)
4. Test email delivery
```

**2. Rate Limiting:**
- Monitor sending limits
- Implement application-level rate limiting
- Set up alerts for unusual activity

---

## 🚀 Deployment Process (Vercel)

### Step 1: Create Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (run from project root)
vercel link
```

### Step 2: Configure Environment Variables

**Option A: Via Vercel Dashboard**
1. Go to project → Settings → Environment Variables
2. Add all production variables
3. Select "Production" environment
4. ❌ Do NOT expose sensitive keys

**Option B: Via CLI**
```bash
# Add each environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... repeat for all variables
```

### Step 3: Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploys if connected)
git push origin main
```

**Expected Output:**
```
✅ Production: https://promptandpause.com [1m 23s]
📝 Deployed to production
🔍 Inspect: https://vercel.com/your-project/deployments/abc123
```

### Step 4: Verify Deployment

**Immediate Checks:**
```bash
# 1. Check site loads
curl -I https://promptandpause.com
# Should return: HTTP/2 200

# 2. Check API health
curl https://promptandpause.com/api/user/profile
# Should return: 401 (expected, not authenticated)

# 3. Check Stripe webhook
# Go to Stripe Dashboard → Webhooks
# Test webhook endpoint
```

**Manual Verification:**
1. ✅ Visit site - loads correctly
2. ✅ Sign up new user - works
3. ✅ Complete onboarding - saves
4. ✅ Create reflection - saves to DB
5. ✅ Check email - welcome email received
6. ✅ Test Stripe - can upgrade to premium
7. ✅ Test settings - updates save

---

## ⚡ Zero-Downtime Deployment Strategy

### Using Vercel Deployment Slots

**Vercel provides automatic zero-downtime:**
1. New deployment built in parallel
2. Health checks run on new deployment
3. Traffic switches only if healthy
4. Old deployment kept for instant rollback

**Custom Health Check (Optional):**

Create `app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check database connection
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    
    if (error) throw error

    // Check environment variables
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'RESEND_API_KEY',
    ]
    
    const missing = requiredVars.filter(v => !process.env[v])
    if (missing.length > 0) {
      return NextResponse.json(
        { status: 'unhealthy', error: `Missing: ${missing.join(', ')}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    )
  }
}
```

**Monitor Health:**
```bash
# Check before deployment
curl https://promptandpause.com/api/health

# Should return:
{"status":"healthy","timestamp":"2025-01-07T...","version":"1.0.0"}
```

### Deployment Workflow

```
1. Developer pushes to main branch
   ↓
2. Vercel detects push, starts build
   ↓
3. Build runs (npm run build)
   ↓
4. New deployment created in parallel (users still on old version)
   ↓
5. Health checks run on new deployment
   ↓
6. If healthy: Traffic switches to new deployment
   If unhealthy: Deployment fails, users stay on old version
   ↓
7. Old deployment kept for 24 hours (instant rollback available)
```

---

## 🔄 Rollback Procedures

### Instant Rollback (Vercel)

**Option 1: Via Dashboard**
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Confirm - traffic switches in <10 seconds

**Option 2: Via CLI**
```bash
# List recent deployments
vercel list

# Rollback to specific deployment
vercel rollback <deployment-url>

# Or rollback to previous deployment
vercel rollback
```

**Expected Downtime:** < 10 seconds

### Database Rollback

**If database migration breaks production:**

```bash
# Connect to production database
psql "postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres"

# Check migration status
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 5;

# Rollback last migration (if safe)
# Create down migration or manually revert changes
```

**⚠️ Important:**
- Always test migrations on staging first
- Take database backup before migrations
- Have rollback SQL scripts ready

---

## 📊 Post-Deployment Monitoring

### Set Up Monitoring

**1. Vercel Analytics (Built-in)**
- Automatic tracking of:
  - Page views
  - API requests
  - Performance metrics
  - Error rates

**2. Supabase Dashboard**
Monitor:
- Database connections
- API requests
- Auth events
- Storage usage

**3. Stripe Dashboard**
Monitor:
- Payment success rate
- Failed payments
- Subscription churn
- MRR (Monthly Recurring Revenue)

**4. Resend Dashboard**
Monitor:
- Email delivery rate
- Bounce rate
- Open rates
- Failed deliveries

### Set Up Alerts

**Vercel Alerts:**
```
1. Go to Project → Settings → Notifications
2. Enable alerts for:
   - ✅ Deployment failures
   - ✅ Build errors
   - ✅ Runtime errors (>5% error rate)
   - ✅ Performance degradation
```

**Custom Alerts (Optional):**

Use services like:
- **Better Stack** (formerly LogDNA) - Log aggregation
- **Sentry** - Error tracking
- **UptimeRobot** - Uptime monitoring

Example Sentry setup:
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') return null
    return event
  },
})
```

### Health Check Monitoring

**Set up external monitoring:**

```bash
# UptimeRobot - Check every 5 minutes
URL: https://promptandpause.com/api/health
Method: GET
Expected: 200 OK
Alert if: Down for 5 minutes
```

---

## 🐛 Common Deployment Issues

### Issue 1: Build Fails on Vercel

**Error:** `Build failed - client/server component boundary`

**Solution:**
```bash
# Fix locally first
npm run build

# If passes locally but fails on Vercel:
1. Clear Vercel build cache
2. Redeploy
3. Check environment variables set correctly
```

### Issue 2: Environment Variables Not Working

**Error:** `NEXT_PUBLIC_SUPABASE_URL is undefined`

**Solution:**
```bash
# Check variable name exactly matches
# Check it's set for correct environment (production)
# Redeploy after adding variables

vercel env ls production
```

### Issue 3: Database Connection Fails

**Error:** `Connection timeout to Supabase`

**Solution:**
```
1. Check Supabase project is not paused
2. Verify connection string correct
3. Check IP allowlist (if enabled)
4. Test connection from Vercel region
```

### Issue 4: Stripe Webhooks Not Firing

**Error:** No subscription updates after payment

**Solution:**
```
1. Check webhook endpoint URL is correct
2. Verify webhook secret matches
3. Test webhook in Stripe dashboard
4. Check Vercel function logs for errors
5. Ensure endpoint is not blocked by middleware
```

### Issue 5: Email Delivery Fails

**Error:** `Resend API key invalid`

**Solution:**
```
1. Verify using LIVE API key (re_live_...)
2. Check domain is verified in Resend
3. Check sender email matches verified domain
4. Test with Resend dashboard send test
```

---

## 🔒 Security Checklist (Post-Deployment)

### Immediate Security Review

- [ ] **SSL/HTTPS** - Site loads over HTTPS ✅
- [ ] **Environment variables** - No secrets in client bundle
- [ ] **API keys** - All using production keys
- [ ] **Database RLS** - All policies enabled and tested
- [ ] **Authentication** - Email verification required
- [ ] **Stripe** - Live mode only, webhooks configured
- [ ] **CORS** - Properly configured (if needed)
- [ ] **Rate limiting** - Enabled on sensitive endpoints
- [ ] **Error messages** - Don't leak sensitive info
- [ ] **Logging** - No sensitive data logged

### Security Headers

Verify these headers are set (automatic with Vercel):
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: (configured)
```

Check with:
```bash
curl -I https://promptandpause.com
```

---

## 📈 Performance Optimization

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Prompt & Pause"
  priority // For above-the-fold images
/>
```

### Code Splitting

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false // Client-only if needed
})
```

### Caching Strategy

```typescript
// API routes - set cache headers
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  })
}
```

### Database Queries

```typescript
// Use indexes on frequently queried columns
CREATE INDEX idx_reflections_user_date ON reflections(user_id, date DESC);
CREATE INDEX idx_reflections_tags ON reflections USING GIN(tags);

// Use select() to limit columns
const { data } = await supabase
  .from('reflections')
  .select('id, date, mood') // Only needed columns
  .limit(10)
```

---

## 📋 Post-Deployment Verification

### Final Checklist

After deployment completes:

**Functionality:**
- [ ] Home page loads
- [ ] Sign up works
- [ ] Email verification works
- [ ] Onboarding saves preferences
- [ ] Dashboard displays data
- [ ] Can create reflections
- [ ] Archive shows reflections
- [ ] Settings updates work
- [ ] Stripe checkout works
- [ ] Premium upgrade successful
- [ ] Email notifications received

**Performance:**
- [ ] Page load < 2 seconds
- [ ] API responses < 500ms
- [ ] Images optimized
- [ ] No console errors

**Security:**
- [ ] HTTPS enabled
- [ ] No exposed secrets
- [ ] RLS policies active
- [ ] Authentication required

**Monitoring:**
- [ ] Analytics tracking
- [ ] Error tracking configured
- [ ] Uptime monitoring active
- [ ] Alerts configured

---

## 🎉 Launch Day Checklist

### T-24 Hours

- [ ] Final code review
- [ ] All tests passing
- [ ] Staging environment tested
- [ ] Database backup taken
- [ ] Team briefed on deployment plan

### T-4 Hours

- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Verify all integrations
- [ ] Monitor for 30 minutes

### T-0 (Launch)

- [ ] Announce launch
- [ ] Monitor closely for first hour
- [ ] Be ready to rollback if needed
- [ ] Celebrate! 🎉

### T+24 Hours

- [ ] Review logs for errors
- [ ] Check user feedback
- [ ] Monitor performance metrics
- [ ] Plan first post-launch iteration

---

## 📞 Support & Troubleshooting

### Emergency Contacts

```
Production Issues:
- Vercel Status: https://vercel-status.com
- Supabase Status: https://status.supabase.com
- Stripe Status: https://status.stripe.com

Support:
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.io
- Stripe Support: https://support.stripe.com
```

### Rollback Decision Tree

```
Issue Severity → Action

🔴 Critical (Site Down, Data Loss):
→ IMMEDIATE ROLLBACK
→ Investigate offline

🟠 High (Feature Broken, Payment Fails):
→ Quick fix if possible (< 10 min)
→ Otherwise rollback
→ Fix and redeploy

🟡 Medium (UI Issue, Minor Bug):
→ Document
→ Fix in next release
→ No rollback needed

🟢 Low (Cosmetic, Enhancement):
→ Add to backlog
→ No immediate action
```

---

## ✅ Success Metrics

### Track These KPIs

**Technical:**
- ✅ Uptime > 99.9%
- ✅ API response time < 500ms
- ✅ Error rate < 0.1%
- ✅ Build success rate > 95%

**Business:**
- 📊 User signups
- 📊 Daily active users
- 📊 Retention rate
- 📊 Conversion to premium
- 📊 MRR (Monthly Recurring Revenue)

**User Experience:**
- ⭐ App load time < 2s
- ⭐ Time to first reflection < 5 min
- ⭐ Email delivery rate > 98%
- ⭐ Stripe success rate > 95%

---

## 🚀 Congratulations!

If you've completed all steps:
- ✅ Zero-downtime deployment achieved
- ✅ Security hardened
- ✅ Monitoring in place
- ✅ Rollback procedures ready

**Your app is production-ready!** 🎉

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-into-prod)
- [Stripe Best Practices](https://stripe.com/docs/security/guide)
- [Resend Production Setup](https://resend.com/docs/introduction)

---

*Last Updated: 2025-01-07*  
*Deployment Guide - Prompt & Pause*  
*Zero-Downtime • Secure • Production-Ready*
