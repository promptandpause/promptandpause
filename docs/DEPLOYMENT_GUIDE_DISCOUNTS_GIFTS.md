# Deployment Guide: Discounts & Gift Subscriptions

**Date:** January 7, 2026  
**Status:** Ready for Deployment

---

## Overview

This guide covers deploying the Student/NHS discount system and gift subscription features to production.

**What's being deployed:**
- Student & NHS discounted subscriptions (40% off)
- Gift subscriptions (1, 3, 6 months)
- Admin discount invitation flow
- Gift purchase and redemption system
- Email notifications for all flows
- Cron job for gift expiry

---

## Pre-Deployment Checklist

### 1. Stripe Configuration

**Create Products in Stripe Dashboard:**

Navigate to: **Products** → **Add Product**

**Student Discount Products:**
- Name: "Premium (Student) - Monthly"
  - Price: £7.20/month (recurring)
  - Billing period: Monthly
  - Copy Price ID → `STRIPE_PRICE_STUDENT_MONTHLY`

- Name: "Premium (Student) - Annual"
  - Price: £59/year (recurring)
  - Billing period: Yearly
  - Copy Price ID → `STRIPE_PRICE_STUDENT_ANNUAL`

**NHS Discount Products:**
- Name: "Premium (NHS) - Monthly"
  - Price: £7.20/month (recurring)
  - Billing period: Monthly
  - Copy Price ID → `STRIPE_PRICE_NHS_MONTHLY`

- Name: "Premium (NHS) - Annual"
  - Price: £59/year (recurring)
  - Billing period: Yearly
  - Copy Price ID → `STRIPE_PRICE_NHS_ANNUAL`

**Gift Subscription Products:**
- Name: "Gift Subscription - 1 Month"
  - Price: £15 (one-time payment)
  - Billing period: One time
  - Copy Price ID → `STRIPE_PRICE_GIFT_1_MONTH`

- Name: "Gift Subscription - 3 Months"
  - Price: £36 (one-time payment)
  - Billing period: One time
  - Copy Price ID → `STRIPE_PRICE_GIFT_3_MONTHS`

- Name: "Gift Subscription - 6 Months"
  - Price: £69 (one-time payment)
  - Billing period: One time
  - Copy Price ID → `STRIPE_PRICE_GIFT_6_MONTHS`

### 2. Environment Variables

**Add to Vercel:**

Navigate to: **Vercel Project** → **Settings** → **Environment Variables**

```bash
# Student Discount Prices
STRIPE_PRICE_STUDENT_MONTHLY=price_xxx
STRIPE_PRICE_STUDENT_ANNUAL=price_xxx

# NHS Discount Prices
STRIPE_PRICE_NHS_MONTHLY=price_xxx
STRIPE_PRICE_NHS_ANNUAL=price_xxx

# Gift Subscription Prices
STRIPE_PRICE_GIFT_1_MONTH=price_xxx
STRIPE_PRICE_GIFT_3_MONTHS=price_xxx
STRIPE_PRICE_GIFT_6_MONTHS=price_xxx
```

Mark all as **Production** environment.

### 3. Database Migrations

**Run in Supabase SQL Editor (in order):**

1. **Enable discount system:**
   ```sql
   -- Run: Sql scripts/add_discount_system.sql
   ```
   Verify:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name LIKE 'discount%';
   
   SELECT * FROM discount_invitations LIMIT 1;
   ```

2. **Enable gift subscriptions:**
   ```sql
   -- Run: Sql scripts/add_gift_subscriptions.sql
   ```
   Verify:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name LIKE 'gift%';
   
   SELECT * FROM gift_subscriptions LIMIT 1;
   
   -- Test token generation
   SELECT generate_redemption_token();
   ```

### 4. Cron Job Setup

**Add to cron-job.org:**

- **Name:** Expire Gifts
- **URL:** `https://promptandpause.com/api/cron/expire-gifts`
- **Method:** `POST`
- **Schedule:** `0 2 * * *` (Daily at 2 AM UTC)
- **Headers:**
  ```
  Authorization: Bearer YOUR_CRON_SECRET
  ```

