# Welcome Email System - Complete Setup Guide

## Overview

All new users (OAuth and email/password) automatically receive a welcome email after signup. The system uses a queue-based approach for reliable delivery.

## How It Works

### 1. User Signs Up
```
User Signs Up (Google SSO or Email/Password)
    ↓
auth.users INSERT trigger fires
    ↓
create_profile_with_trial() function runs
    ↓
Profile created with 7-day trial
    ↓
Welcome email queued in email_queue table
```

### 2. Email Queue Processing
```
Cron job runs every 5 minutes
    ↓
Fetches pending welcome emails
    ↓
Sends via Resend API
    ↓
Marks as sent or failed
    ↓
Retries up to 3 times if failed
```

## Database Setup

### Step 1: Create Email Queue Table

Run `setup_email_queue.sql` in Supabase SQL Editor. This creates:

1. **email_queue table** - Stores pending emails
2. **Indexes** - For fast lookups
3. **RLS policies** - Security
4. **Helper functions** - Queue processing

### Step 2: Update Profile Trigger

The `setup_7day_trial.sql` file has been updated to queue welcome emails. When you run it, the trigger will:

1. Extract user name from OAuth metadata (Google provides full_name)
2. Create profile with trial
3. Queue welcome email

## Email Queue Table Schema

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT, -- 'welcome', 'trial_expiration', etc.
  recipient_email TEXT,
  recipient_name TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT, -- 'pending', 'sent', 'failed'
  error_message TEXT,
  retry_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Cron Job

**File:** `app/api/cron/send-welcome-emails/route.ts`

**Schedule:** Every 5 minutes (`*/5 * * * *`)

**What it does:**
1. Fetches pending welcome emails from queue
2. Sends via `sendWelcomeEmail()` function
3. Updates status to 'sent' or 'failed'
4. Retries failed emails up to 3 times
5. Processes max 50 emails per run

**Added to vercel.json:**
```json
{
  "path": "/api/cron/send-welcome-emails",
  "schedule": "*/5 * * * *"
}
```

## Welcome Email Content

**Function:** `sendWelcomeEmail()` in `lib/services/emailService.ts`

**Email includes:**
- Personalized greeting with user's name
- Welcome message
- Overview of features
- 7-day trial notification
- Getting started tips
- CTA to start first reflection

**Subject:** "Welcome to Prompt & Pause! 🌟"

## OAuth User Name Extraction

For Google SSO users, the trigger extracts their name from metadata:

```sql
user_name := COALESCE(
  NEW.raw_user_meta_data->>'full_name',  -- Google provides this
  NEW.raw_user_meta_data->>'name',       -- Fallback
  split_part(NEW.email, '@', 1)          -- Email username as last resort
);
```

**Google SSO provides:**
- `full_name`: "John Doe"
- `email`: "john@example.com"
- `avatar_url`: Profile picture URL

## Setup Instructions

### 1. Run SQL Files in Order

```sql
-- First, run email queue setup
-- Execute: setup_email_queue.sql

-- Then, run trial setup (includes welcome email queueing)
-- Execute: setup_7day_trial.sql
```

### 2. Verify Email Service

Check environment variables:
```bash
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=prompts@promptandpause.com
CRON_SECRET=your-secret-here
```

### 3. Test Welcome Email

**Option A: Sign up with new account**
```
1. Sign up with Google SSO or email/password
2. Wait up to 5 minutes
3. Check email inbox
```

**Option B: Manual queue insertion**
```sql
INSERT INTO email_queue (
  user_id,
  email_type,
  recipient_email,
  recipient_name,
  scheduled_for
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'welcome',
  'test@example.com',
  'Test User',
  NOW()
);

-- Wait 5 minutes for cron to process
-- Or manually trigger: curl https://yourdomain.com/api/cron/send-welcome-emails
```

## Monitoring

### Check Queue Status

