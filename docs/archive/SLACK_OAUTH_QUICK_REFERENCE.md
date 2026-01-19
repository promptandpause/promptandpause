# Slack OAuth Quick Reference

**For Prompt & Pause Slack Integration**

---

## 🚀 Quick Setup (5 Minutes)

### 1. Create Slack App
```
URL: https://api.slack.com/apps
Click: "Create New App" → "From scratch"
Name: "Prompt & Pause"
```

### 2. Enable Incoming Webhooks
```
Sidebar: "Incoming Webhooks"
Toggle: "Activate Incoming Webhooks" → ON
(Don't add webhook manually - OAuth does this automatically)
```

### 3. Add OAuth Scope
```
Sidebar: "OAuth & Permissions"
Scroll to: "Bot Token Scopes"
Add scope: "incoming-webhook"
```

### 4. Add Redirect URL
```
Still in "OAuth & Permissions"
Section: "Redirect URLs"
Add: https://localhost:3002/api/integrations/slack/oauth/callback
(or your production URL)
Click: "Save URLs"
```

### 5. Enable Interactivity (Optional)
```
Sidebar: "Interactivity & Shortcuts"
Toggle: "Interactivity" → ON
Request URL: https://localhost:3002/api/integrations/slack/interactive
Click: "Save Changes"
```

### 6. Get Credentials
```
Sidebar: "Basic Information"
Section: "App Credentials"
Copy: Client ID and Client Secret
```

### 7. Update Environment
```env
# Add to .env.local
SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
```

---

## 🧪 Test Locally

### Option 1: Accept Browser Warning (Easiest)
```powershell
# Update .env.local
NEXT_PUBLIC_APP_URL=https://localhost:3000

# Start server
npm run dev

# Open browser to https://localhost:3000
# Accept certificate warning (Advanced → Proceed)
```

### Option 2: Use ngrok (No Warnings)
```powershell
# Start dev server
npm run dev

# In new terminal
ngrok http 3000

# Copy ngrok HTTPS URL (e.g., https://abc123.ngrok.io)

# Update .env.local
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Update Slack redirect URL to:
# https://abc123.ngrok.io/api/integrations/slack/oauth/callback

# Restart server
npm run dev
```

### Test OAuth Flow
```
1. Open: public/test-slack-oauth.html in browser
2. Enter your Client ID
3. Click "Generate OAuth URL"
4. Click "Connect Slack"
5. Choose workspace and channel
6. Click "Allow"
7. Should redirect back with success
```

---

## 📋 Configuration Checklist

### Slack App Settings

- [ ] Incoming Webhooks: ON
- [ ] Scope: `incoming-webhook` added
- [ ] Redirect URL: `https://localhost:3002/api/integrations/slack/oauth/callback` (or production URL)
- [ ] Interactivity: ON (optional)
- [ ] Interactive URL: `https://localhost:3002/api/integrations/slack/interactive` (if enabled)
- [ ] Client ID: Copied to .env.local
- [ ] Client Secret: Copied to .env.local

### Environment Variables

- [ ] `SLACK_CLIENT_ID` set
- [ ] `SLACK_CLIENT_SECRET` set
- [ ] `NEXT_PUBLIC_APP_URL` uses HTTPS

### Local Development

- [ ] Using HTTPS (ngrok, self-signed cert, or browser exception)
- [ ] Dev server running
- [ ] Can access app via HTTPS

---

## 🔗 Important URLs

### Slack Configuration
- **App Management**: https://api.slack.com/apps
- **OAuth Guide**: https://api.slack.com/authentication/oauth-v2

### Your App URLs (Development)
- **Dashboard**: https://localhost:3000/dashboard
- **Settings**: https://localhost:3000/dashboard/settings
- **OAuth Callback**: https://localhost:3002/api/integrations/slack/oauth/callback
- **Interactive Endpoint**: https://localhost:3002/api/integrations/slack/interactive
- **Test Page**: https://localhost:3000/test-slack-oauth.html

### Your App URLs (Production)
- **OAuth Callback**: https://promptandpause.com/api/integrations/slack/oauth/callback
- **Interactive Endpoint**: https://promptandpause.com/api/integrations/slack/interactive

---

## ⚠️ Common Issues

### "redirect_uri_mismatch"
- ✅ Verify exact URL match in Slack settings (including https://)
- ✅ Check for trailing slashes
- ✅ Ensure port matches (3002 not 3000)

### "channel_not_found"
- ✅ Webhook is channel-specific
- ✅ Channel may be archived or deleted
- ✅ User needs to reconnect if channel changed

### "Invalid client credentials"
- ✅ Check Client ID and Secret are correct
- ✅ No extra spaces in .env.local
- ✅ Restart server after changing .env.local

### Can't access localhost with HTTPS
- ✅ Accept browser warning (safe for localhost)
- ✅ Or use ngrok for valid certificate
- ✅ Or generate self-signed certificate with mkcert

---

## 🎯 OAuth Flow Diagram

```
User clicks "Connect Slack"
    ↓
Redirect to Slack authorization
(https://slack.com/oauth/v2/authorize?client_id=...&redirect_uri=...)
    ↓
User selects workspace & channel
    ↓
Slack redirects back with code
(https://yourapp.com/api/integrations/slack/oauth/callback?code=...)
    ↓
App exchanges code for access token + webhook URL
    ↓
Webhook URL saved to database
    ↓
Success! Prompts will be sent to selected channel
```

---

## 🔐 Security Notes

- ✅ Webhook URLs are channel-specific (one per user/channel)
- ✅ OAuth handles security automatically
- ✅ Store webhook URLs securely in database
- ✅ Never log or expose webhook URLs
- ✅ Users can revoke access in Slack settings anytime

---

## 📚 Full Documentation

For detailed guides, see:
- `docs/SLACK_SETUP_GUIDE.md` - Complete step-by-step setup
- `docs/HTTPS_URL_CONFIGURATION.md` - HTTPS configuration guide
- `docs/TESTING_GUIDE.md` - Testing procedures

---

## 🆘 Need Help?

1. Check troubleshooting section above
2. Review full setup guide: `docs/SLACK_SETUP_GUIDE.md`
3. Test with provided HTML test page: `public/test-slack-oauth.html`
4. Verify Slack app configuration at https://api.slack.com/apps

---

**Quick Reference v1.0** | Updated: 2025
