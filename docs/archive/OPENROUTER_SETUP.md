# OpenRouter Setup Guide

## Why OpenRouter?

OpenRouter is the **best free alternative** for AI-powered prompt generation because:

✅ **100% Free Models** - Access to Meta Llama 3.1, Google Gemini Flash, and more  
✅ **No Credit Card Required** - Start using immediately with free tier  
✅ **High Rate Limits** - Generous free tier for development  
✅ **Multiple Models** - Automatic fallback to different models if one fails  
✅ **OpenAI-Compatible API** - Uses the same SDK you already have installed  

---

## Quick Setup (5 minutes)

### Step 1: Get Your Free API Key

1. Go to **[OpenRouter.ai](https://openrouter.ai/keys)**
2. Sign in with Google or GitHub (no credit card needed)
3. Click **"Create Key"** 
4. Copy your API key (starts with `sk-or-v1-...`)

### Step 2: Add to Your Environment

1. Open your `.env.local` file (or create it if it doesn't exist)
2. Add this line:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```
3. Save the file

### Step 3: Restart Your Dev Server

```powershell
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 4: Test It!

1. Go to your dashboard: `http://localhost:3000/dashboard`
2. Click **"Generate Prompt"**
3. Check the console - you should see:
   ```
   Generating prompt with OpenRouter (free tier)...
   Successfully generated prompt with OpenRouter
   ```

✅ **Done!** Your app now uses free AI prompts via OpenRouter.

---

## Free Models Available

OpenRouter provides access to several **completely free** models:

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| **Meta Llama 3.1 8B** (default) | ⚡ Very Fast | ⭐⭐⭐⭐ | General use |
| Google Gemini Flash 1.5 | ⚡ Fast | ⭐⭐⭐⭐⭐ | High quality |
| Mistral 7B | ⚡ Fast | ⭐⭐⭐ | Lightweight |

Your app is configured to use **Meta Llama 3.1 8B** (the `:free` version) by default.

View all free models: https://openrouter.ai/models?max_price=0

---

## Rate Limits (Free Tier)

- **Requests per minute:** 20
- **Requests per day:** Unlimited (fair use)
- **Token limit:** 4,096 tokens per request

This is **more than enough** for a personal mental wellness app!

---

## Troubleshooting

### Problem: Still seeing Gemini errors

**Solution:** Make sure you restarted your dev server after adding the API key.

```powershell
# Stop the server (Ctrl+C in the terminal running npm run dev)
npm run dev
```

### Problem: "OPENROUTER_API_KEY not configured"

**Solution:** Check your `.env.local` file:

1. Make sure the file is named **`.env.local`** (not `.env.example`)
2. Make sure it's in the root directory (`C:\Users\disha\Documents\GitHub\PandP\`)
3. Make sure there are no spaces around the `=` sign
4. Make sure the key starts with `sk-or-v1-`

### Problem: API key not working

**Solution:** Regenerate your key:

1. Go to https://openrouter.ai/keys
2. Delete the old key
3. Create a new one
4. Update `.env.local` with the new key
5. Restart the dev server

### Problem: Rate limit errors

**Solution:** OpenRouter's free tier is generous, but if you hit limits:

1. Wait a minute and try again
2. Consider adding a fallback (Gemini or OpenAI)
3. Check your usage at https://openrouter.ai/activity

---

## Switching Models (Advanced)

If you want to try a different free model, edit `lib/services/aiService.ts`:

```typescript
// Current setting (line 31)
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

// Alternative free models:
// const OPENROUTER_MODEL = 'google/gemini-flash-1.5:free'
// const OPENROUTER_MODEL = 'mistralai/mistral-7b-instruct:free'
```

---

## Fallback Chain

Your app now has a **robust AI fallback system**:

1. **Primary:** OpenRouter (Llama 3.1) - FREE ✅
2. **Fallback 1:** Google Gemini - FREE ✅
3. **Fallback 2:** OpenAI (GPT-4o-mini) - Paid

If OpenRouter fails (network issue, rate limit, etc.), it automatically tries Gemini, then OpenAI.

---

## Cost Comparison

| Provider | Free Tier | Cost After Free |
|----------|-----------|-----------------|
| **OpenRouter** | Unlimited (fair use) | $0.06 per 1M tokens |
| Google Gemini | 1,500 requests/day | $0.35 per 1M tokens |
| OpenAI | None | $0.15 per 1M tokens |

**Recommendation:** Use OpenRouter for development and small-scale production. It's completely free for reasonable usage.

---

## Security Notes

🔒 **NEVER commit your API key to Git!**

- ✅ Add `OPENROUTER_API_KEY` to `.env.local` (already in `.gitignore`)
- ❌ Don't add it to `.env.example` with a real value
- ❌ Don't expose it in client-side code
- ✅ Only use it server-side (API routes)

Your app is already configured correctly - the API key is only used in server-side code.

---

## Need Help?

- **OpenRouter Docs:** https://openrouter.ai/docs
- **Check Usage:** https://openrouter.ai/activity
- **Discord Support:** https://discord.gg/openrouter

---

**Last Updated:** October 13, 2025  
**Status:** ✅ Ready to Use
