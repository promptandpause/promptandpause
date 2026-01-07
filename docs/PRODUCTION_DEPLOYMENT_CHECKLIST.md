# Production Deployment Readiness Checklist

## ✅ Completed Pre-Deployment Tasks

### UI/UX Refactor
- [x] Refactored Users view to master-detail split-pane layout
- [x] Refactored Subscriptions view to table-first + detail panel
- [x] Refactored Discounts view to table-first + detail panel
- [x] Refactored Gifts view to table-first + detail panel
- [x] Applied calm, enterprise-grade neutral styling across all admin views

### Stripe Webhook Consolidation
- [x] Consolidated all webhook logic (standard subscriptions, discounts, gifts) into `/api/webhooks/stripe`
- [x] Removed old `/api/stripe/webhook` route
- [x] Added gift purchase handling (mode: 'payment' with gift metadata)
- [x] Added discount subscription detection (student/NHS price IDs)
- [x] Added discount invitation completion logic
- [x] Added proper subscription event logging for all types

### Cron Job Infrastructure
- [x] Created SQL migration for `cron_job_runs` table (`Sql scripts/create_cron_job_runs.sql`)
- [x] Patched `expire-gifts` cron to use `error_message` instead of `error`
- [x] Added `started_at`, `completed_at`, `execution_time_ms` to cron logging

---

## 📋 Pre-Deployment Checklist (Your Action Items)

### 1. Database Migrations
Run these SQL scripts in your production Supabase:

```bash
# Run in Supabase SQL Editor or via psql
# 1. Discount system (if not already run)
# Sql scripts/add_discount_system.sql

# 2. Gift subscriptions (if not already run)
# Sql scripts/add_gift_subscriptions.sql

# 3. Cron job runs table (NEW - required)
# Sql scripts/create_cron_job_runs.sql
```

**Verify tables exist:**
- [ ] `discount_invitations`
- [ ] `gift_subscriptions`
- [ ] `subscription_events`
- [ ] `cron_job_runs` ← **NEW - must exist**
- [ ] `profiles` has columns: `discount_type`, `discount_verified_at`, `is_gift_subscription`, `gift_subscription_end_date`

### 2. Environment Variables
Verify these are set in production environment:

**Stripe:**
- [ ] `STRIPE_SECRET_KEY` (production secret key)
- [ ] `STRIPE_WEBHOOK_SECRET` (from Stripe dashboard > Webhooks)
- [ ] `STRIPE_PRICE_MONTHLY` (standard monthly price ID)
- [ ] `STRIPE_PRICE_ANNUAL` (standard annual price ID)
- [ ] `STRIPE_PRICE_STUDENT_MONTHLY` (student monthly price ID)
- [ ] `STRIPE_PRICE_STUDENT_ANNUAL` (student annual price ID)
- [ ] `STRIPE_PRICE_NHS_MONTHLY` (NHS monthly price ID)
- [ ] `STRIPE_PRICE_NHS_ANNUAL` (NHS annual price ID)

**Supabase:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Cron Jobs:**
- [ ] `CRON_SECRET` (random secret for cron-job.org authorization)

**Email:**
- [ ] `RESEND_API_KEY`

### 3. Stripe Configuration
**Webhook endpoint (already configured):**
- [ ] Endpoint URL: `https://promptandpause.com/api/webhooks/stripe`
- [ ] Events enabled:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

**Products/Prices:**
- [ ] Standard Monthly Premium price exists
- [ ] Standard Annual Premium price exists
- [ ] Student Monthly price exists
- [ ] Student Annual price exists
- [ ] NHS Monthly price exists
- [ ] NHS Annual price exists

### 4. Cron Job Setup (cron-job.org)
Create cron jobs at https://cron-job.org with the following settings:

**Send Daily Prompts:**
- [ ] Title: "Send Daily Prompts"
- [ ] URL: `https://promptandpause.com/api/cron/send-daily-prompts`
- [ ] Method: POST
- [ ] Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- [ ] Schedule: Daily at your preferred time (e.g., 9:00 AM UTC)
- [ ] Save responses: Yes

**Expire Gifts:**
- [ ] Title: "Expire Gifts"
- [ ] URL: `https://promptandpause.com/api/cron/expire-gifts`
- [ ] Method: POST
- [ ] Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- [ ] Schedule: Daily at 2:00 AM UTC (or off-peak time)
- [ ] Save responses: Yes

### 5. Admin Access
- [ ] Admin users exist in `admin_users` table
- [ ] Admin login page works: `/admin-panel/login`
- [ ] Admin can access all views: Users, Subscriptions, Discounts, Gifts, Activity, Settings, Cron Jobs

### 6. Testing Checklist
**Before deploying to production:**
- [ ] Test standard subscription purchase (monthly/annual)
- [ ] Test discount subscription purchase (student/NHS)
- [ ] Test gift purchase and redemption flow
- [ ] Verify webhook events are logged to `subscription_events`
- [ ] Test admin panel navigation
- [ ] Test cron job manual trigger from admin panel
- [ ] Verify cron jobs log to `cron_job_runs` table

---

## 🚀 Deployment Steps

1. **Deploy code changes** to production (Vercel/Netlify)
2. **Run database migrations** in Supabase SQL Editor
3. **Verify environment variables** are set in production
4. **Test Stripe webhooks** (use Stripe dashboard "Send test webhook" feature)
5. **Configure cron-job.org** jobs
6. **Test cron jobs** manually via admin panel
7. **Monitor first 24 hours** for any errors

---

## 📊 Post-Deployment Monitoring

Check these after deployment:
- [ ] Admin panel loads without errors
- [ ] Stripe webhooks are processing (check `subscription_events` table)
- [ ] Cron jobs are running (check `cron_job_runs` table in admin panel)
- [ ] Emails are being sent (Resend dashboard)
- [ ] No console errors in browser

---

## ⚠️ Known Issues / Notes

- **None** - all blockers have been resolved

---

## 📞 Support / Rollback

If issues arise:
1. Check Supabase logs for database errors
2. Check Stripe webhook logs for payment issues
3. Check cron-job.org logs for cron failures
4. Rollback code if necessary (Vercel/Netlify deploy history)

---

**Status: ✅ READY FOR DEPLOYMENT** (once you complete the checklist items above)
