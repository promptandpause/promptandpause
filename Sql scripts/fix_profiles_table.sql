-- =====================================================
-- Fix Profiles Table - HTTP 400 Error Resolution
-- =====================================================
-- This SQL fixes the profiles table to allow auto-creation
-- Addresses: POST /profiles returning 400 Bad Request
-- =====================================================

-- First, check if profiles table exists and view its structure
-- Run this query first to see current state:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- Drop existing table if needed (CAREFUL - this deletes data)
-- Only run if you want to start fresh
-- DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table with all required columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Subscription fields
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'cancelled')),
  subscription_tier TEXT DEFAULT 'freemium' CHECK (subscription_tier IN ('freemium', 'premium')),
  subscription_end_date TIMESTAMPTZ,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Preferences
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  dark_mode BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can do everything (for server-side operations)
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON profiles;

CREATE TRIGGER profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT SELECT ON profiles TO anon;

-- =====================================================
-- Verification Queries
-- =====================================================

-- 1. Check table structure
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- 2. Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'profiles';

-- 3. Test insert (replace with actual user ID)
-- INSERT INTO profiles (id, email, subscription_status, subscription_tier)
-- VALUES (
--   'ca18568f-adb8-46d9-9e0e-66ae85bbc1c3',
--   'test@example.com',
--   'free',
--   'freemium'
-- );

-- 4. Check if profile exists for user
-- SELECT * FROM profiles WHERE id = 'ca18568f-adb8-46d9-9e0e-66ae85bbc1c3';
