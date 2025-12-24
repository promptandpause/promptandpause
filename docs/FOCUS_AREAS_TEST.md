# 🧪 Test Focus Areas - Quick Start

## What Was Fixed?

Focus areas were **not personalizing prompts** because the system wasn't reading premium users' custom focus areas from the database. Now it does! ✅

---

## Test It Right Now (5 minutes)

### Step 1: Create a Focus Area
1. Go to **Dashboard**
2. Click **Settings** (gear icon)
3. Find **Focus Areas Manager**
4. Click the **+** button
5. Create:
   - Name: `Career Development`
   - Description: `Managing work challenges`
   - Pick an icon: 💼
   - Pick a color
6. Click **Create Focus Area**

### Step 2: Generate a Prompt
1. Go back to **Dashboard**
2. Click **Generate Prompt** button
3. Open **Browser Console** (Press F12)
4. Look for this in console:
   ```
   Using premium focus areas: ["Career Development"]
   Generating prompt with OpenRouter (free tier)...
   Successfully generated prompt with OpenRouter
   ```

### Step 3: Check the Prompt
The generated prompt should be **about your career/work**, such as:
- "What's one work challenge this week that's been teaching you something about yourself?"
- "What work win today aren't you giving yourself credit for?"
- "How are you feeling about your career direction this week?"

---

## Expected Behavior

### ✅ What Should Happen
1. Your custom focus areas appear in the AI context
2. Prompts relate to topics you created
3. Console shows: `Using premium focus areas: [...]`
4. Help text in Focus Areas Manager explains how it works
5. Example prompts shown based on your focus area

### ❌ What Should NOT Happen
1. Empty focus areas: `Using premium focus areas: []`
2. Generic prompts unrelated to your topics
3. Console errors about database access
4. No help text explaining the feature

---

## Debug Checklist

If it's not working:

- [ ] **Are you premium?**
  - Check: Settings → Account → Subscription Status
  - Must be "Active Premium"

- [ ] **Did you create focus areas?**
  - Check: Settings → Focus Areas Manager
  - Should show at least one created area

- [ ] **Did you restart after setup?**
  - Hard refresh page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

- [ ] **Check browser console**
  - Press F12
  - Look for errors or logs
  - Should see: "Using premium focus areas: [...]"

- [ ] **Check network tab**
  - F12 → Network tab
  - Generate prompt
  - Look for `/api/prompts/generate` call
  - Check response data

---

## Quick Fixes

### Problem: Focus areas empty in console
```
Using premium focus areas: []
```

**Solution:**
1. Check if focus areas exist in database
2. Make sure user_id matches current user
3. Verify subscription_tier = 'premium'
4. Refresh page and try again

### Problem: Using freemium instead of premium
```
Using freemium focus areas: [...]
```

**Solution:**
1. Check subscription status
2. Verify subscription hasn't expired
3. Check database: profiles table → subscription_tier column

### Problem: Prompts still generic
**Solution:**
1. Delete today's existing prompt (if any)
2. Generate fresh prompt
3. AI varies prompts - try 2-3 times to see patterns
4. Check that focus area names are clear (not vague)

---

## Verification Script (Optional)

Run this in browser console to check your setup:

```javascript
// Check if focus areas API is working
fetch('/api/premium/focus-areas')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Focus Areas:', data)
    if (data.success && data.data.length > 0) {
      console.log('✅ You have', data.data.length, 'focus areas')
      console.log('📋 Names:', data.data.map(a => a.name))
    } else {
      console.log('⚠️ No focus areas found or not premium')
    }
  })
```

---

## What to Share with Users

Once verified, you can communicate:

> 🎯 **Focus Areas Are Fixed!**
> 
> Your custom focus areas now properly personalize your daily prompts. The AI uses your specific topics to create relevant, meaningful questions.
> 
> **Try it:**
> 1. Create a focus area in Settings
> 2. Generate a new prompt
> 3. Notice how it relates to your topic!
> 
> Example: Focus area "Career Growth" → Prompt about work challenges

---

**Quick Links:**
- Full Guide: `docs/FOCUS_AREAS_GUIDE.md`
- Technical Details: `FOCUS_AREAS_FIX_SUMMARY.md`
- OpenRouter Setup: `OPENROUTER_QUICKSTART.md`

---

**Status:** ✅ Ready to Test  
**Time to Test:** 5 minutes  
**Prerequisites:** Premium subscription
