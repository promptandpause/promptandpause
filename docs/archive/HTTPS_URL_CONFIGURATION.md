# HTTPS URL Configuration Guide

## Overview

All URLs throughout the Prompt & Pause application have been configured to use HTTPS for secure communication. This includes local development URLs, production URLs, and all external service integrations.

---

## Why HTTPS Everywhere?

### Security Benefits
- **Encrypted Communication**: All data transmitted between client and server is encrypted
- **Authentication**: Ensures you're connecting to the legitimate server
- **Integrity**: Prevents data tampering during transmission
- **Trust**: Modern browsers trust HTTPS and show security indicators

### Integration Requirements
- **Slack Integration**: Slack OAuth and webhook URLs **must** use HTTPS (except for localhost during development)
- **Third-party APIs**: Many services (Stripe, Resend, etc.) require HTTPS callbacks
- **Modern Browser Features**: Some features (Service Workers, PWAs) require HTTPS

---

## Configuration Locations

### 1. Service Files

All service files use HTTPS URLs with environment variable fallback:

**File**: `lib/services/emailService.ts`
```typescript
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'
```

**File**: `lib/services/emailTemplates.ts`
```typescript
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'
```

**File**: `lib/services/slackService.ts`
```typescript
url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/dashboard`
```

**File**: `lib/services/stripeService.ts`
```typescript
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'
```

### 2. Environment Variables

**File**: `.env.local` and `.env.example`
```env
# Development (with self-signed cert)
NEXT_PUBLIC_APP_URL=https://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://promptandpause.com
```

### 3. Documentation Files

All documentation has been updated to reference HTTPS URLs:

- **docs/SLACK_SETUP_GUIDE.md**: OAuth redirect URLs and interactive endpoints
- **docs/TESTING_GUIDE.md**: Cron job and email test endpoints
- All example curl commands use HTTPS

### 4. Slack Integration

**OAuth Redirect URIs** (configured in Slack App settings):
```
Development: https://localhost:3002/api/integrations/slack/oauth/callback
Production:  https://yourapp.com/api/integrations/slack/oauth/callback
```

**Interactive Endpoint**:
```
Development: https://localhost:3002/api/integrations/slack/interactive
Production:  https://yourapp.com/api/integrations/slack/interactive
```

---

## Local Development with HTTPS

### Option 1: Using Next.js with HTTPS (Recommended)

Create self-signed certificates for local development:

```powershell
# Generate self-signed certificate (PowerShell)
New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My"

# Or using OpenSSL
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

Update your `package.json` dev script:
```json
{
  "scripts": {
    "dev": "next dev --experimental-https"
  }
}
```

Or with custom certificates:
```json
{
  "scripts": {
    "dev": "node server.js"
  }
}
```

Create `server.js`:
```javascript
const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./localhost.key'),
  cert: fs.readFileSync('./localhost.crt')
}

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, (err) => {
    if (err) throw err
    console.log('> Ready on https://localhost:3000')
  })
})
```

### Option 2: Using a Reverse Proxy

Use a tool like **ngrok** or **Cloudflare Tunnel** for automatic HTTPS:

```powershell
# Using ngrok
ngrok http 3000

# Using Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3000
```

These tools provide a public HTTPS URL that proxies to your localhost.

### Option 3: Browser Self-Signed Certificate Acceptance

When using self-signed certificates:

1. Navigate to `https://localhost:3000` in your browser
2. You'll see a security warning
3. Click "Advanced" → "Proceed to localhost (unsafe)"
4. The browser will remember this exception

**Note**: This is safe for local development but never use self-signed certificates in production.

---

## Environment-Specific Configuration

### Development Environment

**.env.local**:
```env
NEXT_PUBLIC_APP_URL=https://localhost:3000

# Or with custom port
NEXT_PUBLIC_APP_URL=https://localhost:3002
```

### Staging Environment

**.env.staging** (if used):
```env
NEXT_PUBLIC_APP_URL=https://staging.promptandpause.com
```

### Production Environment

**Vercel Environment Variables**:
```env
NEXT_PUBLIC_APP_URL=https://promptandpause.com
```

---

## Slack Integration with HTTPS

### Setting Up Slack OAuth

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Select your app
3. Navigate to **OAuth & Permissions**
4. Add Redirect URLs:
   - Development: `https://localhost:3002/api/integrations/slack/oauth/callback`
   - Production: `https://promptandpause.com/api/integrations/slack/oauth/callback`

