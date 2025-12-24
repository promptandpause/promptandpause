# 🧪 End-to-End Testing Guide - Daily Prompt System

## Overview
This guide walks through testing the complete daily prompt notification system including:
- ✅ Email delivery via Resend
- ✅ Slack integration via webhooks
- ✅ Timezone support with DST handling
- ✅ Free vs Premium tier limits
- ✅ Admin panel monitoring
- ✅ Cron job scheduling

---

## 🎯 Prerequisites

### Environment Variables Required
```bash
# Email Service
RESEND_API_KEY=re_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cron Security (for scheduled runs)
CRON_SECRET=your-secret-key

# Slack (optional)
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Database Setup
Ensure these tables exist:
- `profiles` (with `timezone_iana` column)
- `user_preferences` (with notification settings)
- `prompts_history` (for AI-generated prompts)
- `reflections` (to check completion status)
- `cron_job_runs` (for logging)

---

## 🧪 Test Suite

### **Test 1: Verify User Settings**

#### Step 1.1: Check User Profile & Preferences
```sql
-- Run in Supabase SQL Editor
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.subscription_status,
  p.timezone_iana,
  up.daily_reminders,
  up.notifications_enabled,
  up.reminder_time,
  up.delivery_method,
  up.slack_webhook_url
FROM profiles p
LEFT JOIN user_preferences up ON p.id = up.user_id
WHERE p.email = 'your-email@example.com';
```

**Expected Results:**
- ✅ `daily_reminders` = true
- ✅ `notifications_enabled` = true
- ✅ `reminder_time` set (e.g., '09:00')
- ✅ `timezone_iana` set (e.g., 'Europe/London')
- ✅ `delivery_method` = 'email' | 'slack' | 'both'

#### Step 1.2: Update Settings for Testing
```sql
-- Set reminder time to current hour + 1 minute for immediate testing
UPDATE user_preferences
SET 
  reminder_time = TO_CHAR(CURRENT_TIMESTAMP + INTERVAL '1 minute', 'HH24:MI'),
  daily_reminders = true,
  notifications_enabled = true,
  timezone_iana = 'Europe/London',
  delivery_method = 'email',
  updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID';
```

---

### **Test 2: Manual Trigger via Admin Panel**

#### Step 2.1: Access Admin Panel
1. Navigate to: `https://yourapp.com/admin-panel/cron-jobs`
2. You should see the "Daily Prompt Emails" job card
3. Verify the card shows:
   - Job name: `send_daily_prompts`
   - Description
   - "Run Now" button

#### Step 2.2: Trigger Manual Run
1. Click **"Run Now"** button
2. Button should show loading state
3. Wait for completion (10-30 seconds)
4. Check for toast notification:
   - ✅ Success: "Job completed successfully"
   - ❌ Error: Check error message

#### Step 2.3: Verify Results in UI
1. Refresh the page or click "Refresh Stats"
2. Check **Statistics** section:
   - Total Runs should increment
   - Successful Runs should increment
   - Success Rate should update
3. Check **Recent Runs** table:
   - New entry should appear at top
   - Status should be "success" or "failed"
   - Duration should be displayed
   - Click "Show Details" to see metadata

---

### **Test 3: Verify Email Delivery**

#### Step 3.1: Check Email Inbox
- Open the inbox for the email address in your profile
- Look for email with subject: "✨ Your Daily Reflection Prompt"
- Check spam folder if not in inbox

#### Step 3.2: Verify Email Content
Email should contain:
- ✅ Personalized greeting with your name
- ✅ Today's date
- ✅ AI-generated prompt text
- ✅ "Start Reflecting" button linking to dashboard
- ✅ Branding matching your app theme
- ✅ Footer with unsubscribe info

#### Step 3.3: Check Database Logs
```sql
-- Verify prompt was generated
SELECT 
  id,
  prompt_text,
  date_generated,
  used,
  ai_provider
FROM prompts_history
WHERE user_id = 'YOUR_USER_ID'
ORDER BY date_generated DESC
LIMIT 1;

-- Verify cron job was logged
SELECT 
  job_name,
  status,
  started_at,
  completed_at,
  total_users,
  successful_sends,
  failed_sends,
  execution_time_ms,
  metadata
FROM cron_job_runs
WHERE job_name = 'send_daily_prompts'
ORDER BY started_at DESC
LIMIT 1;
```

---

### **Test 4: Slack Integration**

#### Step 4.1: Connect Slack
1. Go to Dashboard → Settings
2. Scroll to "Integrations" section
3. Click **"Connect Slack"** button
4. Authorize app in Slack OAuth flow
5. Select workspace and channel
6. Verify redirect back to settings with success message

#### Step 4.2: Verify Slack Connection
```sql
-- Check Slack webhook saved
SELECT 
  slack_webhook_url,
  delivery_method
FROM user_preferences
WHERE user_id = 'YOUR_USER_ID';
```

**Expected:**
- ✅ `slack_webhook_url` starts with `https://hooks.slack.com/`
- ✅ `delivery_method` = 'slack' or 'both'

