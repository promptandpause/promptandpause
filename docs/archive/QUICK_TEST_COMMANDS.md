# 🚀 Quick Test Commands - Daily Prompt System

## Instant Test (5 Minutes)

### Step 1: Set Your Reminder Time to Now + 1 Minute
```sql
-- Replace YOUR_USER_ID with your actual user ID
UPDATE user_preferences
SET 
  reminder_time = TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/London' + INTERVAL '1 minute', 'HH24:MI'),
  daily_reminders = true,
  notifications_enabled = true,
  delivery_method = 'email',
  updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID';

-- Verify it was updated
SELECT 
  user_id,
  reminder_time,
  daily_reminders,
  notifications_enabled,
  delivery_method
FROM user_preferences
WHERE user_id = 'YOUR_USER_ID';
```

### Step 2: Update Your Timezone
```sql
-- Set to your timezone (examples below)
UPDATE profiles
SET timezone_iana = 'Europe/London'  -- UK
-- SET timezone_iana = 'America/New_York'  -- US East Coast
-- SET timezone_iana = 'America/Los_Angeles'  -- US West Coast
-- SET timezone_iana = 'Asia/Tokyo'  -- Japan
WHERE id = 'YOUR_USER_ID';

-- Verify timezone
SELECT id, email, timezone_iana
FROM profiles
WHERE id = 'YOUR_USER_ID';
```

### Step 3: Trigger Manual Run
1. Go to: `http://localhost:3001/admin-panel/cron-jobs` (or your dev URL)
2. Click **"Run Now"** button
3. Wait 10-30 seconds
4. Check your email inbox (and spam folder!)

---

## Check If You Should Receive Email

```sql
-- Diagnostic query - tells you exactly why you're not receiving emails
SELECT 
  p.id,
  p.email,
  p.subscription_status,
  p.timezone_iana,
  up.daily_reminders,
  up.notifications_enabled,
  up.reminder_time,
  up.delivery_method,
  
  -- Check if already completed today
  EXISTS (
    SELECT 1 FROM prompts_history ph
    WHERE ph.user_id = p.id 
    AND ph.date_generated = CURRENT_DATE
    AND ph.used = true
  ) as completed_today,
  
  -- Check free tier limit
  CASE 
    WHEN p.subscription_status = 'free' THEN (
      SELECT COUNT(*) FROM prompts_history ph2
      WHERE ph2.user_id = p.id 
      AND ph2.date_generated >= DATE_TRUNC('month', CURRENT_DATE)
    )
    ELSE NULL
  END as prompts_this_month,
  
  -- Overall status
  CASE 
    WHEN up.daily_reminders = false THEN '❌ Daily reminders disabled'
    WHEN up.notifications_enabled = false THEN '❌ Notifications disabled'
    WHEN EXISTS (
      SELECT 1 FROM prompts_history ph
      WHERE ph.user_id = p.id 
      AND ph.date_generated = CURRENT_DATE
      AND ph.used = true
    ) THEN '❌ Already completed today'
    WHEN p.subscription_status = 'free' AND (
      SELECT COUNT(*) FROM prompts_history ph2
      WHERE ph2.user_id = p.id 
      AND ph2.date_generated >= DATE_TRUNC('month', CURRENT_DATE)
    ) >= 7 THEN '❌ Free tier limit reached (7/month)'
    ELSE '✅ SHOULD RECEIVE EMAIL'
  END as email_status
  
FROM profiles p
LEFT JOIN user_preferences up ON p.id = up.user_id
WHERE p.email = 'your-email@example.com';  -- Change this
```

---

## View Recent Cron Job Runs

```sql
-- Last 5 cron job runs
SELECT 
  job_name,
  status,
  started_at,
  completed_at,
  total_users,
  successful_sends,
  failed_sends,
  execution_time_ms,
  error_message,
  metadata
FROM cron_job_runs
WHERE job_name = 'send_daily_prompts'
ORDER BY started_at DESC
LIMIT 5;
```

---

## Check Your Generated Prompts

```sql
-- Your last 5 prompts
SELECT 
  id,
  prompt_text,
  date_generated,
  used,
  ai_provider,
  ai_model
FROM prompts_history
WHERE user_id = 'YOUR_USER_ID'
ORDER BY date_generated DESC
LIMIT 5;
```

---

## Reset for Fresh Test

```sql
-- Delete today's prompt and reflections to test fresh
DELETE FROM reflections
WHERE user_id = 'YOUR_USER_ID'
AND created_at >= CURRENT_DATE;

DELETE FROM prompts_history
WHERE user_id = 'YOUR_USER_ID'
AND date_generated = CURRENT_DATE;

-- Verify deleted
SELECT COUNT(*) as today_prompts
FROM prompts_history
WHERE user_id = 'YOUR_USER_ID'
AND date_generated = CURRENT_DATE;
```

---

## Test Current Time Matching

