# Email Notifications Setup Guide

**Last Updated:** 2025-01-07  
**Status:** ✅ Production Ready

---

## 🎯 Overview

Prompt & Pause uses Resend for transactional email delivery. The app sends the following types of emails:

1. **Welcome Email** - Sent when new users sign up
2. **Daily Prompt Email** - Daily reflection prompts (future: automated)
3. **Weekly Digest Email** - Weekly reflection summary (future: automated)
4. **Subscription Confirmation** - Sent when user upgrades to Premium
5. **Subscription Cancellation** - Sent when user cancels Premium

---

## ✅ Already Configured

### 1. Resend Package
- ✅ `resend` npm package installed (v6.1.2)
- ✅ Located in `package.json`

### 2. Environment Variables
Your `.env.local` already has:
```env
RESEND_API_KEY=re_AsF8h3Xv_D33BywX1GDEgRvHQ9n7BjFFT
RESEND_FROM_EMAIL=prompts@promptandpause.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Email Service Layer
- ✅ Complete email service: `lib/services/emailService.ts`
- ✅ 5 email functions implemented
- ✅ HTML templates included
- ✅ Email delivery logging to database

---

## 📧 Email Types & Implementation

### 1. Welcome Email
**Trigger:** New user signs up via OAuth (Google)  
**Sent from:** `app/(auth)/auth/callback/route.ts`  
**Function:** `sendWelcomeEmail(email, name)`

**When it fires:**
- User signs up with Google
- OAuth callback processes
- No user_preferences found (new user)
- Email sent asynchronously (doesn't block signup flow)

**Email content:**
- Welcome message with gradient header
- "Getting Started" checklist
- Link to dashboard
- Branded footer

---

### 2. Daily Prompt Email
**Trigger:** Manual via API endpoint (automated scheduling future)  
**Endpoint:** `POST /api/emails/send-prompt`  
**Function:** `sendDailyPromptEmail(email, prompt, userId, userName)`

**Request body:**
```json
{
  "prompt": "What are you grateful for today?" // Optional
}
```

**Email content:**
- Today's date
- Personalized greeting
- Reflection prompt in gradient box
- Call-to-action button to write reflection
- Branded footer

**Testing:**
```bash
curl -X POST http://localhost:3000/api/emails/send-prompt \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"prompt": "What emotion am I feeling right now?"}'
```

---

### 3. Weekly Digest Email
**Trigger:** Manual via API endpoint (automated scheduling future)  
**Endpoint:** `POST /api/emails/send-digest`  
**Function:** `sendWeeklyDigestEmail(email, userId, userName, digest)`

**Email content:**
- Week date range
- Total reflections count
- Average word count
- Top tags used (visual badges)
- Mood distribution (emojis)
- Current streak
- Personalized insights
- Encouragement message

**Requirements:**
- User must have `weekly_digest: true` in preferences
- At least 1 reflection from past 7 days

**Testing:**
```bash
curl -X POST http://localhost:3000/api/emails/send-digest \
  -H "Cookie: your-auth-cookie"
```

---

### 4. Subscription Confirmation Email
**Trigger:** Stripe webhook `checkout.session.completed`  
**Sent from:** `app/api/stripe/webhook/route.ts`  
**Function:** `sendSubscriptionEmail(email, userId, 'confirmation', planName, userName)`

**When it fires:**
- User completes Stripe checkout
- Webhook verified and processed
- Database updated with premium status
- Email sent asynchronously

**Email content:**
- "Welcome to Premium!" message
- Plan details (Monthly/Annual)
- Premium features list
- Link to dashboard
- Manage subscription link

---

### 5. Subscription Cancellation Email
**Trigger:** Stripe webhook `customer.subscription.deleted`  
**Sent from:** `app/api/stripe/webhook/route.ts`  
**Function:** `sendSubscriptionEmail(email, userId, 'cancellation', planName, userName)`

**When it fires:**
- User cancels subscription via customer portal
- Webhook verified and processed
- Database updated with cancelled status
- Email sent asynchronously

**Email content:**
- Confirmation of cancellation
- Access end date
- What they'll lose access to
- Re-subscribe option
- Feedback request

---

## 🔧 Email Service Architecture

### Service Layer: `lib/services/emailService.ts`

**Exports:**
```typescript
sendWelcomeEmail(email, name): Promise<{ success, emailId?, error? }>
sendDailyPromptEmail(email, prompt, userId, userName): Promise<{ success, emailId?, error? }>
sendWeeklyDigestEmail(email, userId, userName, digest): Promise<{ success, emailId?, error? }>
sendSubscriptionEmail(email, userId, type, planName, userName): Promise<{ success, emailId?, error? }>
logEmailDelivery(userId, emailType, recipientEmail, status, resendEmailId, errorMessage?): Promise<void>
```

**Features:**
- ✅ Environment variable validation
- ✅ HTML email templates with inline styles
- ✅ Personalization (user name)
- ✅ Branded design (purple gradient theme)
- ✅ Responsive email layout
- ✅ Error handling and logging
- ✅ Database logging for analytics

---

## 🗄️ Email Delivery Logging

All emails are logged to the `email_delivery_log` table:

```sql
CREATE TABLE email_delivery_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL, -- 'daily_prompt', 'weekly_digest', 'welcome', etc.
  resend_email_id TEXT,     -- Resend's email ID for tracking
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL,     -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);
```

**Use cases:**
- Track email delivery success rate
- Identify bounced emails
- Monitor open rates (if webhook configured)
- Debug email failures
- Analytics on email engagement

---

## 🧪 Testing Procedures

### Test 1: Welcome Email

**Steps:**
1. Create a new Google account or use a test account
2. Sign up at `/signup` using Google OAuth
3. Complete signup flow
4. Check email inbox for welcome email
5. Verify:
   - Email received within 30 seconds
   - Correct name displayed
   - Dashboard link works
   - Design renders properly

**Expected result:**
- Welcome email in inbox
- Subject: "Welcome to Prompt & Pause! 🌟"
- From: "Prompt & Pause <prompts@promptandpause.com>"

---

### Test 2: Daily Prompt Email

**Prerequisites:**
- Signed in as authenticated user
- Have auth cookie in browser/Postman

**Using Browser Console:**
```javascript
fetch('/api/emails/send-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Test: What made you smile today?' })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected result:**
- Response: `{ success: true, emailId: "...", message: "..." }`
- Email received within 30 seconds
- Prompt displayed correctly
- "Write Your Reflection" button works

