-- ============================================================================
-- FIX DAILY REMINDERS - Diagnostic and Fix Script
-- Run this in Supabase SQL Editor to diagnose and fix email notification issues
-- ============================================================================

-- 1. Check how many users have preferences and their daily_reminders status
SELECT 
    'Total user_preferences records' as metric,
    COUNT(*)::text as value
FROM user_preferences
UNION ALL
SELECT 
    'daily_reminders = true',
    COUNT(*)::text
FROM user_preferences WHERE daily_reminders = true
UNION ALL
SELECT 
    'daily_reminders = false',
    COUNT(*)::text
FROM user_preferences WHERE daily_reminders = false
UNION ALL
SELECT 
    'daily_reminders IS NULL',
    COUNT(*)::text
FROM user_preferences WHERE daily_reminders IS NULL;

-- 2. Check prompt_time values (this is what cron job uses)
SELECT 
    prompt_time,
    COUNT(*) as user_count
FROM user_preferences
GROUP BY prompt_time
ORDER BY user_count DESC;

-- 3. Check delivery_method distribution
SELECT 
    delivery_method,
    COUNT(*) as user_count
FROM user_preferences
GROUP BY delivery_method
ORDER BY user_count DESC;

-- 4. List users eligible for daily prompts with their settings
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.subscription_status,
    p.timezone_iana,
    p.timezone,
    up.daily_reminders,
    up.prompt_time,
    up.reminder_time,
    up.delivery_method,
    up.prompt_frequency
FROM profiles p
INNER JOIN user_preferences up ON p.id = up.user_id
WHERE up.daily_reminders = true
ORDER BY up.prompt_time;

-- 5. Check recent cron job runs and their results
SELECT 
    id,
    job_name,
    started_at,
    completed_at,
    status,
    total_users,
    successful_sends,
    failed_sends,
    execution_time_ms,
    metadata
FROM cron_job_runs
WHERE job_name = 'send_daily_prompts'
ORDER BY started_at DESC
LIMIT 20;

-- 6. Check recent email delivery logs
SELECT 
    id,
    user_id,
    email_type,
    recipient_email,
    status,
    error_message,
    sent_at
FROM email_delivery_log
WHERE email_type = 'daily_prompt'
ORDER BY sent_at DESC
LIMIT 20;

-- ============================================================================
-- FIXES - Uncomment and run these if needed
-- ============================================================================

-- FIX 1: Enable daily_reminders for all users who have NULL
-- UPDATE user_preferences 
-- SET daily_reminders = true,
--     updated_at = NOW()
-- WHERE daily_reminders IS NULL;

-- FIX 2: Set default prompt_time for users who have NULL
-- UPDATE user_preferences 
-- SET prompt_time = '09:00:00',
--     updated_at = NOW()
-- WHERE prompt_time IS NULL;

-- FIX 3: Set default delivery_method for users who have NULL
-- UPDATE user_preferences 
-- SET delivery_method = 'email',
--     updated_at = NOW()
-- WHERE delivery_method IS NULL;

-- FIX 4: Create preferences for users who completed signup but have no preferences
-- INSERT INTO user_preferences (
--     user_id, 
--     daily_reminders, 
--     prompt_time, 
--     delivery_method,
--     prompt_frequency,
--     created_at,
--     updated_at
-- )
-- SELECT 
--     p.id,
--     true,
--     '09:00:00',
--     'email',
--     'daily',
--     NOW(),
--     NOW()
-- FROM profiles p
-- LEFT JOIN user_preferences up ON p.id = up.user_id
-- WHERE up.user_id IS NULL
--   AND p.email IS NOT NULL
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION after running fixes
-- ============================================================================

-- Run this after fixes to verify:
-- SELECT 
--     COUNT(*) as total_users,
--     COUNT(CASE WHEN daily_reminders = true THEN 1 END) as reminders_enabled,
--     COUNT(CASE WHEN prompt_time IS NOT NULL THEN 1 END) as has_prompt_time,
--     COUNT(CASE WHEN delivery_method IS NOT NULL THEN 1 END) as has_delivery_method
-- FROM user_preferences;