#### Step 4.3: Test Slack Delivery
1. Update delivery method to include Slack:
```sql
UPDATE user_preferences
SET 
  delivery_method = 'both',  -- or 'slack' for Slack only
  reminder_time = TO_CHAR(CURRENT_TIMESTAMP + INTERVAL '1 minute', 'HH24:MI')
WHERE user_id = 'YOUR_USER_ID';
```

2. Trigger manual run from admin panel
3. Check Slack channel for message with:
   - ✅ Header: "✨ Your Daily Reflection Prompt"
   - ✅ Personalized greeting
   - ✅ Today's date
   - ✅ Prompt text
   - ✅ "Write Reflection" button

---

### **Test 5: Timezone Handling**

#### Step 5.1: Test Different Timezones
```sql
-- Test UK timezone (BST/GMT with DST)
UPDATE profiles
SET timezone_iana = 'Europe/London'
WHERE id = 'YOUR_USER_ID';

-- Test US timezone
UPDATE profiles
SET timezone_iana = 'America/New_York'
WHERE id = 'YOUR_USER_ID';

-- Test Asian timezone
UPDATE profiles
SET timezone_iana = 'Asia/Tokyo'
WHERE id = 'YOUR_USER_ID';
```

#### Step 5.2: Verify Time Matching
When you trigger the cron job, check the console logs for:
```
⏰ User your-email@example.com: 
   reminder=09:00 local, 
   timezone=Europe/London, 
   current UTC=08:00, 
   current local=09:00
```

**Expected Behavior:**
- ✅ `current local` should match `reminder` time
- ✅ System handles DST automatically
- ✅ Prompt only sent when local time matches reminder time

#### Step 5.3: Test DST Transition
Test around DST change dates:
- UK: Last Sunday in March (GMT → BST) and October (BST → GMT)
- US: Second Sunday in March and November

The system should automatically adjust without manual intervention.

---

### **Test 6: Free vs Premium Limits**

#### Step 6.1: Test Free User Limit
```sql
-- Set user to free tier
UPDATE profiles
SET 
  subscription_status = 'free',
  billing_cycle = NULL
WHERE id = 'YOUR_USER_ID';

-- Check current month's prompt count
SELECT COUNT(*) as prompts_this_month
FROM prompts_history
WHERE 
  user_id = 'YOUR_USER_ID'
  AND date_generated >= DATE_TRUNC('month', CURRENT_DATE);
```

**Expected Behavior:**
- ✅ Free users limited to 7 prompts per month
- ✅ After 7th prompt, cron job logs: "User reached free tier limit"
- ✅ No email sent after limit reached

#### Step 6.2: Test Premium User
```sql
-- Set user to premium
UPDATE profiles
SET 
  subscription_status = 'premium',
  billing_cycle = 'monthly'
WHERE id = 'YOUR_USER_ID';
```

**Expected Behavior:**
- ✅ Premium users have unlimited prompts
- ✅ No monthly limit enforced
- ✅ Prompts sent every day regardless of count

#### Step 6.3: Test Gift Trial
```sql
-- Set user to gift trial
UPDATE profiles
SET 
  billing_cycle = 'gift_trial',
  subscription_end_date = CURRENT_DATE + INTERVAL '30 days'
WHERE id = 'YOUR_USER_ID';
```

**Expected Behavior:**
- ✅ Gift trial users treated as premium (unlimited)
- ✅ Works until `subscription_end_date`

---

### **Test 7: Completion Status Check**

#### Step 7.1: Test Without Reflection
```sql
-- Ensure no reflection today
DELETE FROM reflections
WHERE user_id = 'YOUR_USER_ID'
AND created_at >= CURRENT_DATE;
```

**Expected Behavior:**
- ✅ Prompt email sent
- ✅ Cron log shows successful send

#### Step 7.2: Test With Completed Reflection
```sql
-- Mark today's prompt as used
UPDATE prompts_history
SET used = true
WHERE user_id = 'YOUR_USER_ID'
AND date_generated = CURRENT_DATE;
```

**Expected Behavior:**
- ✅ No email sent
- ✅ Cron log shows: "User already completed today's prompt"
- ✅ User skipped in processing

#### Step 7.3: Test With Uncompleted Prompt
```sql
-- Ensure prompt exists but not used
UPDATE prompts_history
SET used = false
WHERE user_id = 'YOUR_USER_ID'
AND date_generated = CURRENT_DATE;
```

**Expected Behavior:**
- ✅ Reminder email sent with existing prompt
- ✅ Cron log shows: "User has prompt but hasn't completed it - sending reminder"

---

### **Test 8: Scheduled Cron Job** (Production Only)