---

## Deployment Steps

### Step 1: Deploy Code

```bash
# Commit all changes
git add .
git commit -m "Add discount and gift subscription systems"
git push origin main
```

Vercel will auto-deploy. Wait for deployment to complete (~2-3 minutes).

### Step 2: Verify Stripe Webhook

Navigate to: **Stripe Dashboard** → **Developers** → **Webhooks**

Verify webhook endpoint is active:
- URL: `https://promptandpause.com/api/stripe/webhook`
- Events listening for:
  - `checkout.session.completed` ✅
  - `customer.subscription.updated` ✅
  - `customer.subscription.deleted` ✅
  - `invoice.payment_failed` ✅

### Step 3: Test Flows

**Test Discount Invitation (Admin Only):**

```bash
# As admin, trigger invitation
POST /api/admin/discounts/invite
{
  "user_id": "test-user-uuid",
  "discount_type": "student",
  "billing_cycle": "monthly",
  "notes": "Test invitation"
}
```

Expected:
- Invitation created in database
- Email sent to user
- Checkout URL generated

**Test Gift Purchase:**

```bash
# Public endpoint (no auth)
POST /api/gifts/create-checkout
{
  "duration_months": "3",
  "purchaser_name": "Test Buyer",
  "purchaser_email": "buyer@example.com",
  "recipient_email": "recipient@example.com",
  "gift_message": "Happy Birthday!"
}
```

Expected:
- Gift record created
- Checkout URL returned
- Token generated

**Test Gift Redemption:**

```bash
# As signed-in user
POST /api/gifts/redeem
{
  "redemption_token": "32-char-token"
}
```

Expected:
- Gift marked as redeemed
- User upgraded to premium
- Confirmation email sent

### Step 4: Monitor First Real Transactions

**Watch for:**
- Stripe webhook deliveries in Stripe dashboard
- Database updates in Supabase
- Email delivery in Resend dashboard
- Error logs in Vercel

---

## Admin Operations

### How to Send Discount Invitation

**Prerequisites:**
- User must have an account
- User must NOT have active premium subscription
- Admin must be authenticated

**Steps:**
1. Get user's UUID from profiles table
2. Call `/api/admin/discounts/invite` endpoint
3. System sends email with checkout link
4. Link expires in 7 days
5. Once user pays, discount is automatically applied

**View Invitations:**
```bash
GET /api/admin/discounts/invitations
GET /api/admin/discounts/invitations?status=pending
GET /api/admin/discounts/invitations?discount_type=student
```

### How to Handle Gift Issues

**Check Gift Status:**
```sql
SELECT * FROM gift_subscriptions 
WHERE redemption_token = 'token-here';
```

**Manual Refund (if needed):**
1. Mark gift as 'refunded' in database
2. Process refund in Stripe dashboard
3. Email buyer with confirmation

**Extend Gift Expiry:**
```sql
UPDATE gift_subscriptions 
SET expires_at = NOW() + INTERVAL '30 days'
WHERE id = 'gift-uuid';
```

---

## Monitoring & Maintenance

### Key Metrics to Track

**Supabase Queries:**

```sql
-- Active discount subscriptions
SELECT discount_type, COUNT(*) 
FROM profiles 
WHERE discount_type IS NOT NULL 
GROUP BY discount_type;

-- Gift subscription stats
SELECT 
  status,
  duration_months,
  COUNT(*) as count,
  SUM(amount_paid) as total_revenue
FROM gift_subscriptions
GROUP BY status, duration_months;

-- Pending gift invitations
SELECT COUNT(*) FROM discount_invitations WHERE status = 'pending';

-- Expiring gifts (next 7 days)
SELECT COUNT(*) FROM gift_subscriptions 
WHERE status = 'pending' 
AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';
```

### Scheduled Tasks

