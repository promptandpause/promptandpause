# 7-Day Premium Trial System - Complete Setup Guide

## Overview

All new users automatically receive 7 days of premium access. After the trial expires, they revert to the free tier and receive an email notification.

## Database Setup

### Step 1: Run SQL in Supabase

Execute `setup_7day_trial.sql` in your Supabase SQL Editor. This will:

1. **Add trial columns to profiles table:**
   - `trial_start_date` - When trial started
   - `trial_end_date` - When trial expires
   - `is_trial` - Boolean flag for active trials

2. **Create auto-profile trigger:**
   - Automatically creates profile when user signs up
   - Sets `subscription_status` = 'premium'
   - Sets `subscription_tier` = 'premium'
   - Sets `trial_end_date` = NOW() + 7 days
   - Sets `is_trial` = true

3. **Create expiration function:**
   - `expire_trial_subscriptions()` - Reverts expired trials to free tier

### Step 2: Verify Database Setup

```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_create_profile';

-- Check if columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('trial_start_date', 'trial_end_date', 'is_trial');
```

## Automatic Trial Expiration

### Cron Job Setup

The cron job runs daily at 00:00 UTC via Vercel Cron:

**File:** `app/api/cron/expire-trials/route.ts`

**Schedule:** `0 0 * * *` (midnight UTC daily)

**What it does:**
1. Finds all users with `is_trial = true` and `trial_end_date < NOW()`
2. Updates their profile:
   - `subscription_status` → 'free'
   - `subscription_tier` → 'freemium'
   - `is_trial` → false
3. Sends trial expiration email to each user

### Vercel Cron Configuration

Added to `vercel.json`:
```json
{
  "path": "/api/cron/expire-trials",
  "schedule": "0 0 * * *"
}
```

### Email Notification

**Function:** `sendTrialExpirationEmail()` in `lib/services/emailService.ts`

**Email includes:**
- Notification that trial has ended
- Explanation of what happens (reverted to free tier)
- List of premium features they'll miss
- CTA button to upgrade
- Friendly tone encouraging upgrade

## User Flow

### New User Signup

```
User Signs Up
    ↓
auth.users INSERT trigger fires
    ↓
create_profile_with_trial() function runs
    ↓
Profile created with:
  - subscription_status: 'premium'
  - subscription_tier: 'premium'
  - trial_start_date: NOW()
  - trial_end_date: NOW() + 7 days
  - is_trial: true
    ↓
User has 7 days of premium access
```

### Trial Active (Days 1-7)

- User sees "Trial" badge in subscription settings
- Full access to all premium features:
  - Custom focus areas
  - Weekly AI insights
  - Advanced analytics
  - Priority support
