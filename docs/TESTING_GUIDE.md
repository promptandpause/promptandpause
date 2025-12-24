# Testing Guide - Daily Prompts System

This guide will help you test the daily prompt system before deploying to production.

## 🧪 Local Testing Checklist

### Prerequisites
- [x] Dev server running (`npm run dev`)
- [x] Environment variables in `.env.local`
- [x] At least one test user account
- [x] Test user has completed onboarding

---

## Test 1: Verify Environment Variables

Check that all required environment variables are set:

```powershell
# In PowerShell
Get-Content .env.local | Select-String "CRON_SECRET|RESEND|SLACK"
```

Expected output should show:
- `CRON_SECRET=...`
- `RESEND_API_KEY=...`
- `RESEND_FROM_EMAIL=...`
- `SLACK_CLIENT_ID=...` (optional)
- `SLACK_CLIENT_SECRET=...` (optional)

---

## Test 2: Test Cron Job Endpoint

### Option A: Using the Test Script (Recommended)

```powershell
# Load environment variables and run test
$env:CRON_SECRET = (Get-Content .env.local | Select-String "CRON_SECRET" | ForEach-Object { $_.ToString().Split("=")[1] })
node scripts/test-cron.js
```

### Option B: Using cURL

```powershell
# Get CRON_SECRET from .env.local
$cronSecret = (Get-Content .env.local | Select-String "CRON_SECRET" | ForEach-Object { $_.ToString().Split("=")[1] })

# Test the endpoint
curl -X POST https://localhost:3002/api/cron/send-daily-prompts `
  -H "Authorization: Bearer $cronSecret" `
  -H "Content-Type: application/json"
```

### Expected Response:

```json
{
  "success": true,
  "message": "Daily prompts sent successfully",
  "sent": 0,
  "skipped": 0,
  "results": []
}
```

**Note**: `sent: 0` is normal if:
- No users have `daily_reminders` enabled
- No users' `prompt_time` matches current hour
- All users have already completed today's prompt

---

## Test 3: Test Email Delivery

### Setup Test User:
1. Log in to your test account
2. Go to Settings → Notifications
3. Enable "Daily Reminders"
4. Set "Reminder Time" to the **next hour** (e.g., if it's 3:15 PM, set to 4:00 PM)
5. Save changes

### Trigger Email Manually:

```powershell
# While logged in, get your session cookie from browser DevTools
# Then test the email endpoint directly:

curl -X POST https://localhost:3002/api/emails/send-prompt `
  -H "Content-Type: application/json" `
  -H "Cookie: YOUR_SESSION_COOKIE" `
  -d '{}'
```

Or simply wait for the next hour and run the cron test again.

---

## Test 4: Check Database

### Verify User Preferences:

```sql
-- In Supabase SQL Editor
SELECT 
  user_id,
  daily_reminders,
  prompt_time,
  delivery_method,
  slack_webhook_url
FROM user_preferences
WHERE daily_reminders = true;
```

### Check Cron Job Logs:

```sql
SELECT 
  job_name,
  status,
  result_summary,
  error_message,
  run_at
FROM cron_job_runs
WHERE job_name = 'send_daily_prompts'
ORDER BY run_at DESC
LIMIT 5;
```

### Check Prompt Generation:

```sql
SELECT 
  user_id,
  prompt_text,
  date_generated,
  used,
  ai_provider
FROM prompts_history
WHERE date_generated >= CURRENT_DATE
ORDER BY created_at DESC;
```

---

## Test 5: Test Slack Integration (Optional)

If you want to test Slack:

### 1. Create Test Slack App

Follow instructions in `docs/DAILY_PROMPTS_QUICK_SETUP.md` Section 5.

### 2. Get Webhook URL

1. In Slack App settings → Incoming Webhooks
2. Click "Add New Webhook to Workspace"
3. Select a channel (e.g., #test)
4. Copy the webhook URL

### 3. Test Webhook Directly:

```powershell
$webhookUrl = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

curl -X POST $webhookUrl `
  -H "Content-Type: application/json" `
  -d '{"text":"Test message from Prompt & Pause"}'
```

You should see the message in your Slack channel!

### 4. Test via Cron Job:

1. Update your test user's preferences:
```sql
UPDATE user_preferences
SET 
  slack_webhook_url = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  delivery_method = 'both'
WHERE user_id = 'YOUR_USER_ID';
```

2. Run the cron test again:
```powershell
node scripts/test-cron.js
```

---

## Test 6: Test Free Tier Limits

### Verify 7/month Limit:

1. Create a new test user (free tier)
2. Manually insert 7 prompts for this month:

```sql
INSERT INTO prompts_history (user_id, prompt_text, ai_provider, ai_model, date_generated)
SELECT 
  'YOUR_TEST_USER_ID',
  'Test prompt ' || i,
  'groq',
  'llama-3.3-70b-versatile',
  CURRENT_DATE - i
FROM generate_series(0, 6) AS i;
```

3. Run cron test - user should be skipped with "reached free tier limit" message

---

## Troubleshooting

### Issue: "Unauthorized" Error

**Solution**: 
- Check `CRON_SECRET` is set correctly in `.env.local`
- Ensure no extra spaces or quotes in the secret
- Try regenerating: `openssl rand -base64 32`

### Issue: "No active users found"

**Solution**:
- Check users have `subscription_status = 'active'` in profiles table
- Verify `daily_reminders = true` in user_preferences
- Make sure user has completed onboarding

### Issue: "Failed to send email"

**Solution**:
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for any API errors
- Ensure `RESEND_FROM_EMAIL` is verified in Resend

### Issue: "Slack webhook failed"

**Solution**:
- Test webhook URL directly with curl
- Verify webhook hasn't been revoked in Slack
- Check webhook URL format: `https://hooks.slack.com/services/...`

---

## Success Criteria

Before deploying to production, verify:

- [x] Cron endpoint returns 200 OK
- [x] Authentication works with `CRON_SECRET`
- [x] User preferences are correctly read
- [x] Prompts are generated with AI
- [x] Emails are sent successfully
- [x] (Optional) Slack messages are delivered
- [x] Free tier limits are enforced
- [x] Cron executions are logged to database
- [x] No errors in console logs

---

## Next Steps

Once all tests pass:

1. **Commit and Push**:
```powershell
git add .
git commit -m "Add daily prompt system with tests"
git push origin main
```

2. **Deploy to Vercel**:
- Vercel will auto-deploy from GitHub
- Add environment variables in Vercel Dashboard
- Verify cron job appears in Vercel → Settings → Cron Jobs

3. **Monitor Production**:
- Check Vercel logs after first hour
- Query `cron_job_runs` table
- Verify users receive prompts

---

**Happy Testing! 🧪**
