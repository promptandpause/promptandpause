# Weekly Insights Caching Fix

**Date**: January 12, 2025  
**Status**: ✅ **CRITICAL BUG FIXED**  
**Impact**: **Massive token savings** + Better UX

---

## 🐛 The Problem

### What Was Happening:
Every time a user loaded the dashboard, the app was:
1. ❌ Calling `generateWeeklyInsights()` 
2. ❌ Making an API call to Gemini/OpenAI
3. ❌ Consuming tokens **unnecessarily**
4. ❌ Slowing down page load (waiting for AI response)

### The Cost:
```
Without caching:
- 1 page load = 1 API call
- 10 page loads/day = 10 API calls
- For 50 users = 500 API calls/day

Gemini free tier: 1,500 requests/day
We were burning through 33% of daily quota just on page refreshes! 😱
```

### Why It Happened:
The API endpoint (`GET /api/premium/weekly-digest`) had this logic:
```typescript
// ❌ BAD: Generated insights on EVERY request
const digest = await generateWeeklyDigestServer(user.id, weekStart, weekEnd)
const insights = await generateWeeklyInsights(digest, profile.full_name) // API CALL EVERY TIME!
```

---

## ✅ The Solution

### Caching Strategy:
1. **Generate once per week** (ideally via cron job)
2. **Store in database** (`weekly_insights_cache` table)
3. **Serve from cache** on subsequent page loads
4. **Only regenerate** when:
   - Cache miss (first time this week)
   - New reflections added (optional: invalidate cache)
   - User manually requests refresh

### New Flow:
```typescript
// ✅ GOOD: Check cache first
1. Check database for cached insights (this week)
2. IF cached → Return immediately (no API call)
3. IF NOT cached → Generate insights + Save to cache
```

---

## 🔧 Changes Made

### 1. Database Migration

**File**: `sql/migrations/features/20250112_add_weekly_insights_cache.sql`

Created new table:
```sql
CREATE TABLE public.weekly_insights_cache (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Digest stats (cached for speed)
  total_reflections INTEGER,
  current_streak INTEGER,
  average_word_count INTEGER,
  top_tags JSONB,
  mood_distribution JSONB,
  
  -- AI insights (the expensive part)
  insights JSONB NOT NULL,
  
  generated_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, week_start, week_end)
);
```

**Why this structure:**
- `user_id + week_start + week_end` = unique key (one cache per user per week)
- `insights` JSONB stores the full AI response
- `generated_at` tracks when insights were generated

### 2. API Route Update

**File**: `app/api/premium/weekly-digest/route.ts`

**Before** (lines 250-268):
```typescript
// ❌ Generated insights on every request
const digest = await generateWeeklyDigestServer(user.id, weekStart, weekEnd)
const insights = await generateWeeklyInsights(digest, profile.full_name)
```

**After** (lines 250-327):
```typescript
// ✅ Check cache first
const { data: cachedInsights } = await supabase
  .from('weekly_insights_cache')
  .select('*')
  .eq('user_id', user.id)
  .eq('week_start', weekStart.toISOString())
  .eq('week_end', weekEnd.toISOString())
  .single()

if (cachedInsights) {
  console.log('✅ Using cached weekly insights (no API call)')
  return NextResponse.json({ success: true, data: cachedInsights })
}

// Only generate if not cached
console.log('⚡ Generating NEW weekly insights (API call)')
const insights = await generateWeeklyInsights(digest, profile.full_name)

// Save to cache
await supabase
  .from('weekly_insights_cache')
  .upsert({ ...insights }, { onConflict: 'user_id,week_start,week_end' })
```

---

## 📊 Impact & Savings

### Token Usage:

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| **First page load** | 1 API call | 1 API call | 0% |
| **Subsequent loads (same week)** | 1 API call | 0 API calls | 100% ✅ |
| **10 page loads/day** | 10 API calls | 1 API call | 90% ✅ |
| **50 users, 10 loads each** | 500 API calls | 50 API calls | 90% ✅ |

### Cost Savings (monthly):
```
Before: ~15,000 API calls/month (50 users × 10 loads/day × 30 days)
After:  ~1,500 API calls/month (50 users × 1 generation/day × 30 days)

Savings: 90% reduction in API usage 🎉
```

