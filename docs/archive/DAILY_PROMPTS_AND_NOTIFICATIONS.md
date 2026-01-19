# Daily Prompts & Notification System

Complete documentation for the automated daily prompt delivery system including email and Slack notifications.

## Overview

Prompt & Pause automatically generates and delivers personalized AI prompts to users at their preferred time via email and/or Slack. The system respects user preferences, subscription tiers, and delivery methods.

---

## Architecture

### Components

1. **Cron Job** (`/api/cron/send-daily-prompts`)
   - Runs every hour via Vercel Cron
   - Checks which users should receive prompts
   - Generates personalized prompts using AI
   - Sends prompts via email and/or Slack
   - Respects free vs premium user limits

2. **Email Service** (`lib/services/emailService.ts`)
   - Sends branded prompt emails via Resend
   - Includes personalized prompt text
   - Links to dashboard for reflection

3. **Slack Service** (`lib/services/slackService.ts`)
   - Sends interactive Slack messages
   - Uses Slack Block Kit for rich formatting
   - Includes "Reflect Now" button

4. **User Preferences** (Database: `user_preferences` table)
   - `daily_reminders`: Enable/disable prompt delivery
   - `prompt_time`: Time to receive prompts (HH:MM format)
   - `delivery_method`: 'email', 'slack', or 'both'
   - `slack_webhook_url`: User's Slack webhook URL
   - `prompt_frequency`: How often to send prompts

---

## How It Works

### Daily Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Vercel Cron triggers /api/cron/send-daily-prompts every hour │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. Fetch all active users with daily_reminders enabled          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. For each user:                                               │
│     • Check if prompt_time matches current hour                  │
│     • Check if they haven't completed today's prompt             │
│     • Verify they haven't exceeded free tier limits (7/month)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. Generate or retrieve today's AI prompt                       │
│     • Uses user's focus areas and recent reflection history      │
│     • Saves to prompts_history table                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. Deliver prompt based on delivery_method preference:          │
│     • Email only → Send via Resend                               │
│     • Slack only → Send via Slack webhook                        │
│     • Both → Send via both channels                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. Log execution results to cron_job_runs table                 │
└─────────────────────────────────────────────────────────────────┘
```

### Prompt Generation Logic

1. **Check Existing Prompt**: If user already has a prompt for today, use it
2. **Fetch Context**:
   - User's focus areas from preferences
   - Last 7 days of mood data
   - Top 5 topics from last 30 days of reflections
   - User's original reason for joining
3. **Generate with AI**: Call `generatePrompt()` with context
4. **Save to Database**: Store in `prompts_history` table

### Free vs Premium Limits

| Tier | Monthly Prompts | Daily Reminders | Slack Integration |
|------|-----------------|-----------------|-------------------|
| **Free** | 7 prompts/month | ✅ Yes | ✅ Yes |
| **Premium** | ∞ Unlimited | ✅ Yes | ✅ Yes |
| **Gift Trial** | ∞ Unlimited | ✅ Yes | ✅ Yes |

The cron job enforces these limits by counting prompts generated per month.

---

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file and Vercel project settings:

```env
# Cron Job Security
CRON_SECRET=your_secure_random_string_here

# Slack OAuth (if using Slack integration)
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Resend (for emails)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourapp.com

# App URL
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### 2. Vercel Cron Configuration

The `vercel.json` file is already configured:

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

This runs the job **every hour at minute 0**.

> ⚠️ **Security Note**: Vercel automatically includes the `CRON_SECRET` in the Authorization header when calling cron endpoints.

### 3. Slack App Setup (Optional)

To enable Slack integration:

1. **Create Slack App**:
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name it "Prompt & Pause" and select your workspace

2. **Configure OAuth & Permissions**:
   - Add these scopes under "Bot Token Scopes":
     - `incoming-webhook` (to send messages)
   - Under "Redirect URLs", add:
     ```
     https://yourapp.com/api/integrations/slack/oauth/callback
     ```

3. **Enable Incoming Webhooks**:
   - In your Slack app settings, navigate to "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to ON

4. **Interactive Components** (for reflection modal):
   - Navigate to "Interactivity & Shortcuts"
   - Toggle "Interactivity" to ON
   - Set Request URL to:
     ```
     https://yourapp.com/api/integrations/slack/interactive
     ```

5. **Get Credentials**:
   - Copy "Client ID" and "Client Secret" from "Basic Information"
   - Add to your environment variables

### 4. Database Schema

Ensure these tables exist in Supabase:

**user_preferences**:
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_time TEXT DEFAULT '09:00',
  prompt_frequency TEXT DEFAULT 'daily',
  delivery_method TEXT DEFAULT 'email' CHECK (delivery_method IN ('email', 'slack', 'both')),
  slack_webhook_url TEXT,
  daily_reminders BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  focus_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**prompts_history**:
```sql
CREATE TABLE prompts_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  personalization_context JSONB,
  date_generated DATE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date_generated)
);
```