**Daily (2 AM UTC):**
- Expire unredeemed gifts (12 months old)
- Expire active gift subscriptions
- Send 7-day expiry reminders

**Weekly:**
- Review pending discount invitations
- Check for stuck/failed webhooks

**Monthly:**
- Analyze discount conversion rates
- Review gift purchase patterns
- Check for abuse/fraud

---

## Troubleshooting

### Discount Invitation Not Sent

**Check:**
1. User email exists in profiles table
2. Resend API key is configured
3. Email delivery logs: `SELECT * FROM email_delivery_log WHERE recipient_email = 'user@example.com'`
4. Invitation record created: `SELECT * FROM discount_invitations WHERE user_id = 'uuid'`

**Fix:**
- Resend invitation manually
- Check Resend dashboard for bounce/complaint

### Gift Redemption Failed

**Common Issues:**

1. **"Gift already redeemed"**
   - Check gift status in database
   - Token is single-use

2. **"Email doesn't match"**
   - Recipient email was specified at purchase
   - User must sign in with that email

3. **"Already have subscription"**
   - User has active paid subscription
   - Gift queued for later (manual intervention needed)

**Resolution:**
```sql
-- Check gift details
SELECT * FROM gift_subscriptions WHERE redemption_token = 'token';

-- Manually activate if needed (use with caution)
UPDATE profiles 
SET 
  subscription_status = 'premium',
  is_gift_subscription = true,
  gift_subscription_end_date = NOW() + INTERVAL '3 months'
WHERE id = 'user-uuid';

UPDATE gift_subscriptions 
SET status = 'redeemed', redeemed_at = NOW(), recipient_user_id = 'user-uuid'
WHERE redemption_token = 'token';
```

### Webhook Failures

**Check Stripe Dashboard:**
- Developers → Webhooks → Click webhook URL
- View recent deliveries
- Check for 400/500 errors

**Common Fixes:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
2. Check Vercel function logs for errors
3. Re-send webhook from Stripe dashboard

---

## Rollback Procedure

**If something goes wrong:**

1. **Disable new invitations/purchases:**
   ```sql
   -- Temporarily block new invitations
   UPDATE discount_invitations SET status = 'cancelled' WHERE status = 'pending';
   ```

2. **Revert database (if needed):**
   ```sql
   -- Drop discount tables
   DROP TABLE IF EXISTS discount_invitations CASCADE;
   DROP TABLE IF EXISTS gift_subscriptions CASCADE;
   
   -- Remove columns from profiles
   ALTER TABLE profiles 
     DROP COLUMN IF EXISTS discount_type,
     DROP COLUMN IF EXISTS discount_verified_at,
     DROP COLUMN IF EXISTS discount_expires_at,
     DROP COLUMN IF EXISTS gift_subscription_end_date,
     DROP COLUMN IF EXISTS is_gift_subscription;
   ```

3. **Revert code:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

4. **Notify affected users** via email

---

## Post-Deployment Tasks

- [ ] Test discount invitation flow end-to-end
- [ ] Test gift purchase and redemption
- [ ] Verify cron job runs successfully
- [ ] Monitor Stripe webhook deliveries (24 hours)
- [ ] Check email delivery success rate
- [ ] Document admin procedures in internal wiki
- [ ] Train support team on gift redemption issues
- [ ] Set up alerts for failed webhooks
- [ ] Review first week's analytics

---

## Support Runbook

**User asks: "How do I redeem my gift?"**

1. User must have an account (or create one)
2. Sign in at promptandpause.com/login
3. Visit gift redemption page (provide link)
4. Enter gift code
5. Subscription activates immediately

**User asks: "My gift code doesn't work"**

Check:
- Is code correct? (32 characters)
- Has it expired? (12 months from purchase)
- Has it been redeemed already?
- Email match (if recipient email was specified)

**User asks: "Can I gift to someone without an email?"**

No - recipient must have an account to redeem. They can create one at redemption time.

---

**Deployment Complete! 🎉**

Monitor the first 24-48 hours closely and address any issues immediately.