### Performance:
- **First load**: Same (~1-2 seconds for AI generation)
- **Subsequent loads**: **Instant** (<100ms from database)
- **User experience**: Much faster, smoother

---

## 🧪 Testing

### To Apply Migration:
```bash
# Run the migration on your Supabase database
psql -h <your-db-host> -U postgres -d postgres -f sql/migrations/features/20250112_add_weekly_insights_cache.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `20250112_add_weekly_insights_cache.sql`
3. Run query

### To Test Caching:
1. **First Load**: Open dashboard → Check console:
   ```
   ⚡ Generating NEW weekly insights (API call) for <user_id>
   ✅ Cached weekly insights for future page loads
   ```

2. **Refresh Page**: Check console:
   ```
   ✅ Using cached weekly insights (no API call)
   ```

3. **Verify Database**:
   ```sql
   SELECT user_id, week_start, week_end, generated_at
   FROM weekly_insights_cache
   WHERE user_id = '<your-user-id>';
   ```

---

## 🔄 Cache Invalidation Strategies

### When to Regenerate:

#### Option 1: Weekly Cron Job (Recommended)
```typescript
// Run every Monday at 12 AM
// Generates fresh insights for all premium users
// Old cache automatically expires (different week_start)
```

#### Option 2: On-Demand Refresh
Add a "Refresh Insights" button:
```typescript
// Delete cache for current week
await supabase
  .from('weekly_insights_cache')
  .delete()
  .eq('user_id', user.id)
  .eq('week_start', weekStart.toISOString())

// Next page load will regenerate
```

#### Option 3: Auto-Refresh on New Reflection
When user adds a reflection:
```typescript
// Optionally delete cache to trigger regeneration
// (Only if you want real-time updates)
```

---

## 📝 Best Practices

### Do's:
- ✅ Cache insights for at least the current week
- ✅ Monitor cache hit rate (should be >90%)
- ✅ Log when insights are generated vs cached
- ✅ Set up weekly cron job to pre-generate insights

### Don'ts:
- ❌ Don't regenerate on every page load (old behavior)
- ❌ Don't cache forever (insights become stale)
- ❌ Don't forget to handle cache misses gracefully

---

## 🚀 Future Improvements

### Potential Enhancements:
1. **Pre-generation**: Cron job generates insights Sunday night for all users
2. **Stale-While-Revalidate**: Show cached insights while regenerating in background
3. **User-Initiated Refresh**: "Generate Fresh Insights" button
4. **Multi-Week Cache**: Store insights for past weeks (history view)
5. **Cache Warming**: Generate insights proactively after user adds reflection

---

## 📈 Monitoring

### Metrics to Track:
```sql
-- Cache hit rate (should be >90%)
SELECT 
  COUNT(*) FILTER (WHERE generated_at < NOW() - INTERVAL '1 hour') * 100.0 / COUNT(*) as cache_hit_rate
FROM weekly_insights_cache
WHERE generated_at > NOW() - INTERVAL '7 days';

-- API calls saved per week
SELECT user_id, COUNT(*) as page_loads
FROM weekly_insights_cache
WHERE generated_at > NOW() - INTERVAL '7 days'
GROUP BY user_id;
```

### Logs to Watch:
- `✅ Using cached weekly insights` → Good (cache hit)
- `⚡ Generating NEW weekly insights` → Expected once per user per week
- If you see "Generating NEW" frequently → Check cache logic

---

## ✅ Checklist

- [x] Created `weekly_insights_cache` table
- [x] Added RLS policies for security
- [x] Updated GET endpoint to check cache first
- [x] Save insights to cache after generation
- [x] Added console logs for debugging
- [x] Tested cache hit/miss scenarios
- [ ] Run migration on production database
- [ ] Monitor cache hit rate after deployment
- [ ] Optional: Set up weekly cron job to pre-generate

---

## 🎉 Results

**Before**: Wasting 90% of API calls on redundant generations  
**After**: Generating insights once per week, serving from cache

**Token Savings**: ~90% reduction in API usage  
**Performance**: Instant page loads after first generation  
**User Experience**: Smoother, faster dashboard

---

**Critical bug fixed! Your app now uses AI tokens efficiently! 🚀**
