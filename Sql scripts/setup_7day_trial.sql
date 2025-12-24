-- =====================================================
-- 7-Day Free Premium Trial Setup
-- =====================================================
-- Automatically gives all new users 7 days of premium access
-- Auto-reverts to free tier after trial expires
-- =====================================================

-- Step 1: Add trial fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;

-- Step 2: Remove any existing signup triggers (trial happens AFTER onboarding)
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
DROP FUNCTION IF EXISTS create_profile_with_trial();

-- Step 3: Ensure RLS policies allow profile creation
-- Drop existing policies first (no error if they don't exist)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Create policies
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Note: Profile with 7-day trial will be created during onboarding completion
-- See app/api/onboarding/route.ts for implementation

-- Step 4: Create function to check and expire trials
CREATE OR REPLACE FUNCTION expire_trial_subscriptions()
RETURNS void AS $$
BEGIN
  -- Update profiles where trial has expired
  UPDATE profiles
  SET 
    subscription_status = 'free',
    subscription_tier = 'freemium',
    is_trial = false,
    updated_at = NOW()
  WHERE 
    is_trial = true 
    AND trial_end_date < NOW()
    AND subscription_status = 'premium';
    
  -- Log how many trials were expired
  RAISE NOTICE 'Expired % trial subscriptions', (
    SELECT COUNT(*) 
    FROM profiles 
    WHERE is_trial = false 
      AND trial_end_date < NOW() 
      AND trial_end_date > NOW() - INTERVAL '1 minute'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION expire_trial_subscriptions() TO service_role;

-- Step 6: Create index for faster trial expiration checks
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date 
ON profiles(trial_end_date) 
WHERE is_trial = true;

-- =====================================================
-- Manual Operations
-- =====================================================

-- Give existing users 7-day trial (run once)
-- UPDATE profiles
-- SET 
--   subscription_status = 'premium',
--   subscription_tier = 'premium',
--   trial_start_date = NOW(),
--   trial_end_date = NOW() + INTERVAL '7 days',
--   is_trial = true,
--   updated_at = NOW()
-- WHERE 
--   subscription_status = 'free'
--   AND trial_start_date IS NULL;

-- Manually expire trials (for testing)
-- SELECT expire_trial_subscriptions();

-- Check trial status for all users
-- SELECT 
--   id,
--   email,
--   subscription_status,
--   subscription_tier,
--   is_trial,
--   trial_start_date,
--   trial_end_date,
--   CASE 
--     WHEN is_trial AND trial_end_date > NOW() THEN 'Active Trial'
--     WHEN is_trial AND trial_end_date <= NOW() THEN 'Expired Trial'
--     ELSE 'No Trial'
--   END as trial_status,
--   CASE
--     WHEN is_trial AND trial_end_date > NOW() THEN trial_end_date - NOW()
--     ELSE NULL
--   END as time_remaining
-- FROM profiles
-- ORDER BY created_at DESC;

-- =====================================================
-- Verification Queries
-- =====================================================

-- 1. Check if trigger exists
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created_create_profile';

-- 2. Check if new columns exist
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('trial_start_date', 'trial_end_date', 'is_trial');

-- 3. Test profile creation (creates a test user - don't run in production)
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at
-- ) VALUES (
--   gen_random_uuid(),
--   'test-trial@example.com',
--   crypt('password123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- 4. Verify profile was created with trial
-- SELECT * FROM profiles WHERE email = 'test-trial@example.com';