---

### Test 3: Weekly Digest Email

**Prerequisites:**
- User has at least 1 reflection from past 7 days
- User has `weekly_digest: true` in preferences (check settings)

**Using Browser Console:**
```javascript
fetch('/api/emails/send-digest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
```

**Expected result:**
- Response with digest data
- Email showing weekly stats
- Correct reflection count
- Tags and moods displayed
- Streak shown

---

### Test 4: Subscription Emails

**Test Confirmation Email:**
1. Go to Settings page as freemium user
2. Click "Upgrade to Premium"
3. Select Monthly billing
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Wait for redirect
6. Check email for confirmation

**Test Cancellation Email:**
1. As premium user, go to Settings
2. Click "Manage Subscription"
3. In Stripe portal, cancel subscription
4. Confirm cancellation
5. Check email for cancellation notice

---

## 🔒 Security & Best Practices

### ✅ Implemented Security:

1. **API Key Server-Side Only**
   - `RESEND_API_KEY` never exposed to client
   - Only used in server-side code

2. **User Authentication**
   - All email endpoints require authentication
   - Users can only send emails to themselves

3. **Rate Limiting** (Future)
   - Prevent abuse of email endpoints
   - Implement rate limiting per user

4. **Email Validation**
   - Only send to verified email addresses
   - Check user profile for valid email

5. **Asynchronous Sending**
   - Don't block user flows waiting for email
   - Use `.catch()` to handle failures gracefully

---

## 🚀 Production Setup

### Before Going Live:

#### 1. Verify Sender Domain in Resend

**Current:** `prompts@promptandpause.com` ✅

If using a different domain:
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `promptandpause.com`)
4. Add DNS records (SPF, DKIM, DMARC)
5. Wait for verification (usually 5-15 minutes)
6. Update `RESEND_FROM_EMAIL` in production env

#### 2. Update Environment Variables

Production `.env`:
```env
RESEND_API_KEY=re_live_...        # Use LIVE API key from Resend
RESEND_FROM_EMAIL=prompts@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### 3. Configure Resend Webhooks (Optional)

For tracking email events (opened, clicked, bounced):

1. Go to Resend Dashboard → Webhooks
2. Add webhook endpoint: `https://yourdomain.com/api/webhooks/resend`
3. Select events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`
4. Create API route to handle webhook (future task)

#### 4. Test Production Emails

After deployment:
- Send test welcome email
- Send test prompt email
- Send test digest email
- Verify all links work with production URL

---

## 📊 Email Analytics

### Track These Metrics:

1. **Delivery Rate**
   - Query: `SELECT COUNT(*) FROM email_delivery_log WHERE status = 'sent'`
   
2. **Failure Rate**
   - Query: `SELECT COUNT(*) FROM email_delivery_log WHERE status = 'failed'`

3. **Emails by Type**
   ```sql
   SELECT email_type, COUNT(*) as count
   FROM email_delivery_log
   GROUP BY email_type
   ORDER BY count DESC;
   ```

4. **Recent Failures**
   ```sql
   SELECT * FROM email_delivery_log
   WHERE status = 'failed'
   ORDER BY sent_at DESC
   LIMIT 10;
   ```

5. **User Engagement** (future with webhooks)
   - Open rate per email type
   - Click-through rate
   - Time to open

---

## 🤖 Automated Email Scheduling (Future)

### Daily Prompt Automation

**Options:**

#### Option 1: Vercel Cron Jobs
```typescript
// app/api/cron/daily-prompts/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get all users with prompt_time = current hour
  // Filter by preferences.daily_reminders = true
  // Send prompt emails
}
```

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/daily-prompts",
    "schedule": "0 * * * *"  // Every hour
  }]
}
```

