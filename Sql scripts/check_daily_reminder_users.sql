-- ============================================================================
-- Check Users Eligible for Daily Reminders
-- Run this in Supabase SQL Editor to debug email notification issues
-- ============================================================================

-- 1. Check if user_preferences table exists and has daily_reminders column
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Count users with daily_reminders enabled
SELECT 
    COUNT(*) as total_users_with_preferences,
    COUNT(CASE WHEN daily_reminders = true THEN 1 END) as daily_reminders_enabled,
    COUNT(CASE WHEN daily_reminders = false THEN 1 END) as daily_reminders_disabled,
    COUNT(CASE WHEN daily_reminders IS NULL THEN 1 END) as daily_reminders_null
FROM user_preferences;

-- 3. List all users eligible for daily prompts (detailed view)
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.subscription_status,
    p.timezone_iana,
    p.timezone,
    up.daily_reminders,
    up.reminder_time,
    up.delivery_method,
    up.focus_areas
FROM profiles p
LEFT JOIN user_preferences up ON p.id = up.user_id
WHERE p.email IS NOT NULL
ORDER BY up.daily_reminders DESC NULLS LAST, p.created_at DESC;

-- 4. Find users who SHOULD receive emails but might be missing preferences
SELECT 
    p.id,
    p.email,
    p.full_name,
    CASE 
        WHEN up.user_id IS NULL THEN 'NO PREFERENCES RECORD'
        WHEN up.daily_reminders IS NULL THEN 'daily_reminders IS NULL'
        WHEN up.daily_reminders = false THEN 'daily_reminders DISABLED'
        ELSE 'ELIGIBLE'
    END as status
FROM profiles p
LEFT JOIN user_preferences up ON p.id = up.user_id
WHERE p.email IS NOT NULL;

-- 5. Check if any users have preferences but no profile (orphaned records)
SELECT up.* 
FROM user_preferences up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE p.id IS NULL;

-- 6. Quick fix: Enable daily_reminders for all users who have NULL
-- UNCOMMENT THE LINES BELOW TO RUN THE FIX
/*
UPDATE user_preferences 
SET daily_reminders = true 
WHERE daily_reminders IS NULL;
*/

-- 7. Quick fix: Create default preferences for users missing them
-- UNCOMMENT THE LINES BELOW TO RUN THE FIX
/*
INSERT INTO user_preferences (user_id, daily_reminders, reminder_time, delivery_method)
SELECT 
    p.id,
    true,
    '09:00',
    'email'
FROM profiles p
LEFT JOIN user_preferences up ON p.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
*/
