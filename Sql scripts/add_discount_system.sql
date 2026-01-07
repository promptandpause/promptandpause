-- =====================================================
-- Student & NHS Discount System - Database Migration
-- =====================================================
-- This migration adds support for discounted subscriptions
-- (Student & NHS at 40% off) via distinct Stripe prices
-- =====================================================

-- 1. Add discount tracking columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('student', 'nhs')),
  ADD COLUMN IF NOT EXISTS discount_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMPTZ;

-- Create index for discount lookups
CREATE INDEX IF NOT EXISTS idx_profiles_discount_type ON profiles(discount_type) WHERE discount_type IS NOT NULL;

-- 2. Create discount_invitations table for admin-managed discount flow
CREATE TABLE IF NOT EXISTS public.discount_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and admin info
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Discount details
  discount_type TEXT NOT NULL CHECK (discount_type IN ('student', 'nhs')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Stripe checkout
  stripe_checkout_session_id TEXT,
  stripe_checkout_url TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  
  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  
  CONSTRAINT unique_pending_invitation UNIQUE (user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for discount_invitations
CREATE INDEX IF NOT EXISTS idx_discount_invitations_user_id ON discount_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_invitations_admin_id ON discount_invitations(admin_id);
CREATE INDEX IF NOT EXISTS idx_discount_invitations_status ON discount_invitations(status);
CREATE INDEX IF NOT EXISTS idx_discount_invitations_expires_at ON discount_invitations(expires_at) WHERE status = 'pending';

-- 3. Enable RLS on discount_invitations
ALTER TABLE public.discount_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own discount invitations" ON discount_invitations;
DROP POLICY IF EXISTS "Service role can manage discount invitations" ON discount_invitations;

-- Policy: Users can view their own discount invitations
CREATE POLICY "Users can view own discount invitations"
  ON discount_invitations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for admin operations, cron jobs, and webhooks)
-- Admin operations are handled via API routes that use service role client
CREATE POLICY "Service role can manage discount invitations"
  ON discount_invitations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Create or update subscription_events table (if not exists)
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  stripe_event_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subscription_events
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- Enable RLS on subscription_events
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscription events" ON subscription_events;
DROP POLICY IF EXISTS "Service role can manage subscription events" ON subscription_events;

-- Policy: Users can view their own events
CREATE POLICY "Users can view own subscription events"
  ON subscription_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for admin operations, webhooks, and cron jobs)
-- Admin operations are handled via API routes that use service role client
CREATE POLICY "Service role can manage subscription events"
  ON subscription_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Grant permissions
GRANT ALL ON discount_invitations TO authenticated;
GRANT ALL ON discount_invitations TO service_role;
GRANT SELECT ON discount_invitations TO anon;

GRANT ALL ON subscription_events TO authenticated;
GRANT ALL ON subscription_events TO service_role;
GRANT SELECT ON subscription_events TO anon;

-- 6. Create function to expire old discount invitations
CREATE OR REPLACE FUNCTION expire_discount_invitations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE discount_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verification queries (comment out after running)
-- SELECT * FROM discount_invitations LIMIT 10;
-- SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;
-- SELECT id, email, discount_type, discount_verified_at FROM profiles WHERE discount_type IS NOT NULL;

-- 8. Test the expiry function (comment out after testing)
-- SELECT expire_discount_invitations();
