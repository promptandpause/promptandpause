# ngrok Setup for Local Development (Port 3001)

## Quick Start

### 1. Install ngrok

**Windows (PowerShell)**:
```powershell
# Using Chocolatey
choco install ngrok

# Or download from https://ngrok.com/download
# Extract and add to PATH
```

### 2. Start Your Dev Server (HTTP)
```powershell
# Keep your existing setup - no changes needed
npm run dev
# Running on http://localhost:3001
```

### 3. Start ngrok in Another Terminal
```powershell
# Open a new PowerShell window
ngrok http 3001
```

You'll see output like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 4. Copy Your HTTPS URL

Copy the ngrok HTTPS URL (e.g., `https://abc123def456.ngrok.io`)

### 5. Update .env.local

```env
# Update this line with your ngrok URL
NEXT_PUBLIC_APP_URL=https://abc123def456.ngrok.io
```

### 6. Restart Dev Server

```powershell
# Stop your dev server (Ctrl+C)
# Start it again
npm run dev
```

### 7. Access Your App

Open your browser to: `https://abc123def456.ngrok.io`

✅ No certificate warnings!
✅ Valid HTTPS!
✅ Ready for Slack OAuth!

---

## Configure Slack App

### Update Slack App Settings

1. Go to https://api.slack.com/apps
2. Select your "Prompt & Pause" app
3. Go to **OAuth & Permissions**
4. Add Redirect URL:
   ```
   https://abc123def456.ngrok.io/api/integrations/slack/oauth/callback
   ```
   ⚠️ **Replace with YOUR actual ngrok URL**

5. Click **Save URLs**

6. Go to **Interactivity & Shortcuts**
7. Set Request URL:
   ```
   https://abc123def456.ngrok.io/api/integrations/slack/interactive
   ```

8. Click **Save Changes**

---

## Test Slack OAuth

### Method 1: Using Test Page

1. Open: `https://abc123def456.ngrok.io/test-slack-oauth.html`
2. Enter your Slack Client ID
3. Click "Generate OAuth URL"
4. Click "Connect Slack"
5. Select workspace and channel
6. Click "Allow"
7. Should redirect back with success! ✅

### Method 2: Direct URL

Build the OAuth URL manually:
```
https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID&scope=incoming-webhook&redirect_uri=https://abc123def456.ngrok.io/api/integrations/slack/oauth/callback
```

---

## ngrok Tips

### Keep Same URL Between Restarts (Paid Feature)

Free tier gives random URLs each time. To keep same URL:

```powershell
# Upgrade to paid plan, then use reserved domain
ngrok http 3001 --domain=yourapp.ngrok.app
```

### View Request Inspector

ngrok provides a web interface to inspect requests:

```
http://127.0.0.1:4040
```

Open this in your browser to see all HTTP traffic going through ngrok!

### Common ngrok Commands

```powershell
# Basic tunnel
ngrok http 3001

# With custom subdomain (paid)
ngrok http 3001 --subdomain=promptandpause

# With reserved domain (paid)
ngrok http 3001 --domain=promptandpause.ngrok.app

# With authentication
ngrok http 3001 --basic-auth="username:password"

# View help
ngrok help
```

---

## Workflow Summary

```
┌─────────────────────────────────────┐
│  Your Local Dev (HTTP)              │
│  http://localhost:3001              │
│  npm run dev                        │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  ngrok Tunnel (HTTPS)               │
│  https://abc123.ngrok.io            │
│  ngrok http 3001                    │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Internet (Public HTTPS)            │
│  - Slack can reach your app         │
│  - OAuth callbacks work             │
│  - Valid SSL certificate            │
└─────────────────────────────────────┘
```

---

## Advantages of This Setup

✅ **No code changes**: Keep using HTTP locally
✅ **No certificate setup**: ngrok provides valid SSL
✅ **Works with Slack**: Full OAuth support
✅ **Easy to use**: Just run one command
✅ **Request inspection**: See all traffic in web UI
✅ **Works with webhooks**: Slack can POST to your app

---

## Disadvantages

⚠️ **URL changes**: Free tier gives new URL each restart
⚠️ **Internet required**: ngrok needs connection
⚠️ **Speed**: Slight latency from tunnel
⚠️ **Rate limits**: Free tier has connection limits

---

## Alternative: Update to HTTPS Locally

If you prefer not to use ngrok:

### Option A: Change Port and Use HTTPS

Update your `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://localhost:3001
```

Start dev server and accept browser warning.

### Option B: Use mkcert for Valid Local Certificates

```powershell
# Install mkcert
choco install mkcert

# Create local CA
mkcert -install

# Generate certificate
mkcert localhost 127.0.0.1 ::1

# Configure Next.js to use certificate
# (see docs/HTTPS_URL_CONFIGURATION.md)
```

---

## Troubleshooting

### Issue: ngrok not found

**Solution**:
```powershell
# Check if installed
ngrok version

# If not found, install with Chocolatey
choco install ngrok

# Or download and add to PATH manually
```

### Issue: "ngrok authentication required"

**Solution**:
```powershell
# Sign up at ngrok.com (free)
# Get your auth token
# Run once:
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Issue: Slack redirect_uri_mismatch

**Solution**:
- Make sure Slack redirect URL exactly matches ngrok URL
- Include `/api/integrations/slack/oauth/callback` path
- No trailing slashes
- Use HTTPS

### Issue: ngrok URL changes every restart

**Solution**:
- Accept this with free tier, update Slack settings each time
- Or upgrade to ngrok paid plan for reserved domain
- Or switch to local HTTPS with self-signed certificate

---

## Production Deployment

When deploying to Vercel:

1. Update `.env.local` → Vercel Environment Variables:
   ```env
   NEXT_PUBLIC_APP_URL=https://promptandpause.com
   ```

2. Update Slack redirect URLs to production:
   ```
   https://promptandpause.com/api/integrations/slack/oauth/callback
   https://promptandpause.com/api/integrations/slack/interactive
   ```

3. No ngrok needed - Vercel provides HTTPS automatically!

---

## Quick Command Reference

```powershell
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3001

# Copy ngrok HTTPS URL and update .env.local
# Restart Terminal 1 (Ctrl+C, then npm run dev)

# Update Slack app settings with ngrok URL
# Test OAuth flow!
```

---

**Last Updated**: 2025  
**For**: Prompt & Pause Local Development on Port 3001
