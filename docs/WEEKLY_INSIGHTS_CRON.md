# Weekly Insights Cron Job

## Overview
Weekly insights are automatically regenerated **every Monday and Friday at 6:00 AM UTC** for all premium users.

## How It Works

### Schedule
- **Monday 6:00 AM UTC**: Regenerates insights for the current week (Monday-Sunday)
- **Friday 6:00 AM UTC**: Updates insights with mid-week data

### Process
1. Fetches all active premium users
2. For each user:
   - Generates weekly digest data (reflections, moods, tags, streaks)
   - Uses AI (Gemini/OpenAI) to generate personalized insights
   - Caches results in `weekly_insights_cache` table
3. Returns summary of processed users

### Caching Strategy
- Cache key: `(user_id, week_start, week_end)`
- Cache is automatically refreshed on Monday and Friday
- Users see cached insights for fast loading
- Fresh insights generated twice per week

## Configuration

### Vercel Cron
The cron job is defined in `vercel.json`:
```json
{
  "path": "/api/cron/regenerate-weekly-insights",
  "schedule": "0 6 * * 1,5"
}
```

**Schedule Format**: `0 6 * * 1,5`
- `0` - Minute (0)
- `6` - Hour (6 AM UTC)
- `*` - Day of month (any)
- `*` - Month (any)
- `1,5` - Day of week (Monday=1, Friday=5)

### Environment Variables
Add to `.env.local` and Vercel environment:
```
CRON_SECRET=your-random-secret-string-here
```

**To generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Security
- The cron endpoint requires `Authorization: Bearer ${CRON_SECRET}` header
- Vercel automatically adds this header when calling cron jobs
- Prevents unauthorized access to the endpoint

## API Endpoint

**Endpoint**: `GET /api/cron/regenerate-weekly-insights`

**Response**:
```json
{
  "success": true,
  "message": "Weekly insights regeneration completed",
  "processed": 45,
  "errors": 0,
  "total": 45
}
```

## Manual Trigger (Testing)
You can manually trigger the cron job for testing:

```bash
curl -X GET https://your-domain.vercel.app/api/cron/regenerate-weekly-insights \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

## Monitoring
Check Vercel logs for cron execution:
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by `/api/cron/regenerate-weekly-insights`
3. Look for:
   - `[CRON] Starting weekly insights regeneration...`
   - `[CRON] Found X premium users`
   - `[CRON] ✅ Successfully regenerated insights for user...`
   - `[CRON] Finished processing. Success: X, Errors: Y`

## Benefits
1. **Performance**: Pre-computed insights load instantly for users
2. **Cost Efficiency**: AI calls only twice per week instead of on every page load
3. **Freshness**: Data updated mid-week (Friday) to reflect recent activity
4. **Scalability**: Handles all premium users in batch

## Database
Insights are cached in the `weekly_insights_cache` table:
- `user_id` (uuid)
- `week_start` (timestamptz)
- `week_end` (timestamptz)
- `total_reflections` (integer)
- `current_streak` (integer)
- `average_word_count` (integer)
- `top_tags` (jsonb)
- `mood_distribution` (jsonb)
- `insights` (jsonb)
- `generated_at` (timestamptz)

## Troubleshooting

### No insights showing for users
1. Check if cron ran successfully in Vercel logs
2. Verify `CRON_SECRET` is set in Vercel environment
3. Check `weekly_insights_cache` table for recent entries

### AI generation failures
- Cron job continues processing other users if one fails
- Fallback insights are generated if AI fails
- Check logs for specific error messages

### Timezone considerations
- All times stored in UTC
- Week calculation: Monday 00:00 UTC to Sunday 23:59 UTC
- Adjust cron schedule if needed for your users' timezone
