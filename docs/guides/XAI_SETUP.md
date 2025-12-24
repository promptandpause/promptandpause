# xAI (Grok) API Setup Guide

**Migration**: Groq → xAI (Grok)  
**Date**: 2025-10-12  
**Status**: Required for Weekly Insights feature

## 🔄 What Changed?

Groq API has been replaced with **xAI (Elon Musk's AI company)** which provides the Grok models.

### Before (Groq):
- Used `groq-sdk` package
- Model: `llama-3.3-70b-versatile`
- Environment variable: `GROQ_API_KEY`

### After (xAI):
- Uses `openai` package (xAI is OpenAI-compatible)
- Model: `grok-2-1212` (Latest Grok model)
- Environment variable: `XAI_API_KEY`

## 🚀 Quick Setup

### 1. Get xAI API Key

1. Go to https://console.x.ai/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `xai-...`)

### 2. Update Environment Variables

Edit your `.env.local` file:

```bash
# Remove (if you have it):
# GROQ_API_KEY=gsk_...

# Add this instead:
XAI_API_KEY=xai-your-key-here

# Keep your OpenAI key as fallback:
OPENAI_API_KEY=sk-...
```

### 3. Restart Dev Server

```bash
# Stop your current server (Ctrl+C)
# Clear cache (optional but recommended)
Remove-Item -Path ".next" -Recurse -Force

# Start fresh
npm run dev
```

### 4. Test the Integration

The xAI integration will be used for:
- Weekly Insights generation (Premium feature)
- Faster and cheaper than OpenAI
- Automatic fallback to OpenAI if xAI fails

## 🧪 Testing

### Test 1: Check Logs

When a premium user requests weekly insights, you should see:

```
✅ Good: "Generating weekly insights with xAI (Grok)..."
✅ Good: "Successfully generated insights with xAI"

⚠️ Fallback: "xAI insight generation failed..."
⚠️ Fallback: "Falling back to OpenAI for insights..."
```

### Test 2: API Endpoint

```bash
# Test the weekly digest endpoint (requires authenticated request)
curl http://localhost:3000/api/premium/weekly-digest
```

### Test 3: Manual xAI Test

```powershell
# Test xAI API directly
$headers = @{
    "Authorization" = "Bearer $env:XAI_API_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    model = "grok-2-1212"
    messages = @(
        @{
            role = "user"
            content = "Say 'xAI is working!'"
        }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.x.ai/v1/chat/completions" -Method Post -Headers $headers -Body $body
```

## 📋 Migration Checklist

- [x] Removed `groq-sdk` package
- [x] Updated `weeklyInsightService.ts` to use xAI
- [x] Changed model to `grok-2-1212`
- [x] Updated error messages
- [ ] **ACTION REQUIRED**: Get xAI API key from https://console.x.ai/
- [ ] **ACTION REQUIRED**: Add `XAI_API_KEY` to `.env.local`
- [ ] **ACTION REQUIRED**: Remove `GROQ_API_KEY` from `.env.local`
- [ ] Test weekly insights generation
- [ ] Verify OpenAI fallback still works

## 🎯 Benefits of xAI (Grok)

### Advantages:
- ✅ **Active Development** - Actively maintained by xAI/Twitter
- ✅ **Latest Models** - Access to Grok 2 and upcoming models
- ✅ **OpenAI Compatible** - Uses standard OpenAI SDK
- ✅ **Good Performance** - Competitive with GPT-4
- ✅ **Cost Effective** - Cheaper than GPT-4

### Pricing (as of Oct 2025):
- Grok 2: ~$5/million tokens
- GPT-4o-mini: ~$0.15-0.60/million tokens (fallback)

## 🔧 Troubleshooting

### Issue 1: "XAI_API_KEY not configured"

**Solution**: Add the key to `.env.local`
```bash
XAI_API_KEY=xai-your-key-here
```

### Issue 2: 403 Forbidden Error

**Causes**:
1. Invalid API key
2. API key not activated
3. Network/firewall blocking x.ai

**Solution**: 
- Get a new key from https://console.x.ai/
- Check your network settings
- Verify key is active in xAI console

### Issue 3: Model Not Found

**Current Model**: `grok-2-1212`

**Alternative Models**:
- `grok-2-latest` - Always uses latest Grok 2
- `grok-beta` - Beta features (may be unstable)

**Update in** `lib/services/weeklyInsightService.ts`:
```typescript
const XAI_MODEL = 'grok-2-latest' // or your preferred model
```

### Issue 4: Insights Not Generating

**Check**:
1. Is xAI key configured?
2. Is OpenAI fallback working?
3. Check console logs for errors

**Fallback Order**:
1. xAI (Grok) - Primary
2. OpenAI (GPT-4o-mini) - Fallback
3. Basic insights - Last resort

Even if xAI fails, users still get insights via OpenAI!

## 📝 Files Modified

### Updated:
- `lib/services/weeklyInsightService.ts`
  - Removed Groq imports
  - Added xAI client (using OpenAI SDK)
  - Updated model to `grok-2-1212`
  - Updated error messages

### Removed:
- `groq-sdk` package dependency

### Created:
- `docs/guides/XAI_SETUP.md` (this file)

## 🔗 Resources

- [xAI Console](https://console.x.ai/)
- [xAI Documentation](https://docs.x.ai/)
- [xAI API Reference](https://docs.x.ai/api)
- [Grok Models](https://docs.x.ai/docs/models)

## 💡 Tips

### Tip 1: API Key Security
Never commit your `.env.local` file. It's already in `.gitignore`.

### Tip 2: Rate Limits
xAI has generous rate limits. If you hit them, the app automatically falls back to OpenAI.

### Tip 3: Model Updates
Check https://console.x.ai/ regularly for new Grok models and updates.

### Tip 4: Cost Optimization
xAI (Grok) is cheaper than GPT-4 but more expensive than GPT-4o-mini. The fallback ensures cost-effective operation:
- Try xAI first (fast, good quality)
- Fall back to OpenAI if needed (most reliable)

## ⚙️ Advanced Configuration

### Using Different xAI Endpoint

If xAI changes their API endpoint:

```typescript
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1', // Update this if changed
})
```

### Adjusting Temperature/Tokens

In `weeklyInsightService.ts`:

```typescript
const completion = await xai.chat.completions.create({
  model: XAI_MODEL,
  messages: [...],
  temperature: 0.7,    // 0.0-1.0 (creativity)
  max_tokens: 800,     // Max response length
})
```

### Disabling xAI (Use OpenAI Only)

If you want to skip xAI and use only OpenAI:

1. Don't set `XAI_API_KEY` in `.env.local`
2. The code will automatically skip xAI and use OpenAI

## 📊 Migration Status

**Status**: ✅ Code updated, awaiting API key configuration

**Next Steps**:
1. Get xAI API key from https://console.x.ai/
2. Add to `.env.local`
3. Test weekly insights
4. Monitor logs for successful xAI calls

---

**Last Updated**: 2025-10-12  
**Migration**: Groq → xAI Complete  
**Action Required**: Configure XAI_API_KEY
