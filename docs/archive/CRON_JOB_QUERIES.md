# Cron Job SQL Queries - Quick Reference

## Setup Instructions

1. **Run the migration in Supabase SQL Editor:**
   - Go to your Supabase Dashboard → SQL Editor
   - Copy and paste the entire content of `supabase/migrations/20250110000000_setup_cron_jobs.sql`
   - Click "Run" to execute

2. **Verify the setup:**
   ```sql
   -- Check if table exists
   SELECT * FROM cron_job_runs LIMIT 1;
   ```

---

## Common Queries

### 1. View Recent Daily Prompt Job Runs
```sql
-- Last 10 runs of daily prompts
SELECT * FROM get_recent_cron_runs('send_daily_prompts', 10);
```

### 2. View All Recent Cron Jobs
```sql
-- Last 20 runs of any job
SELECT * FROM get_recent_cron_runs(NULL, 20);
```

### 3. Get Statistics (Last 7 Days)
```sql
-- Statistics for daily prompt job
SELECT * FROM get_cron_job_stats('send_daily_prompts', 7);
```

### 4. Get Statistics (Last 30 Days)
```sql
-- All jobs statistics for last month
SELECT * FROM get_cron_job_stats();
```

### 5. Manual Query - Recent Runs with Details
```sql
SELECT 
  job_name,
  started_at,
  completed_at,
  status,
  total_users,
  successful_sends,
  failed_sends,
  execution_time_ms,
  error_message
FROM cron_job_runs
WHERE job_name = 'send_daily_prompts'
ORDER BY started_at DESC
LIMIT 10;
```

### 6. Check Latest Job Status
```sql
-- Get the most recent job run
SELECT 
  started_at,
  completed_at,
  status,
  successful_sends,
  failed_sends,
  error_message
FROM cron_job_runs
WHERE job_name = 'send_daily_prompts'
ORDER BY started_at DESC
LIMIT 1;
```

### 7. Count Jobs by Status Today
```sql
SELECT 
  status,
  COUNT(*) as count
FROM cron_job_runs
WHERE 
  job_name = 'send_daily_prompts'
  AND started_at >= CURRENT_DATE
GROUP BY status;
```

### 8. View Failed Jobs with Error Messages
```sql
SELECT 
  started_at,
  error_message,
  total_users,
  failed_sends
FROM cron_job_runs
WHERE 
  job_name = 'send_daily_prompts'
  AND status = 'failed'
ORDER BY started_at DESC
LIMIT 10;
```

### 9. Average Execution Time (Last Week)
```sql
SELECT 
  AVG(execution_time_ms) as avg_ms,
  MIN(execution_time_ms) as min_ms,
  MAX(execution_time_ms) as max_ms
FROM cron_job_runs
WHERE 
  job_name = 'send_daily_prompts'
  AND started_at >= NOW() - INTERVAL '7 days'
  AND status = 'success';
```

### 10. Success Rate by Day (Last 7 Days)
```sql
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*) * 100,
    2
  ) as success_rate_percent
FROM cron_job_runs
WHERE 
  job_name = 'send_daily_prompts'
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

---

## Maintenance Queries

### Clean Up Old Logs (Older than 30 days)
```sql
SELECT cleanup_old_cron_logs();
```

### Check Table Size
```sql
SELECT 
  COUNT(*) as total_records,
  pg_size_pretty(pg_total_relation_size('cron_job_runs')) as table_size
FROM cron_job_runs;
```

---

## Testing Your Daily Prompt Email

### Check Your User Settings
```sql
-- Verify your email preferences and reminder time
SELECT 
  id,
  email,
  daily_reminders,
  reminder_time,
  notifications_enabled,
  subscription_status
FROM profiles
WHERE email = 'your-email@example.com';
```

### Check if You Completed Today's Prompt
```sql
-- See if you have a reflection for today
SELECT 
  created_at,
  mood,
  prompt
FROM reflections
WHERE 
  user_id = 'your-user-id-here'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

### Manually Trigger Job (Admin Panel)
Go to Admin Panel → Cron Jobs → Click "Run Now" for `send_daily_prompts`

Or call the API directly:
```bash
curl -X POST https://your-domain.com/api/cron/send-daily-prompts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Troubleshooting

### No Emails Received?

1. **Check if cron is running:**
   ```sql
   SELECT * FROM get_recent_cron_runs('send_daily_prompts', 5);
   ```

2. **Check your reminder settings:**
   ```sql
   SELECT daily_reminders, reminder_time FROM profiles WHERE id = 'your-user-id';
   ```

3. **Check email delivery logs:**
   ```sql
   SELECT * FROM email_delivery_log 
   WHERE email_type = 'daily_prompt' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

4. **Verify Vercel cron is configured** (if using Vercel):
   - Check `vercel.json` has the cron configuration
   - Environment variable `CRON_SECRET` is set

---

## Quick Setup Checklist

- [ ] Run the migration SQL in Supabase
- [ ] Set `daily_reminders = true` in your profile
- [ ] Set your preferred `reminder_time` (e.g., '09:00')
- [ ] Verify `CRON_SECRET` environment variable is set
- [ ] Test the cron endpoint manually
- [ ] Check the `cron_job_runs` table for logs
- [ ] Wait for scheduled time or manually trigger

---

**Need Help?** Check the logs in:
- Vercel Dashboard → Functions → Logs
- Supabase Dashboard → SQL Editor → Run queries above
