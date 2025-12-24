# Slack Integration Setup Guide

Complete step-by-step guide to set up Slack for Prompt & Pause.

## Understanding the Integration

Prompt & Pause uses **OAuth with Incoming Webhooks** so that:
- Each user can connect their own Slack workspace
- Users choose which channel to receive prompts in
- The app gets a unique webhook URL for each user
- No manual webhook setup required for each user

---

## Part 1: Create Your Slack App (10 minutes)

### Step 1: Create the App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Fill in:
   - **App Name**: `Prompt & Pause`
   - **Pick a workspace**: Select your development workspace
5. Click **"Create App"**

---

### Step 2: Enable Incoming Webhooks

1. In your app's settings, click **"Incoming Webhooks"** in the left sidebar (under "Features")
2. Toggle **"Activate Incoming Webhooks"** to **ON**
3. **Don't click "Add New Webhook to Workspace" yet** - this will happen automatically via OAuth

At this point, you should see:
```
Activate Incoming Webhooks: ON
No webhook URLs generated yet.
```

This is correct! The webhooks will be created when users authorize your app.

---

### Step 3: Set Up OAuth & Permissions

1. Click **"OAuth & Permissions"** in the left sidebar
2. Scroll down to **"Scopes"** section
3. Under **"Bot Token Scopes"**, click **"Add an OAuth Scope"**
4. Add: **`incoming-webhook`**

**Important**: Do NOT add a webhook URL here manually. The scope is all you need.

---

### Step 4: Add Redirect URL

Still on the "OAuth & Permissions" page:

1. Scroll to the top to **"Redirect URLs"** section
2. Click **"Add New Redirect URL"**
3. For local testing, add:
   ```
   https://localhost:3002/api/integrations/slack/oauth/callback
   ```
4. Click **"Add"**
5. For production (add this later when deployed):
   ```
   https://yourapp.com/api/integrations/slack/oauth/callback
   ```
6. Click **"Save URLs"**

---

### Step 5: Enable Interactivity (Optional but Recommended)

This allows users to interact with buttons in Slack messages:

1. Click **"Interactivity & Shortcuts"** in the left sidebar
2. Toggle **"Interactivity"** to **ON**
3. Set **"Request URL"** to:
   ```
   https://localhost:3002/api/integrations/slack/interactive
   ```
   (For production, use: `https://yourapp.com/api/integrations/slack/interactive`)
4. Click **"Save Changes"**

---

### Step 6: Get Your Credentials

1. Click **"Basic Information"** in the left sidebar
2. Scroll to **"App Credentials"** section
3. Copy these values:
   - **Client ID**: Something like `123456789.123456789`
   - **Client Secret**: Click "Show" then copy

---

## Part 2: Update Your Environment Variables

Add to your `.env.local` file:

```env
# Slack OAuth Credentials
SLACK_CLIENT_ID=123456789.123456789
SLACK_CLIENT_SECRET=abc123def456ghi789jkl
```

If your dev server is running, restart it:

```powershell
# Stop the server (Ctrl+C) then restart:
npm run dev
```

---

## Part 3: Test the OAuth Flow Locally

### Step 1: Create a "Connect Slack" Button (Testing)

Create a simple test page to initiate OAuth:

```html
<!-- Just for testing - paste this in browser console or create a test HTML file -->
<a href="https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID&scope=incoming-webhook&redirect_uri=https://localhost:3002/api/integrations/slack/oauth/callback">
  Connect Slack
</a>
```

Replace `YOUR_CLIENT_ID` with your actual Client ID.

### Step 2: Test the Flow

1. Open the URL in your browser (or click the button)
2. You'll see the Slack authorization screen:
   - "Prompt & Pause is requesting permission to access the YOUR_WORKSPACE Slack workspace"
   - It will ask you to choose a channel