```sql
-- Pending emails
SELECT 
  email_type,
  recipient_email,
  recipient_name,
  scheduled_for,
  retry_count
FROM email_queue
WHERE status = 'pending'
ORDER BY scheduled_for ASC;

-- Recently sent
SELECT 
  email_type,
  recipient_email,
  sent_at,
  status
FROM email_queue
WHERE sent_at > NOW() - INTERVAL '24 hours'
ORDER BY sent_at DESC;

-- Failed emails
SELECT 
  email_type,
  recipient_email,
  error_message,
  retry_count
FROM email_queue
WHERE status = 'failed'
ORDER BY updated_at DESC;
```

### Cron Job Logs

Check Vercel logs:
```
[CRON] Processing welcome email queue...
[CRON] Found 3 pending welcome emails
✅ Sent welcome email to user@example.com
[CRON] Welcome email processing complete: { processed: 3, sent: 3, failed: 0 }
```

## Retry Logic

**Automatic retries:**
- Max 3 attempts per email
- Status remains 'pending' for retries 1-2
- Status changes to 'failed' after 3rd failure
- 5-minute interval between retries (cron frequency)

**Manual retry:**
```sql
-- Reset failed email to retry
UPDATE email_queue
SET 
  status = 'pending',
  retry_count = 0,
  error_message = NULL,
  updated_at = NOW()
WHERE id = 'email-id-here';
```

## Cleanup

**Automatic cleanup (recommended):**

Add to cron job or run manually:
```sql
-- Delete sent emails older than 30 days
DELETE FROM email_queue
WHERE status = 'sent'
  AND sent_at < NOW() - INTERVAL '30 days';

-- Delete failed emails older than 7 days
DELETE FROM email_queue
WHERE status = 'failed'
  AND updated_at < NOW() - INTERVAL '7 days';
```

## Troubleshooting

### Welcome Email Not Received

**Check 1: Email in queue?**
```sql
SELECT * FROM email_queue 
WHERE recipient_email = 'user@example.com'
ORDER BY created_at DESC;
```

**Check 2: Cron job running?**
- Check Vercel logs
- Verify cron schedule in vercel.json
- Test manually: `curl https://yourdomain.com/api/cron/send-welcome-emails`

**Check 3: Email service configured?**
- Verify RESEND_API_KEY
- Check Resend dashboard for delivery status
- Verify sender email is verified in Resend

**Check 4: Trigger working?**
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_create_profile';
```

### Email Stuck in Pending

**Possible causes:**
- Cron job not running
- Email service error
- Invalid email address

**Fix:**
```sql
-- Check error message
SELECT error_message, retry_count 
FROM email_queue 
WHERE status = 'pending' AND retry_count > 0;

-- Reset if needed
UPDATE email_queue
SET retry_count = 0, error_message = NULL
WHERE status = 'pending' AND retry_count >= 3;
```

## Files Created/Modified

1. ✅ `setup_email_queue.sql` - Email queue table
2. ✅ `setup_7day_trial.sql` - Updated with email queueing
3. ✅ `app/api/cron/send-welcome-emails/route.ts` - Cron job
4. ✅ `lib/services/emailService.ts` - Already has sendWelcomeEmail()
5. ✅ `vercel.json` - Added cron schedule
6. ✅ `WELCOME_EMAIL_SETUP.md` - This documentation

## Testing Checklist

- [ ] Run setup_email_queue.sql
- [ ] Run setup_7day_trial.sql (updated version)
- [ ] Deploy to Vercel
- [ ] Sign up with Google SSO
- [ ] Verify email received within 5 minutes
- [ ] Check email_queue table shows 'sent'
- [ ] Sign up with email/password
- [ ] Verify email received
- [ ] Check Vercel cron logs

## Next Steps

After setup:
1. Monitor email queue for first 24 hours
2. Check delivery rates in Resend dashboard
3. Adjust retry logic if needed
4. Set up cleanup cron for old emails
5. Consider adding more email types to queue

## Support

If emails aren't sending:
1. Check Resend dashboard for errors
2. Verify API key is valid
3. Check sender email is verified
4. Review Vercel cron logs
5. Test email function directly in API
