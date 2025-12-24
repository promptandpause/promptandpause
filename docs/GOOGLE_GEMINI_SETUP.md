# Google Gemini API Setup Guide

## Current Status

✅ **API Key is valid** - Your key is recognized by Google  
⚠️ **Response is empty** - The API responds but returns no content

**Likely Issue:** The "Generative Language API" may not be fully enabled for your API key, or there's a quota/permission issue.

---

## Step-by-Step Setup (Google AI Studio)

### Option 1: Using Google AI Studio (Recommended for Development)

This is the simplest way and doesn't require Google Cloud setup.

1. **Go to Google AI Studio**
   ```
   https://aistudio.google.com/app/apikey
   ```

2. **Create or Verify API Key**
   - Click "Create API key" or verify your existing key
   - Make sure it shows "Active" status
   - **Important:** Choose "Create API key in new project" if creating new

3. **Test in AI Studio First**
   - Go to: https://aistudio.google.com/
   - Click "Prompt" → "New prompt"
   - Type: "Say hello in 3 words"
   - Click "Run"
   - If this works, your account is properly set up

4. **Check API Key Restrictions**
   - Go back to: https://aistudio.google.com/app/apikey
   - Click on your API key
   - Look for "API restrictions"
   - **Make sure:** "Generative Language API" is allowed
   - **If restricted:** Either remove restrictions or explicitly allow "Generative Language API"

5. **Copy Your API Key**
   - Copy the full API key
   - Update your `.env.local`:
   ```bash
   GEMINI_API_KEY=your_actual_key_here
   ```

6. **Restart Everything**
   ```bash
   # Stop dev server (Ctrl+C)
   npm run dev
   ```

---

### Option 2: Using Google Cloud Console (For Production)

If you're setting up for production or need more control:

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Select existing project or create new one

3. **Enable the Generative Language API**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for: "Generative Language API"
   - Click on it
   - Click "Enable" button
   - **Wait 1-2 minutes** for it to fully enable

4. **Create API Credentials**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key
   - **Optional but recommended:** Click "Restrict Key"
     - Under "API restrictions" → Select "Restrict key"
     - Choose "Generative Language API" from the list
     - Save

5. **Set Up Billing (If Required)**
   - Some Google Cloud features require billing
   - Go to: https://console.cloud.google.com/billing
   - Add a billing account if needed
   - **Note:** Gemini has a free tier, but billing info may be required

6. **Update Environment Variable**
   ```bash
   GEMINI_API_KEY=your_google_cloud_api_key_here
   ```

---

## Common Issues & Solutions

### Issue 1: Empty Responses (Current Issue)

**Symptoms:**
- API key is recognized
- No error messages
- Response is empty
- `finishReason: MAX_TOKENS`

**Solutions:**

1. **Enable Generative Language API**
   - Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
   - Click "Enable"
   - Wait 2-3 minutes

2. **Check API Key Source**
   - **AI Studio keys** (recommended): Should work immediately
   - **Cloud Console keys**: Need API explicitly enabled

3. **Try a Different Model**
   - Test with: `gemini-2.0-flash` instead of `gemini-2.5-flash`
   - Some accounts may not have access to 2.5 yet

4. **Verify Account Status**
   - Go to: https://aistudio.google.com/
   - Make sure you can generate content in the web UI
   - If web UI doesn't work, your account may need verification

### Issue 2: 403 Forbidden

**Solution:**
- API key doesn't have permission
- Re-create API key in Google AI Studio
- Or enable "Generative Language API" in Cloud Console

### Issue 3: 404 Not Found

**Solution:**
- Model name is wrong
- Run: `node scripts/list-gemini-models.js` to see available models
- Make sure you're using exact model name

### Issue 4: 429 Rate Limit

**Solution:**
- Free tier: 15 requests/minute, 1,500/day
- Wait a few minutes
- Check quota at: https://aistudio.google.com/

### Issue 5: API_KEY_INVALID

**Solution:**
- Key is revoked or wrong
- Create a new key
- Make sure there are no extra spaces in `.env.local`

---

## Testing Your Setup

Run these commands in order:

### 1. Test API Key is Set
```bash
Get-Content .env.local | Select-String "GEMINI_API_KEY"
```
Should show: `GEMINI_API_KEY=AIza...`

### 2. List Available Models
```bash
node scripts/list-gemini-models.js
```
Should show 50+ models if working

### 3. Test API Connection
```bash
node scripts/test-gemini-api.js
```
Should show actual text response, not empty

### 4. Test in Your App
- Start dev server: `npm run dev`
- Go to: `http://localhost:3000/dashboard`
- Click "Generate Prompt"
- Check console for: "Successfully generated prompt with Gemini"

---

## Quick Fix Checklist

If prompts aren't generating:

- [ ] API key is in `.env.local` (check for typos/spaces)
- [ ] Dev server was restarted after adding key
- [ ] "Generative Language API" is enabled
- [ ] You can generate content at https://aistudio.google.com/
- [ ] Test script returns actual text (not empty)
- [ ] Browser console shows no errors
- [ ] No rate limits hit (check console for 429 errors)

---

## Recommended Setup (Easiest Path)

For quickest setup that works:

1. **Use Google AI Studio** (not Cloud Console)
   - Go to: https://aistudio.google.com/app/apikey
   - Create new API key
   - Copy entire key

2. **Add to `.env.local`**
   ```bash
   GEMINI_API_KEY=AIzaSy...your_full_key_here
   ```
   **No spaces, no quotes!**

3. **Test in AI Studio first**
   - Go to: https://aistudio.google.com/
   - Try generating something
   - If this doesn't work, your account needs setup

4. **Then test our script**
   ```bash
   node scripts/test-gemini-api.js
   ```

5. **Finally test in app**
   ```bash
   npm run dev
   ```

---

## Still Not Working?

### Check Account Status
- Some Google accounts need verification
- Go to: https://aistudio.google.com/
- Look for any warnings or verification requests

### Try Alternative Model
Update `lib/services/aiService.ts` line 25:
```typescript
// Try Gemini 2.0 instead of 2.5
const GEMINI_MODEL = 'gemini-2.0-flash'
```

### Contact Google Support
If nothing works:
- Your account may need manual verification
- Some regions have restricted access
- Contact: https://support.google.com/

---

## Environment File Example

Your `.env.local` should look like:

```bash
# Gemini AI (no quotes, no spaces)
GEMINI_API_KEY=AIzaSyAaBbCcDdEeFfGgHhIiJjKkLlMm

# Other keys...
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Common mistakes:**
- ❌ `GEMINI_API_KEY="AIza..."` (don't use quotes)
- ❌ `GEMINI_API_KEY= AIza...` (don't add space after =)
- ❌ `GEMINI_API_KEY=AIza...\r\n` (watch for line endings on Windows)

---

## Next Steps After Setup

Once the API is working:

1. **Test prompt generation** in the dashboard
2. **Run migrations** if you haven't:
   ```bash
   npx supabase db push
   ```
3. **Check RLS policies** are working
4. **Verify prompts are saved** to database

---

Last updated: October 13, 2025
