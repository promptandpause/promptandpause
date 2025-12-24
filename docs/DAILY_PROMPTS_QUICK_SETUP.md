# Quick Setup Guide: Daily Prompts & Notifications

This guide will get your daily prompt system up and running in 15 minutes.

## Prerequisites

- [ ] Vercel account with project deployed
- [ ] Supabase project configured
- [ ] Resend API key for emails
- [ ] (Optional) Slack workspace for Slack integration

---

## Step 1: Environment Variables (5 min)

Add these to your Vercel project → Settings → Environment Variables:

```env
# Required
CRON_SECRET=generate_random_32_char_string
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourapp.com
NEXT_PUBLIC_APP_URL=https://yourapp.com

# Optional - For Slack
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
```

💡 **Generate CRON_SECRET**: 
```bash
openssl rand -base64 32
```

---

## Step 2: Deploy to Vercel (2 min)

1. Commit and push changes:
```bash
git add .
git commit -m "Add daily prompt system with cron job"
git push origin main
```

2. Vercel will automatically detect `vercel.json` and set up the cron job

3. Verify in Vercel Dashboard → Your Project → Settings → Cron Jobs
   - You should see: `/api/cron/send-daily-prompts` running every hour

---

## Step 3: Test the System (3 min)

### Test Cron Job Manually

```bash
curl -X POST https://yourapp.com/api/cron/send-daily-prompts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Daily prompts sent successfully",
  "sent": 0,
  "skipped": 0
}
```

### Test Email Sending

1. Log in to your dashboard
2. Go to Settings
3. Enable "Daily Reminders"
4. Set Reminder Time to the next hour
5. Wait for the cron job to run (or trigger manually)

---

## Step 4: Monitor (2 min)

### Check Cron Job Execution

In Supabase SQL Editor:

```sql
SELECT * FROM cron_job_runs 
WHERE job_name = 'send_daily_prompts'
ORDER BY run_at DESC
LIMIT 5;
```

### Check Email Delivery

```sql
SELECT * FROM email_delivery_log
WHERE email_type = 'daily_prompt'
ORDER BY sent_at DESC
LIMIT 5;
```

---

## Step 5: (Optional) Enable Slack Integration (5 min)

### Create Slack App

1. Go to https://api.slack.com/apps → "Create New App"
2. Choose "From scratch"
3. Name it "Prompt & Pause", select your workspace

### Configure App

1. **OAuth & Permissions** → Add scope: `incoming-webhook`
2. **OAuth & Permissions** → Add Redirect URL:
   ```
   https://yourapp.com/api/integrations/slack/oauth/callback
   ```
3. **Incoming Webhooks** → Toggle ON
4. **Interactivity & Shortcuts** → Toggle ON → Set Request URL:
   ```
   https://yourapp.com/api/integrations/slack/interactive
   ```

### Get Credentials

1. Go to **Basic Information**
2. Copy **Client ID** and **Client Secret**
3. Add to Vercel environment variables:
   ```
   SLACK_CLIENT_ID=xxx
   SLACK_CLIENT_SECRET=xxx
   ```

### Connect Your Workspace

1. Go to your app Settings page
2. Click "Connect Slack" button
3. Authorize the app
4. You should receive a test message in Slack!

---

## Verification Checklist

- [ ] Cron job appears in Vercel Dashboard → Cron Jobs
- [ ] Manual cron trigger returns success
- [ ] `cron_job_runs` table has entries
- [ ] Test user receives email at scheduled time
- [ ] (If Slack) Test user receives Slack message
- [ ] Vercel logs show cron execution output

---

## Common Issues

### "Cron job not found in Vercel"
✅ **Solution**: Make sure `vercel.json` is committed and deployed. Redeploy if needed.

### "Users not receiving prompts"
✅ **Solution**: Check:
1. User has `daily_reminders: true` in `user_preferences`
2. User's `prompt_time` matches current UTC hour
3. User hasn't reached free tier limit (7/month)

### "Unauthorized error on cron trigger"
✅ **Solution**: Ensure `CRON_SECRET` matches in Vercel and your test curl command

### "Slack not working"
✅ **Solution**: 
1. Verify `slack_webhook_url` is saved in database
2. Check `delivery_method` is 'slack' or 'both'
3. Test webhook URL manually with curl

---

## Next Steps

1. **Monitor for 24 hours** to ensure cron runs smoothly
2. **Add more users** and test with different timezones
3. **Review logs** to optimize prompt generation
4. **Collect feedback** on prompt quality and timing

---

## Support

If you run into issues:

1. Check logs in Vercel Dashboard → Logs
2. Query `cron_job_runs` table for errors
3. Test individual components (email, Slack, prompt generation)
4. Review [Full Documentation](./DAILY_PROMPTS_AND_NOTIFICATIONS.md)

---

**Ready to launch! 🚀**

Your users will start receiving personalized daily prompts at their chosen time, helping them build a consistent reflection habit.