- Can upgrade to paid premium anytime (doesn't affect trial)

### Trial Expiration (Day 8)

```
Cron job runs at 00:00 UTC
    ↓
Finds expired trials
    ↓
Updates profile:
  - subscription_status: 'free'
  - subscription_tier: 'freemium'
  - is_trial: false
    ↓
Sends trial expiration email
    ↓
User reverted to free tier
```

### After Trial Expires

- User sees free tier features only
- Receives email with upgrade CTA
- Can upgrade to premium anytime
- No automatic charges (trial is completely free)

## Subscription Settings Display

### Trial Status Badge

When `is_trial = true` and `trial_end_date > NOW()`:

```
┌─────────────────────────────────────┐
│ Current Plan: Premium (Trial)       │
│ Trial ends in: 4 days               │
│ [Upgrade to Premium]                │
└─────────────────────────────────────┘
```

### After Trial Expires

```
┌─────────────────────────────────────┐
│ Current Plan: Free                  │
│ Your trial has ended                │
│ [Upgrade to Premium]                │
└─────────────────────────────────────┘
```

## Upgrade During Trial

Users can upgrade to paid premium during the trial:

1. **Trial continues** until natural expiration
2. **Paid subscription starts** after trial ends
3. **No double-charging** - trial is free, payment starts after
4. **Seamless transition** - no interruption in service

### Implementation

When user upgrades during trial:
```typescript
// Keep trial active
is_trial: true (unchanged)
trial_end_date: (unchanged)

// Add payment info
subscription_status: 'premium' (already premium)
billing_cycle: 'monthly' or 'yearly'
subscription_end_date: trial_end_date + 30 days (or 365)
stripe_customer_id: (from Stripe)
stripe_subscription_id: (from Stripe)
```

After trial expires:
```typescript
// Cron job checks for paid subscription
if (has stripe_subscription_id) {
  // Keep premium, just remove trial flag
  is_trial: false
  subscription_status: 'premium' (unchanged)
} else {
  // Revert to free
  is_trial: false
  subscription_status: 'free'
}
```

## Testing

### Test New User Signup

1. Create new account
2. Check profile in database:
   ```sql
   SELECT 
     email,
     subscription_status,
     subscription_tier,
     is_trial,
     trial_start_date,
     trial_end_date,
     trial_end_date - NOW() as time_remaining
   FROM profiles 
   WHERE email = 'test@example.com';
   ```
3. Should show:
   - `subscription_status` = 'premium'
   - `is_trial` = true
   - `time_remaining` ≈ 7 days

### Test Trial Expiration (Manual)

```sql
-- Set trial to expire in 1 minute (for testing)
UPDATE profiles
SET trial_end_date = NOW() + INTERVAL '1 minute'
WHERE email = 'test@example.com';

-- Wait 1 minute, then manually run expiration
SELECT expire_trial_subscriptions();

-- Check profile was updated
SELECT subscription_status, is_trial 
FROM profiles 
WHERE email = 'test@example.com';
-- Should show: subscription_status = 'free', is_trial = false
```

### Test Cron Job

```bash
# Trigger cron manually
curl -X GET https://yourdomain.com/api/cron/expire-trials \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

### Check Active Trials

```sql
SELECT 
  email,
  subscription_status,
  trial_start_date,
  trial_end_date,
  trial_end_date - NOW() as time_remaining
FROM profiles
WHERE is_trial = true
ORDER BY trial_end_date ASC;
```

### Check Expired Trials (Last 7 Days)

```sql
SELECT 
  email,
  subscription_status,
  trial_end_date,
  updated_at
FROM profiles
WHERE 
  is_trial = false
  AND trial_end_date IS NOT NULL
  AND trial_end_date > NOW() - INTERVAL '7 days'
  AND trial_end_date < NOW()
ORDER BY trial_end_date DESC;
```

### Cron Job Logs

Check Vercel logs for cron execution:
```
[CRON] Starting trial expiration check...
[CRON] Found 3 expired trials
✅ Expired trial for user@example.com
📧 Sent trial expiration email to user@example.com
[CRON] Trial expiration complete: { expired: 3, emailsSent: 3, errors: [] }
```

## Environment Variables

Required in `.env` or Vercel:

```bash
# Email service (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=prompts@promptandpause.com

# Cron security
CRON_SECRET=your-random-secret-here

# App URL
NEXT_PUBLIC_APP_URL=https://promptandpause.com
```

## Security

✅ Cron endpoint protected by `CRON_SECRET`
✅ Database trigger uses `SECURITY DEFINER`
✅ RLS policies allow profile creation
✅ Email notifications logged
✅ Trial status visible to users
✅ No automatic charges

## Troubleshooting

### Profile Not Created on Signup

**Check:**
1. Trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created_create_profile'`
2. Function exists: `SELECT * FROM pg_proc WHERE proname = 'create_profile_with_trial'`
3. RLS policies allow INSERT: `SELECT * FROM pg_policies WHERE tablename = 'profiles'`

**Fix:** Re-run `setup_7day_trial.sql`

### Trials Not Expiring

**Check:**
1. Cron job configured in `vercel.json`
2. Cron secret set in environment
3. Check Vercel logs for errors
4. Manually run: `SELECT expire_trial_subscriptions();`

### Email Not Sending

**Check:**
1. `RESEND_API_KEY` set
2. `RESEND_FROM_EMAIL` verified in Resend
3. Check function logs for errors
4. Test email function directly

## Files Modified/Created

1. `setup_7day_trial.sql` - Database setup
2. `app/api/cron/expire-trials/route.ts` - Cron job
3. `lib/services/emailService.ts` - Trial expiration email
4. `vercel.json` - Cron schedule
5. `TRIAL_SYSTEM_SETUP.md` - This documentation

## Next Steps

1. ✅ Run `setup_7day_trial.sql` in Supabase
2. ✅ Deploy to Vercel (cron will auto-configure)
3. ✅ Test with new signup
4. ✅ Monitor first trial expiration
5. ⏳ Add trial status to subscription settings UI (optional)
6. ⏳ Add trial countdown notification (optional)

## Support

If users have questions about trials:
- Trial is completely free, no credit card required
- Full premium access for 7 days
- Auto-reverts to free tier after expiration
- Can upgrade anytime during or after trial
- No automatic charges