#### Step 8.1: Verify Vercel Cron Config
Check `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-daily-prompts",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### Step 8.2: Monitor Scheduled Run
1. Set reminder time to next hour
2. Wait for Vercel cron to trigger
3. Check Vercel function logs
4. Verify email received
5. Check admin panel for new run entry

#### Step 8.3: Verify Cron Secret
Ensure `CRON_SECRET` environment variable is set in Vercel for scheduled runs.

---

## 🐛 Troubleshooting

### **No Email Received**

#### Check 1: User Settings
```sql
SELECT 
  CASE 
    WHEN up.daily_reminders = false THEN '❌ Daily reminders disabled'
    WHEN up.notifications_enabled = false THEN '❌ Notifications disabled'
    WHEN ph.used = true THEN '❌ Already completed today'
    WHEN p.subscription_status = 'free' AND 
         (SELECT COUNT(*) FROM prompts_history 
          WHERE user_id = p.id 
          AND date_generated >= DATE_TRUNC('month', CURRENT_DATE)) >= 7
         THEN '❌ Free tier limit reached'
    ELSE '✅ Should receive email'
  END as status,
  up.reminder_time,
  p.timezone_iana,
  up.delivery_method
FROM profiles p
LEFT JOIN user_preferences up ON p.id = up.user_id
LEFT JOIN prompts_history ph ON ph.user_id = p.id 
  AND ph.date_generated = CURRENT_DATE
WHERE p.email = 'your-email@example.com';
```

#### Check 2: Time Matching
- Verify `reminder_time` in user's local timezone
- Check cron logs for time comparison
- Test with manual trigger

#### Check 3: Email Service
```sql
-- Check email delivery logs (if you have this table)
SELECT *
FROM email_delivery_log
WHERE sent_to = 'your-email@example.com'
ORDER BY sent_at DESC
LIMIT 5;
```

#### Check 4: Spam Folder
- Check spam/junk folder
- Add sending domain to safe senders

### **Slack Message Not Sent**

#### Check 1: Webhook URL
```sql
SELECT slack_webhook_url
FROM user_preferences
WHERE user_id = 'YOUR_USER_ID';
```

Webhook must start with `https://hooks.slack.com/`

#### Check 2: Delivery Method
```sql
-- Ensure Slack is enabled
UPDATE user_preferences
SET delivery_method = 'both'  -- or 'slack'
WHERE user_id = 'YOUR_USER_ID';
```

#### Check 3: Test Webhook Directly
```bash
curl -X POST "YOUR_SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message from Prompt & Pause"}'
```

### **Wrong Time / Timezone Issues**

#### Check 1: Verify IANA Timezone
```sql
-- List of valid IANA timezones
SELECT * FROM pg_timezone_names
WHERE name ILIKE '%london%' OR name ILIKE '%new_york%';

-- Update to correct timezone
UPDATE profiles
SET timezone_iana = 'Europe/London'
WHERE id = 'YOUR_USER_ID';
```

#### Check 2: Test Time Conversion
```javascript
// Test in browser console
const tz = 'Europe/London';
const now = new Date();
const local = now.toLocaleString('en-US', { 
  timeZone: tz, 
  hour12: false, 
  hour: '2-digit', 
  minute: '2-digit' 
});
console.log('Current time in', tz, ':', local);
```

#### Check 3: Review Cron Logs
Look for lines like:
```
⏰ User email@example.com: 
   reminder=09:00 local, 
   timezone=Europe/London, 
   current UTC=08:00, 
   current local=09:00
```

---

## 📊 Monitoring Queries

### Daily Success Rate
```sql
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(AVG(execution_time_ms)) as avg_time_ms,
  SUM(successful_sends) as total_emails_sent
FROM cron_job_runs
WHERE job_name = 'send_daily_prompts'
  AND started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

### User Engagement
```sql
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT user_id) FILTER (
    WHERE date_generated >= CURRENT_DATE - INTERVAL '7 days'
  ) as active_last_7_days,
  COUNT(*) FILTER (WHERE used = true) as completed_prompts,
  COUNT(*) FILTER (WHERE used = false) as pending_prompts
FROM prompts_history
WHERE date_generated >= CURRENT_DATE - INTERVAL '30 days';
```

### Failed Deliveries
```sql
SELECT 
  started_at,
  failed_sends,
  error_message,
  metadata
FROM cron_job_runs
WHERE job_name = 'send_daily_prompts'
  AND (status = 'failed' OR failed_sends > 0)
  AND started_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY started_at DESC;
```

---

## ✅ Test Completion Checklist

- [ ] User preferences configured correctly
- [ ] Manual trigger works from admin panel
- [ ] Email received with correct content
- [ ] Slack message received (if enabled)
- [ ] Timezone handling works for your location
- [ ] Free tier limit enforced (7 prompts/month)
- [ ] Premium tier unlimited prompts
- [ ] No email sent when reflection already completed
- [ ] Cron job logging works
- [ ] Admin panel displays accurate stats
- [ ] Scheduled cron runs successfully (production)
- [ ] All environment variables set

---

## 🚀 Ready for Production

Once all tests pass:

1. ✅ Deploy to Vercel
2. ✅ Set all environment variables
3. ✅ Enable Vercel Cron
4. ✅ Monitor first scheduled run
5. ✅ Check admin panel daily for failed runs
6. ✅ Set up alerts for failures (optional)

---

**Happy Testing!** 🎉

For issues or questions, check:
- `PRODUCTION_CHECKLIST.md`
- `TIMEZONE_SETUP.md`
- `SLACK_SETUP_GUIDE.md`
- Admin Panel → Cron Jobs → Recent Runs