```sql
-- This shows what the cron job sees
SELECT 
  p.email,
  p.timezone_iana,
  up.reminder_time,
  
  -- Current UTC time
  TO_CHAR(CURRENT_TIMESTAMP, 'HH24:MI') as current_utc,
  
  -- Current time in your timezone
  TO_CHAR(
    CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE p.timezone_iana, 
    'HH24:MI'
  ) as current_local,
  
  -- Check if times match
  CASE 
    WHEN SPLIT_PART(up.reminder_time, ':', 1)::int = 
         EXTRACT(HOUR FROM (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE p.timezone_iana))::int
    THEN '✅ TIME MATCHES - SHOULD SEND'
    ELSE '❌ Time does not match'
  END as time_status
  
FROM profiles p
LEFT JOIN user_preferences up ON p.id = up.user_id
WHERE p.id = 'YOUR_USER_ID';
```

---

## Test Slack Connection (Optional)

```sql
-- Check if Slack is connected
SELECT 
  user_id,
  delivery_method,
  slack_webhook_url,
  CASE 
    WHEN slack_webhook_url IS NOT NULL 
         AND slack_webhook_url LIKE 'https://hooks.slack.com/%'
    THEN '✅ Slack connected'
    WHEN delivery_method IN ('slack', 'both')
         AND (slack_webhook_url IS NULL OR slack_webhook_url NOT LIKE 'https://hooks.slack.com/%')
    THEN '❌ Slack enabled but no valid webhook'
    ELSE '⏭️ Slack not configured'
  END as slack_status
FROM user_preferences
WHERE user_id = 'YOUR_USER_ID';
```

---

## Common Timezone IDs

```sql
-- Find your timezone
SELECT name
FROM pg_timezone_names
WHERE name ILIKE '%london%'     -- UK
   OR name ILIKE '%new_york%'   -- US East
   OR name ILIKE '%los_angeles%' -- US West
   OR name ILIKE '%chicago%'     -- US Central
   OR name ILIKE '%tokyo%'       -- Japan
   OR name ILIKE '%sydney%'      -- Australia
   OR name ILIKE '%paris%'       -- France/Central Europe
   OR name ILIKE '%dubai%'       -- UAE
ORDER BY name;

-- Popular timezones to use:
-- Europe/London
-- America/New_York
-- America/Chicago
-- America/Los_Angeles
-- Asia/Tokyo
-- Australia/Sydney
-- Europe/Paris
-- Asia/Dubai
```

---

## Monitor Real-time Logs (Dev Server)

If you're running the dev server, watch the console when you trigger the cron job. Look for:

```
✅ Authorized via admin user: your-email@example.com
⏰ Starting daily prompt cron job...
👥 Found X active users
⏰ User your-email@example.com: reminder=09:00 local, timezone=Europe/London, current UTC=08:00, current local=09:00
✅ User your-email@example.com matches time criteria! Sending prompt...
✨ Generated new prompt for user YOUR_USER_ID
✉️ Sent prompt email to your-email@example.com
✅ Cron job complete: Sent 1, Skipped 0
```

---

## Quick Fixes

### "No email received"
1. Check spam folder
2. Run diagnostic query above
3. Verify `RESEND_API_KEY` is set
4. Check Resend dashboard for delivery status

### "User skipped - wrong time"
1. Verify your `timezone_iana` matches your actual timezone
2. Update `reminder_time` to current hour: `TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'YOUR_TIMEZONE', 'HH24:MI')`
3. Run manual trigger again

### "Free tier limit reached"
```sql
-- Upgrade to premium for testing
UPDATE profiles
SET subscription_status = 'premium', billing_cycle = 'monthly'
WHERE id = 'YOUR_USER_ID';
```

### "Already completed today"
```sql
-- Delete today's completed prompt
DELETE FROM reflections WHERE user_id = 'YOUR_USER_ID' AND created_at >= CURRENT_DATE;
UPDATE prompts_history SET used = false WHERE user_id = 'YOUR_USER_ID' AND date_generated = CURRENT_DATE;
```

---

## Environment Check

```bash
# Check if all required environment variables are set
# Run in terminal

# Development (.env.local)
cat .env.local | grep -E "RESEND_API_KEY|SUPABASE|CRON_SECRET|SLACK"

# Or check in code
node -e "console.log({
  RESEND: !!process.env.RESEND_API_KEY,
  SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  CRON_SECRET: !!process.env.CRON_SECRET
})"
```

---

## Get Your User ID

```sql
-- Find your user ID by email
SELECT id, email, full_name, subscription_status
FROM profiles
WHERE email = 'your-email@example.com';
```

---

## One-Line Complete Test Setup

```sql
-- Replace YOUR_USER_ID and YOUR_EMAIL
WITH user_info AS (
  SELECT id FROM profiles WHERE email = 'YOUR_EMAIL'
)
UPDATE user_preferences up
SET 
  reminder_time = TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/London' + INTERVAL '1 minute', 'HH24:MI'),
  daily_reminders = true,
  notifications_enabled = true,
  delivery_method = 'email',
  updated_at = NOW()
FROM user_info
WHERE up.user_id = user_info.id
RETURNING 
  up.user_id,
  up.reminder_time,
  up.daily_reminders,
  up.notifications_enabled;
```

Then click "Run Now" in admin panel!

---

**Need more help?** Check `END_TO_END_TESTING_GUIDE.md` for comprehensive testing steps.