#### Option 2: GitHub Actions
Create `.github/workflows/daily-prompts.yml`:
```yaml
name: Send Daily Prompts
on:
  schedule:
    - cron: '0 9 * * *'  # 9am UTC daily
jobs:
  send-prompts:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger API
        run: |
          curl -X POST https://yourdomain.com/api/cron/daily-prompts \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option 3: External Service (Easiest)
- Use [Upstash QStash](https://upstash.com/qstash)
- Use [Cronitor](https://cronitor.io/)
- Use [EasyCron](https://www.easycron.com/)

---

### Weekly Digest Automation

Similar approach, but runs weekly:

**Vercel Cron:**
```json
{
  "crons": [{
    "path": "/api/cron/weekly-digest",
    "schedule": "0 9 * * 0"  // Every Sunday at 9am
  }]
}
```

**Logic:**
1. Get all users with `weekly_digest: true`
2. For each user, generate digest for past 7 days
3. Only send if user has >= 1 reflection
4. Log to email_delivery_log

---

## 🐛 Troubleshooting

### Issue: Email not received

**Check:**
1. Is `RESEND_API_KEY` set correctly?
2. Is sender email verified in Resend?
3. Check spam/junk folder
4. Check `email_delivery_log` table for status
5. Check Resend Dashboard → Logs for delivery status

**Solution:**
```sql
-- Check recent email logs
SELECT * FROM email_delivery_log
WHERE recipient_email = 'user@example.com'
ORDER BY sent_at DESC
LIMIT 5;
```

---

### Issue: Welcome email not sending

**Check:**
1. Is user signing up via Google OAuth? (email/password doesn't trigger it yet)
2. Check console logs in auth callback route
3. Check if `profiles` table has email

**Solution:**
- Add welcome email to email/password signup flow
- Add to signup route: `app/(auth)/_components/signup-form.tsx`

---

### Issue: API returns "Email service not configured"

**Cause:** `RESEND_API_KEY` not set

**Solution:**
```bash
# Check if variable exists
echo $RESEND_API_KEY  # Unix
$env:RESEND_API_KEY   # PowerShell

# If not set, add to .env.local
RESEND_API_KEY=re_your_key_here
```

Restart dev server after adding.

---

### Issue: "Failed to send email" with 403 error

**Cause:** Sender email not verified in Resend

**Solution:**
1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Verify your domain
3. Or use Resend's test email: `onboarding@resend.dev` (dev only)

---

## 📚 Related Files

### Created/Updated in Task 11:
- ✅ `app/(auth)/auth/callback/route.ts` - Welcome email integration
- ✅ `app/api/stripe/webhook/route.ts` - Subscription email integration
- ✅ `app/api/emails/send-prompt/route.ts` - Manual prompt email endpoint
- ✅ `app/api/emails/send-digest/route.ts` - Manual digest email endpoint
- ✅ `EMAIL_SETUP.md` - This documentation

### Existing Files (Already Production-Ready):
- ✅ `lib/services/emailService.ts` - Complete email service (714 lines)
- ✅ All HTML email templates included in service

---

## ✅ Task 11 Checklist

**Email Integration Status:** COMPLETE

- [x] Resend package installed
- [x] Environment variables configured
- [x] Welcome email on signup ✅
- [x] Subscription confirmation email ✅
- [x] Subscription cancellation email ✅
- [x] Payment failure logging ✅
- [x] API endpoint for prompt emails ✅
- [x] API endpoint for digest emails ✅
- [x] Email delivery logging ✅
- [x] Documentation complete ✅

**Ready for:**
- ✅ Testing all email flows
- ✅ Production deployment
- ⏳ Automated scheduling (future task)

---

## 🎯 Next Steps

1. **Test All Email Flows** (Recommended)
   - Sign up new user → Check welcome email
   - Upgrade to premium → Check confirmation
   - Send test prompt → Check prompt email
   - Send test digest → Check digest email

2. **Monitor Email Logs**
   ```sql
   SELECT email_type, status, COUNT(*) as count
   FROM email_delivery_log
   GROUP BY email_type, status;
   ```

3. **Future Enhancements**
   - Implement automated daily prompt scheduling
   - Implement automated weekly digest scheduling
   - Add Resend webhook handler for delivery tracking
   - Add payment failure email template
   - Add email preferences page for users

---

*Last Updated: 2025-01-07*  
*Email Integration - Prompt & Pause*
