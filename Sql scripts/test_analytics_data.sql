-- ============================================================================
-- Test Analytics Data - Run this in Supabase SQL Editor
-- ============================================================================
-- This script will help diagnose why analytics is showing zeros

-- 1. Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('calculate_mrr', 'get_engagement_stats', 'get_daily_engagement');

-- 2. Check if admin_user_stats view exists
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'admin_user_stats';

-- 3. Test get_engagement_stats function
SELECT * FROM get_engagement_stats(30);

-- 4. Check if prompts_history table has data
SELECT COUNT(*) as total_prompts FROM prompts_history;

-- 5. Check if reflections table has data
SELECT COUNT(*) as total_reflections FROM reflections;

-- 6. Check recent prompts (last 30 days)
SELECT COUNT(*) as prompts_last_30_days 
FROM prompts_history 
WHERE date_generated >= CURRENT_DATE - INTERVAL '30 days';

-- 7. Check recent reflections (last 30 days)
SELECT COUNT(*) as reflections_last_30_days 
FROM reflections 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 8. Check admin_user_stats view data
SELECT COUNT(*) as total_users FROM admin_user_stats;

-- 9. Sample data from admin_user_stats
SELECT 
  user_id,
  email,
  total_prompts,
  total_reflections,
  engagement_rate_percent,
  activity_status
FROM admin_user_stats 
LIMIT 5;

-- 10. Check if there are any errors in the function
SELECT * FROM get_engagement_stats(90);