**cron_job_runs**:
```sql
CREATE TABLE cron_job_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  result_summary JSONB,
  error_message TEXT,
  run_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## User Settings UI

The settings page allows users to control:

1. **Daily Reminders Toggle**
   - Enables/disables all prompt delivery
   - Located in Notifications section

2. **Reminder Time**
   - Time picker for when to receive prompts
   - Format: HH:MM (24-hour)
   - Used by cron job to determine delivery time

3. **Prompt Frequency**
   - Daily, weekdays only, custom schedule, etc.
   - Determines which days prompts are sent

4. **Delivery Method**
   - Email only
   - Slack only
   - Both email and Slack

5. **Connect Slack Button**
   - Initiates OAuth flow
   - Saves webhook URL to preferences
   - Tests connection with welcome message

---

## API Endpoints

### Cron Job

**POST** `/api/cron/send-daily-prompts`

Headers:
```
Authorization: Bearer {CRON_SECRET}
```

Response:
```json
{
  "success": true,
  "message": "Daily prompts sent successfully",
  "sent": 15,
  "skipped": 8,
  "results": [...]
}
```

### Slack OAuth Callback

**GET** `/api/integrations/slack/oauth/callback?code=...&state=...`

Handles Slack OAuth redirect and saves webhook URL.

### Slack Interactive Endpoint

**POST** `/api/integrations/slack/interactive`

Receives interactive messages from Slack (button clicks, modals).

---

## Testing

### Test Cron Job Manually

```bash
curl -X POST https://yourapp.com/api/cron/send-daily-prompts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Slack Webhook

```javascript
// In dashboard or settings
const result = await fetch('/api/premium/test-slack', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
```

### Test Email Delivery

```javascript
const result = await fetch('/api/emails/send-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Test prompt text"
  })
})
```

---

## Monitoring

### Check Cron Job Logs

Query the `cron_job_runs` table:

```sql
SELECT * FROM cron_job_runs 
WHERE job_name = 'send_daily_prompts'
ORDER BY run_at DESC
LIMIT 10;
```

### Email Delivery Logs

Query the `email_delivery_log` table:

```sql
SELECT * FROM email_delivery_log
WHERE email_type = 'daily_prompt'
ORDER BY sent_at DESC
LIMIT 10;
```

### Vercel Logs

- Go to Vercel Dashboard → Your Project → Logs
- Filter by `/api/cron/send-daily-prompts`
- Look for console.log output showing sent/skipped counts

---

## Troubleshooting

### Users Not Receiving Prompts

1. **Check daily_reminders setting**:
   ```sql
   SELECT user_id, daily_reminders, prompt_time 
   FROM user_preferences 
   WHERE user_id = 'USER_ID';
   ```

2. **Check if prompt already generated today**:
   ```sql
   SELECT * FROM prompts_history 
   WHERE user_id = 'USER_ID' 
   AND date_generated = CURRENT_DATE;
   ```

3. **Check free tier limit**:
   ```sql
   SELECT COUNT(*) FROM prompts_history 
   WHERE user_id = 'USER_ID' 
   AND date_generated >= DATE_TRUNC('month', CURRENT_DATE);
   ```

4. **Check cron job execution**:
   ```sql
   SELECT * FROM cron_job_runs 
   WHERE job_name = 'send_daily_prompts'
   ORDER BY run_at DESC LIMIT 1;
   ```

### Slack Messages Not Sending

1. **Verify webhook URL saved**:
   ```sql
   SELECT slack_webhook_url FROM user_preferences 
   WHERE user_id = 'USER_ID';
   ```

2. **Check delivery method**:
   ```sql
   SELECT delivery_method FROM user_preferences 
   WHERE user_id = 'USER_ID';
   ```
   Should be 'slack' or 'both'

3. **Test webhook manually**:
   ```bash
   curl -X POST WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}'
   ```

### Cron Job Not Running

1. **Check Vercel deployment**: Cron jobs only work on production (not preview)
2. **Verify vercel.json** is committed to repo
3. **Check Vercel dashboard**: Settings → Cron Jobs
4. **Verify CRON_SECRET** is set in Vercel environment variables

---

## Future Enhancements

- [ ] Timezone-aware prompt scheduling (currently uses UTC)
- [ ] Slack user ID mapping for saving reflections from Slack
- [ ] SMS/WhatsApp delivery method
- [ ] Push notifications for mobile apps
- [ ] A/B testing different prompt styles
- [ ] Prompt effectiveness tracking (completion rates)
- [ ] Slack slash commands for on-demand prompts
- [ ] Email bounce handling and retry logic

---

## Related Documentation

- [Email Branding Documentation](./EMAIL_BRANDING_DOCUMENTATION.md)
- [Supabase Auth Email Templates](./SUPABASE_AUTH_EMAIL_TEMPLATES.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Last Updated**: December 2024
**Version**: 1.0.0
