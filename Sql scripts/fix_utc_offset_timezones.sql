-- ============================================================================
-- FIX UTC OFFSET TIMEZONES
-- Convert UTC offset formats to proper IANA timezone names
-- ============================================================================

-- Current state: Some users have timezones stored as "UTC-05:00" format
-- This doesn't work with JavaScript's toLocaleString() function
-- We need to convert these to proper IANA timezone names

-- 1. Check current timezone formats
SELECT 
    timezone,
    timezone_iana,
    COUNT(*) as user_count
FROM profiles
GROUP BY timezone, timezone_iana
ORDER BY user_count DESC;

-- 2. Common UTC offset to IANA timezone mappings
-- UTC-05:00 (EST/CDT) → Most likely "America/New_York" or "America/Chicago"
-- UTC-06:00 (CST/MDT) → Most likely "America/Chicago" or "America/Denver"
-- UTC-07:00 (MST/PDT) → Most likely "America/Denver" or "America/Los_Angeles"
-- UTC-08:00 (PST)     → Most likely "America/Los_Angeles"
-- UTC+00:00 (GMT/UTC) → "Europe/London" or "UTC"
-- UTC+01:00 (CET)     → "Europe/Paris" or "Europe/Berlin"

-- ============================================================================
-- FIXES - Update profiles with proper IANA timezones
-- ============================================================================

-- FIX 1: Update UTC-05:00 to America/New_York (Eastern Time)
-- This is the most common US timezone
UPDATE profiles
SET timezone = 'America/New_York',
    timezone_iana = 'America/New_York',
    updated_at = NOW()
WHERE timezone = 'UTC-05:00'
   OR timezone_iana = 'UTC-05:00';

-- FIX 2: Update UTC-06:00 to America/Chicago (Central Time)
UPDATE profiles
SET timezone = 'America/Chicago',
    timezone_iana = 'America/Chicago',
    updated_at = NOW()
WHERE timezone = 'UTC-06:00'
   OR timezone_iana = 'UTC-06:00';

-- FIX 3: Update UTC-07:00 to America/Denver (Mountain Time)
UPDATE profiles
SET timezone = 'America/Denver',
    timezone_iana = 'America/Denver',
    updated_at = NOW()
WHERE timezone = 'UTC-07:00'
   OR timezone_iana = 'UTC-07:00';

-- FIX 4: Update UTC-08:00 to America/Los_Angeles (Pacific Time)
UPDATE profiles
SET timezone = 'America/Los_Angeles',
    timezone_iana = 'America/Los_Angeles',
    updated_at = NOW()
WHERE timezone = 'UTC-08:00'
   OR timezone_iana = 'UTC-08:00';

-- FIX 5: Update UTC+00:00 to Europe/London (GMT/BST)
UPDATE profiles
SET timezone = 'Europe/London',
    timezone_iana = 'Europe/London',
    updated_at = NOW()
WHERE timezone = 'UTC+00:00'
   OR timezone_iana = 'UTC+00:00'
   OR timezone = 'UTC';

-- FIX 6: Update any NULL timezones to Europe/London (default)
UPDATE profiles
SET timezone = 'Europe/London',
    timezone_iana = 'Europe/London',
    updated_at = NOW()
WHERE (timezone IS NULL OR timezone_iana IS NULL)
  AND email IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check updated timezones
SELECT 
    timezone,
    timezone_iana,
    COUNT(*) as user_count
FROM profiles
WHERE email IS NOT NULL
GROUP BY timezone, timezone_iana
ORDER BY user_count DESC;

-- Verify all users with preferences have valid timezones
SELECT 
    p.email,
    p.timezone,
    p.timezone_iana,
    up.prompt_time,
    up.daily_reminders
FROM profiles p
INNER JOIN user_preferences up ON p.id = up.user_id
WHERE up.daily_reminders = true
ORDER BY p.timezone;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running these updates, the cron job will now correctly:
-- 1. Calculate the current hour in each user's timezone
-- 2. Determine the day of week for frequency checks
-- 3. Send emails to ALL users at their configured times, not just those with IANA timezones
-- 
-- The code now supports BOTH formats going forward:
-- - IANA: "America/New_York", "Europe/London", etc.
-- - UTC offsets: "UTC-05:00", "UTC+01:00", etc. (for backwards compatibility)
