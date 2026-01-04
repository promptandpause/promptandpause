-- ============================================================================
-- VERIFY TRIAL USER DOWNGRADE
-- ============================================================================
-- Run this to check if any trial users should be downgraded
-- ============================================================================

-- Check for trial users who should be downgraded
SELECT 
    id,
    email,
    subscription_status,
    subscription_tier,
    is_trial,
    trial_end_date,
    subscription_end_date,
    CASE 
        WHEN is_trial = true 
        AND trial_end_date IS NOT NULL 
        AND trial_end_date < NOW()
        AND (subscription_status != 'active' OR subscription_status IS NULL)
        THEN 'SHOULD_DOWNGRADE'
        ELSE 'OK'
    END as status
FROM public.profiles
WHERE is_trial = true
ORDER BY trial_end_date DESC;

-- Manually downgrade expired trial users (run if needed)
UPDATE public.profiles
SET 
    subscription_status = 'free',
    subscription_tier = 'free',
    is_trial = false,
    trial_end_date = null,
    subscription_end_date = null,
    updated_at = NOW()
WHERE is_trial = true 
    AND trial_end_date IS NOT NULL 
    AND trial_end_date < NOW()
    AND (subscription_status != 'active' OR subscription_status IS NULL);

-- Verify the downgrade worked
SELECT 
    id,
    email,
    subscription_status,
    subscription_tier,
    is_trial,
    trial_end_date,
    subscription_end_date
FROM public.profiles
WHERE is_trial = false
    AND subscription_status = 'free'
    AND subscription_tier = 'free'
ORDER BY updated_at DESC
LIMIT 10;