### Testing Slack OAuth Locally

#### With Self-Signed Certificate:
```powershell
# Start dev server with HTTPS
npm run dev

# Browser will show certificate warning
# Accept and proceed
```

#### With ngrok:
```powershell
# Start ngrok
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update .env.local
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Update Slack redirect URL in app settings
# Redirect URL: https://abc123.ngrok.io/api/integrations/slack/oauth/callback

# Restart server
npm run dev
```

### Interactive Endpoints

Slack's interactive components (buttons, modals) also require HTTPS:

**In Slack App Settings → Interactivity & Shortcuts**:
```
Request URL: https://localhost:3002/api/integrations/slack/interactive
```

Or for production:
```
Request URL: https://promptandpause.com/api/integrations/slack/interactive
```

---

## Troubleshooting

### Issue: "NET::ERR_CERT_AUTHORITY_INVALID" in Browser

**Cause**: Using self-signed certificate  
**Solution**: 
- Click "Advanced" and proceed (safe for localhost)
- Or add certificate to system trusted roots
- Or use ngrok/Cloudflare Tunnel for valid certificates

### Issue: Slack OAuth "redirect_uri_mismatch"

**Cause**: Redirect URI doesn't match Slack app settings  
**Solution**:
- Ensure exact match including protocol (https://)
- Check for trailing slashes
- Verify port number matches
- Update both .env.local and Slack app settings

### Issue: "Mixed Content" Warnings

**Cause**: Loading HTTP resources on HTTPS page  
**Solution**:
- All internal URLs should use HTTPS
- External resources should use HTTPS
- Check service files for hardcoded HTTP URLs

### Issue: Localhost HTTPS Not Working

**Solution Options**:
1. Use `--experimental-https` flag in Next.js dev command
2. Generate and use self-signed certificates
3. Use ngrok or similar proxy with automatic HTTPS
4. For testing only: Use `http://` in .env.local but note Slack won't work

---

## Security Best Practices

### Production Checklist

- [x] All URLs use HTTPS (no HTTP)
- [x] Valid SSL certificate installed (Let's Encrypt, Cloudflare, etc.)
- [x] HTTPS redirect configured (HTTP → HTTPS)
- [x] HSTS header enabled
- [x] Secure cookies with `Secure` flag
- [x] No mixed content warnings

### Environment Variables Security

- ✅ Never commit `.env.local` to version control
- ✅ Use different secrets for development and production
- ✅ Rotate secrets regularly
- ✅ Use Vercel's environment variable encryption
- ✅ Audit who has access to production secrets

### Slack Webhook Security

- ✅ Store webhook URLs securely in database (encrypted if possible)
- ✅ Never log webhook URLs
- ✅ Don't expose webhook URLs in API responses
- ✅ Validate webhook requests with signature verification
- ✅ Rate limit webhook calls

---

## Additional Resources

### Next.js HTTPS Development
- [Next.js HTTPS Configuration](https://nextjs.org/docs/app/api-reference/next-cli#development)
- [Experimental HTTPS Flag](https://github.com/vercel/next.js/discussions/54157)

### Slack OAuth & HTTPS
- [Slack OAuth Guide](https://api.slack.com/authentication/oauth-v2)
- [Slack Security Best Practices](https://api.slack.com/authentication/best-practices)

### SSL Certificates
- [Let's Encrypt (Free SSL)](https://letsencrypt.org/)
- [Cloudflare SSL](https://www.cloudflare.com/ssl/)
- [mkcert (Local Development)](https://github.com/FiloSottile/mkcert)

### Testing Tools
- [ngrok](https://ngrok.com/) - Secure tunnels to localhost
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [localtunnel](https://localtunnel.github.io/www/)

---

## Summary

All URLs in the Prompt & Pause application now use HTTPS by default. This ensures:

✅ **Security**: Encrypted communication for all data  
✅ **Compliance**: Meets requirements for Slack and other integrations  
✅ **Trust**: Modern browsers show secure indicators  
✅ **Compatibility**: Enables all modern web features  

For local development, use self-signed certificates, ngrok, or accept browser warnings. For production, ensure valid SSL certificates are properly configured on your hosting platform (Vercel handles this automatically).

---

**Last Updated**: 2025  
**Maintainer**: Prompt & Pause Development Team