3. Select a channel (e.g., #test or #general)
4. Click **"Allow"**
5. You'll be redirected to: `https://localhost:3002/api/integrations/slack/oauth/callback?code=...`
6. Your app will:
   - Exchange the code for an access token
   - Get the webhook URL for the selected channel
   - Save it to your user preferences in the database
7. You should be redirected back to `/dashboard/settings?slack_success=true`

### Step 3: Verify in Database

Check that the webhook was saved:

```sql
SELECT user_id, slack_webhook_url, delivery_method
FROM user_preferences
WHERE slack_webhook_url IS NOT NULL;
```

You should see a webhook URL like:
```
https://hooks.slack.com/services/T123ABC/B456DEF/xyz789
```

---

## Part 4: Test Sending a Message

### Test the Webhook Directly

```powershell
# Get the webhook URL from your database
$webhookUrl = "https://hooks.slack.com/services/T123ABC/B456DEF/xyz789"

# Send a test message
curl -X POST $webhookUrl `
  -H "Content-Type: application/json" `
  -d '{"text":"🎉 Test message from Prompt & Pause!"}'
```

You should see the message appear in your selected Slack channel!

### Test via the Cron Job

```powershell
# Load CRON_SECRET and run test
$env:CRON_SECRET = (Get-Content .env.local | Select-String "CRON_SECRET" | ForEach-Object { $_.ToString().Split("=")[1] })
node scripts/test-cron.js
```

If your user's `prompt_time` matches the current hour, you should receive a Slack message!

---

## Part 5: Add to Production (When Ready)

### Update Slack App Settings:

1. Go back to https://api.slack.com/apps
2. Select your "Prompt & Pause" app
3. Update **Redirect URLs** (OAuth & Permissions):
   - Add: `https://yourproductionurl.com/api/integrations/slack/oauth/callback`
   - Keep the localhost URL for testing
4. Update **Request URL** (Interactivity & Shortcuts):
   - Change to: `https://yourproductionurl.com/api/integrations/slack/interactive`
5. Click **"Save"**

### Add to Vercel Environment Variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   SLACK_CLIENT_ID=your_client_id
   SLACK_CLIENT_SECRET=your_client_secret
   ```

### Distribute Your App (Optional):

If you want other workspaces to use your app:

1. In Slack App settings, go to **"Manage Distribution"**
2. Complete the checklist
3. Click **"Distribute App"**
4. You'll get a shareable installation link

---

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch" error

**Solution**: 
- Make sure the redirect URL in your OAuth link exactly matches what's in Slack settings
- Check for trailing slashes
- Verify you're using the correct port (3002 in our case)

### Issue: No webhook URL received

**Solution**:
- Verify you added the `incoming-webhook` scope
- Check that "Incoming Webhooks" is toggled ON
- Try reauthorizing the app

### Issue: "channel_not_found" error when sending

**Solution**:
- The webhook is channel-specific
- If the channel is archived or deleted, user needs to reconnect
- Test the webhook URL directly with curl first

### Issue: Messages not appearing in Slack

**Solution**:
- Verify webhook URL is correct format: `https://hooks.slack.com/services/...`
- Check you're not rate limited (max 1 message per second per webhook)
- Test with a simple text message first

---

## How It Works

```
1. User clicks "Connect Slack" in settings
       ↓
2. Redirected to Slack authorization page
   - User chooses workspace
   - User chooses channel
   - Clicks "Allow"
       ↓
3. Slack redirects back with authorization code
   - Code sent to: /api/integrations/slack/oauth/callback
       ↓
4. Your app exchanges code for access token
   - Gets webhook URL for selected channel
   - Saves to user_preferences table
       ↓
5. Daily prompts are now sent to that channel!
```

---

## Security Notes

- ✅ Webhook URLs are user-specific and channel-specific
- ✅ No shared credentials between users
- ✅ Users can revoke access anytime in Slack settings
- ✅ OAuth flow handles all security automatically
- ⚠️ Store webhook URLs securely (already done in database)
- ⚠️ Don't log or expose webhook URLs in responses

---

## Testing Checklist

Before deploying:

- [ ] Created Slack app at api.slack.com/apps
- [ ] Enabled Incoming Webhooks (toggle ON)
- [ ] Added `incoming-webhook` scope to Bot Token Scopes
- [ ] Added redirect URL for localhost
- [ ] Enabled Interactivity with Request URL
- [ ] Copied Client ID and Secret to .env.local
- [ ] Restarted dev server
- [ ] Tested OAuth flow (click Connect Slack)
- [ ] Verified webhook URL saved in database
- [ ] Tested webhook with curl
- [ ] Received test message in Slack channel
- [ ] Tested cron job sends to Slack

---

## Next Steps

Once Slack is working locally:

1. Add "Connect Slack" button to Settings UI
2. Show connected channel in settings
3. Allow users to disconnect/reconnect
4. Deploy to production with production URLs
5. Test OAuth flow in production

---

**You're all set! 🚀**

Your users can now receive their daily prompts in Slack by simply clicking "Connect Slack" and choosing their preferred channel.
