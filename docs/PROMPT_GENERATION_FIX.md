# Prompt Generation Fix - Complete Summary

## Issues Fixed

### 1. ✅ Focus Area Tracking Error (PGRST204)
**Problem:** Free users were getting database errors when trying to track focus area usage.

**Solution:** Modified `app/api/prompts/generate/route.ts` to only track focus area usage for premium users:
```typescript
// Track focus area usage ONLY for premium users with custom focus areas
// Free users use onboarding focus areas which don't need tracking
if (selectedFocusArea && savedPrompt && tier === 'premium') {
  // ... tracking code
}
```

### 2. ✅ Profile Creation Errors
**Problem:** Users without completed onboarding were getting profile errors.

**Solutions Implemented:**
- Onboarding API creates profile record
- `useTier` hook auto-creates profile
- `syncUserProfile` auto-creates profile
- `getUserProfile` auto-creates profile
- Proxy enforces onboarding completion before dashboard access

### 3. ✅ Prompt Personalization
**Problem:** Prompts showing "You mentioned" instead of using onboarding data.

**How It Works:**

#### For Free Users:
1. User completes onboarding → saves to `user_preferences` table:
   - `reason` (why they're using the app)
   - `focus_areas` (array of selected areas)
   - `current_mood`
   - Other preferences

2. Prompt generation fetches this data:
   ```typescript
   const context: GeneratePromptContext = {
     focus_areas: focusAreaNames,        // From user_preferences.focus_areas
     user_reason: preferences?.reason,    // From user_preferences.reason
     recent_moods: [...],
     recent_topics: [...]
   }
   ```

3. AI receives rich context:
   ```
   **Their Journey:**
   They came to Prompt & Pause because: "[user's reason]"
   
   **Growth Areas:**
   They're juggling multiple things: [focus areas from onboarding]
   ```

#### For Premium Users:
- Can create custom focus areas in `focus_areas` table
- System uses weighted random selection
- Tracks usage in `prompt_focus_area_usage` table

## How Onboarding Data Flows

```
User Completes Onboarding
    ↓
POST /api/onboarding
    ↓
Saves to user_preferences:
  - reason: "I want to improve my mental health"
  - focus_areas: ["Stress Management", "Work-Life Balance"]
  - current_mood: 7
  - prompt_time: "09:00:00"
  - delivery_method: "email"
    ↓
Creates profile record:
  - subscription_status: "free"
  - subscription_tier: "freemium"
    ↓
User Redirected to Dashboard
    ↓
Proxy checks user_preferences exists ✅
    ↓
Dashboard loads, generates prompt
    ↓
POST /api/prompts/generate
    ↓
Fetches user_preferences
    ↓
Builds AI context with:
  - user_reason: "I want to improve my mental health"
  - focus_areas: ["Stress Management", "Work-Life Balance"]
    ↓
AI generates personalized prompt:
  "How has work been affecting your stress levels this week?"
```

## Debugging

Added comprehensive logging to track the flow:

1. **Onboarding API:**
   ```
   [onboarding] Saving preferences for user: [id]
   [onboarding] Creating profile record
   ✅ Profile created successfully
   ```

2. **Prompt Generation:**
   ```
   [PROMPT_GEN] Context built: {
     userId: "...",
     tier: "free",
     hasPreferences: true,
     userReason: "I want to improve my mental health",
     focusAreasCount: 2,
     focusAreas: ["Stress Management", "Work-Life Balance"]
   }
   ```

3. **AI Context Builder:**
   ```
   [buildUserContext] Context received: {
     hasReason: true,
     reason: "I want to improve my mental health",
     focusAreasCount: 2,
     focusAreas: ["Stress Management", "Work-Life Balance"]
   }
   [buildUserContext] Added user reason to context
   ```

## Testing Checklist

### For Existing Users (Without Onboarding):
1. ✅ Visit dashboard → auto-redirected to `/onboarding`
2. ✅ Complete onboarding → `user_preferences` created
3. ✅ Profile auto-created with free tier
4. ✅ Generate prompt → uses onboarding data
5. ✅ No PGRST204 errors

### For New Users:
1. ✅ Sign up → redirected to `/onboarding`
2. ✅ Complete onboarding → saves all data
3. ✅ Redirected to `/dashboard`
4. ✅ Generate prompt → personalized with onboarding context
5. ✅ No profile errors

### For Premium Users:
1. ✅ Can create custom focus areas
2. ✅ Prompts use custom areas
3. ✅ Usage tracked in `prompt_focus_area_usage`
4. ✅ Weighted random selection works

## Key Files Modified

1. `app/api/onboarding/route.ts` - Creates profile during onboarding
2. `app/api/prompts/generate/route.ts` - Only tracks usage for premium
3. `lib/services/aiService.ts` - Added logging to context builder
4. `lib/services/userService.ts` - Auto-creates profiles
5. `lib/services/globalSyncService.ts` - Auto-creates profiles
6. `hooks/useTier.ts` - Auto-creates profiles
7. `proxy.ts` - Enforces onboarding completion

## Expected Behavior

### Free Users:
- ✅ Must complete onboarding before dashboard access
- ✅ Prompts personalized with onboarding `reason` and `focus_areas`
- ✅ No database errors
- ✅ Profile auto-created if missing

### Premium Users:
- ✅ Can use custom focus areas
- ✅ Usage tracked for analytics
- ✅ Weighted random selection
- ✅ All free user features plus custom areas

## Common Issues

### "You mentioned" in prompts
**Cause:** User preferences not being fetched or empty
**Check:** 
```sql
SELECT reason, focus_areas FROM user_preferences WHERE user_id = '[user_id]';
```
**Fix:** User needs to complete onboarding

### PGRST204 Error
**Cause:** Trying to insert into `prompt_focus_area_usage` for free users
**Fix:** Already fixed - only premium users tracked

### Profile Errors
**Cause:** Missing profile record
**Fix:** Multiple auto-creation fallbacks now in place
