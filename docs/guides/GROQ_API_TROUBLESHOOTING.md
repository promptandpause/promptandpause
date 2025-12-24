# Groq API Troubleshooting Guide

**Issue**: Groq API returning 403 "Access denied" error  
**Date**: 2025-10-12  
**Status**: Investigating

## Error Details

```
Groq API error: Error: 403 {"error":{"message":"Access denied. Please check your network settings."}}
```

## Possible Causes

### 1. Invalid or Expired API Key ⚠️ (Most Likely)

**Check**: Verify your Groq API key is valid and active

```bash
# Check if key is set (don't print the actual value)
$env:GROQ_API_KEY.Length  # Should be > 0
```

**Fix**: Get a new API key from https://console.groq.com/keys

```bash
# Update your .env.local file
GROQ_API_KEY=your-new-key-here
```

### 2. Model Name Changed 🔄

**Issue**: `llama-3.3-70b-versatile` may have been deprecated

**Fix Applied**: Updated to `llama-3.1-70b-versatile`

**Location**: `lib/services/weeklyInsightService.ts` line 23

**Available Groq Models** (as of Oct 2025):
- `llama-3.1-8b-instant` - Fastest, good for simple tasks
- `llama-3.1-70b-versatile` - Best balance (RECOMMENDED)
- `llama-3.2-90b-vision-preview` - With vision capabilities
- `mixtral-8x7b-32768` - Good alternative

### 3. Network/Firewall Blocking

**Check**: Test Groq API directly

```bash
# Windows PowerShell test
$headers = @{
    "Authorization" = "Bearer $env:GROQ_API_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    model = "llama-3.1-70b-versatile"
    messages = @(
        @{
            role = "user"
            content = "Hello"
        }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.groq.com/openai/v1/chat/completions" -Method Post -Headers $headers -Body $body
```

If this fails, check:
- Corporate firewall settings
- Antivirus software
- VPN connection
- Proxy settings

### 4. Rate Limiting

Groq has generous rate limits, but check if you've hit them:
- Free tier: 30 requests/minute
- If exceeded, wait and retry

## Current Fallback Behavior

The app is designed to gracefully handle Groq failures:

1. **First**: Try Groq (Llama 3.1)
2. **Fallback**: Use OpenAI (GPT-4o-mini)
3. **Last Resort**: Generate basic insights without AI

So even with Groq failing, users should still get insights via OpenAI.

## Quick Fixes

### Option 1: Update API Key (RECOMMENDED)

1. Go to https://console.groq.com/keys
2. Create a new API key
3. Update `.env.local`:
   ```
   GROQ_API_KEY=gsk_new_key_here
   ```
4. Restart dev server

### Option 2: Verify Model Name

Check latest models at: https://console.groq.com/docs/models

Update in `lib/services/weeklyInsightService.ts`:
```typescript
const GROQ_MODEL = 'llama-3.1-70b-versatile' // or latest model
```

### Option 3: Switch to OpenAI Only

If Groq continues to fail, you can disable it temporarily:

In `lib/services/weeklyInsightService.ts`, comment out Groq attempt:
```typescript
export async function generateWeeklyInsights(
  digest: WeeklyDigest,
  userName: string | null
) {
  const systemPrompt = buildInsightSystemPrompt()
  const userContext = buildWeeklyContext(digest, userName)

  // Skip Groq, go straight to OpenAI
  /*
  try {
    console.log('Generating weekly insights with Groq...')
    const insights = await generateInsightsWithGroq(systemPrompt, userContext)
    // ...
  } catch (error) {
    console.error('Groq insight generation failed:', error)
  }
  */

  // Use OpenAI directly
  try {
    console.log('Generating insights with OpenAI...')
    const insights = await generateInsightsWithOpenAI(systemPrompt, userContext)
    // ...
  }
}
```

## Testing the Fix

### 1. Test Weekly Digest API

```bash
# Make a request to the weekly digest endpoint
curl http://localhost:3000/api/premium/weekly-digest
```

### 2. Check Logs

Look for:
- ✅ "Successfully generated insights with Groq" - Fixed!
- ⏭️ "Falling back to OpenAI for insights..." - Groq still failing, but OpenAI working
- ❌ Both failing - Check both API keys

### 3. Test in Browser

1. Navigate to Dashboard as a premium user
2. Look for "Weekly Insights" component
3. Check browser console for errors
4. Verify insights are generated (even if via OpenAI fallback)

## Changes Made

### File: `lib/services/weeklyInsightService.ts`

**Line 23**: Updated model name
```typescript
// Before
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// After
const GROQ_MODEL = 'llama-3.1-70b-versatile'
```

**Lines 118-127**: Added better error logging
```typescript
catch (error: any) {
  if (error?.status === 403) {
    console.error('Groq API 403 Error: Access denied. This usually means:')
    console.error('  1. Invalid or expired API key')
    console.error('  2. Model name may have changed')
    console.error('  3. Network/firewall blocking request')
    console.error('  Current model:', GROQ_MODEL)
  }
  console.error('Groq API error:', error?.message || error)
  return null
}
```

## Next Steps

1. ✅ Model name updated to stable version
2. ✅ Better error logging added
3. ⏳ **ACTION REQUIRED**: Verify Groq API key is valid
4. ⏳ Test the weekly digest endpoint
5. ⏳ Check if OpenAI fallback is working

## Resources

- [Groq Console](https://console.groq.com/)
- [Groq API Documentation](https://console.groq.com/docs/quickstart)
- [Groq Models List](https://console.groq.com/docs/models)
- [Groq Status Page](https://status.groq.com/)

## Support

If the issue persists after trying all fixes:

1. Check Groq's status page for outages
2. Verify OpenAI is working as fallback
3. Consider using OpenAI as primary (it's more reliable)
4. Contact Groq support if API key issues persist

---

**Last Updated**: 2025-10-12  
**Files Modified**: 
- `lib/services/weeklyInsightService.ts`
- `docs/guides/GROQ_API_TROUBLESHOOTING.md` (this file)
