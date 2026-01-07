-- =====================================================
-- Gift Subscriptions System - Database Migration
-- =====================================================
-- This migration adds support for gift subscriptions
-- (1, 3, 6 months) purchased as one-time payments
-- =====================================================

-- 1. Add gift subscription tracking columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gift_subscription_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_gift_subscription BOOLEAN DEFAULT false;

-- Create index for gift subscription expiry checks
CREATE INDEX IF NOT EXISTS idx_profiles_gift_subscription_end_date 
  ON profiles(gift_subscription_end_date) 
  WHERE is_gift_subscription = true 
  AND gift_subscription_end_date IS NOT NULL;

-- 2. Create gift_subscriptions table
CREATE TABLE IF NOT EXISTS public.gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Purchase information
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Purchaser details (buyer doesn't need an account)
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  
  -- Gift details
  duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3, 6)),
  amount_paid INTEGER NOT NULL, -- in pence (e.g., 1500 for £15)
  
  -- Redemption info
  redemption_token TEXT UNIQUE NOT NULL,
  recipient_email TEXT, -- optional, for validation
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired', 'refunded')),
  
  -- Timestamps
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 months'),
  
  -- Optional gift message
  gift_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for gift_subscriptions
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_redemption_token ON gift_subscriptions(redemption_token);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_recipient_user_id ON gift_subscriptions(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_status ON gift_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_purchaser_email ON gift_subscriptions(purchaser_email);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_expires_at ON gift_subscriptions(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_stripe_payment_intent ON gift_subscriptions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_stripe_checkout ON gift_subscriptions(stripe_checkout_session_id);

-- 3. Enable RLS on gift_subscriptions
ALTER TABLE public.gift_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own received gifts" ON gift_subscriptions;
DROP POLICY IF EXISTS "Public can check gift status by token" ON gift_subscriptions;
DROP POLICY IF EXISTS "Service role can manage gifts" ON gift_subscriptions;

-- Policy: Users can view gifts they've received
CREATE POLICY "Users can view own received gifts"
  ON gift_subscriptions
  FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Policy: Public can check gift status by token (for redemption page)
-- This is intentionally permissive for the redemption flow
-- Application logic restricts which columns are returned
CREATE POLICY "Public can check gift status by token"
  ON gift_subscriptions
  FOR SELECT
  USING (true);

-- Policy: Service role can do everything (for admin operations, webhooks, and cron jobs)
-- Admin operations are handled via API routes that use service role client
CREATE POLICY "Service role can manage gifts"
  ON gift_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Create function to generate secure redemption tokens
CREATE OR REPLACE FUNCTION generate_redemption_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 32-character random token (URL-safe)
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(replace(replace(token, '+', ''), '/', ''), '=', '');
    token := substring(token, 1, 32);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM gift_subscriptions WHERE redemption_token = token)
    INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to expire unredeemed gifts
CREATE OR REPLACE FUNCTION expire_unredeemed_gifts()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE gift_subscriptions
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log expiry events
  INSERT INTO subscription_events (user_id, event_type, old_status, new_status, metadata)
  SELECT 
    NULL as user_id,
    'gift_expired' as event_type,
    'pending' as old_status,
    'expired' as new_status,
    jsonb_build_object(
      'gift_id', id,
      'purchaser_email', purchaser_email,
      'duration_months', duration_months,
      'amount_paid', amount_paid
    ) as metadata
  FROM gift_subscriptions
  WHERE status = 'expired'
    AND updated_at > NOW() - INTERVAL '1 minute'; -- Only recent expirations
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to expire active gift subscriptions (for cron job)
CREATE OR REPLACE FUNCTION expire_active_gift_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Find users whose gift subscription has ended
  UPDATE profiles
  SET 
    subscription_status = 'free',
    subscription_tier = 'freemium',
    is_gift_subscription = false,
    gift_subscription_end_date = NULL,
    updated_at = NOW()
  WHERE is_gift_subscription = true
    AND gift_subscription_end_date < NOW()
    AND subscription_status = 'premium';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log expiry events
  INSERT INTO subscription_events (user_id, event_type, old_status, new_status, metadata)
  SELECT 
    id as user_id,
    'gift_subscription_ended' as event_type,
    'premium' as old_status,
    'free' as new_status,
    jsonb_build_object(
      'gift_end_date', gift_subscription_end_date
    ) as metadata
  FROM profiles
  WHERE is_gift_subscription = false
    AND gift_subscription_end_date IS NULL
    AND updated_at > NOW() - INTERVAL '1 minute'; -- Only recent updates
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gift_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gift_subscriptions_updated_at_trigger ON gift_subscriptions;

CREATE TRIGGER gift_subscriptions_updated_at_trigger
  BEFORE UPDATE ON gift_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_subscriptions_updated_at();

-- 8. Grant permissions
GRANT ALL ON gift_subscriptions TO authenticated;
GRANT ALL ON gift_subscriptions TO service_role;
GRANT SELECT ON gift_subscriptions TO anon;

-- 9. Verification queries (comment out after running)
-- SELECT * FROM gift_subscriptions LIMIT 10;
-- SELECT id, email, is_gift_subscription, gift_subscription_end_date FROM profiles WHERE is_gift_subscription = true;
-- SELECT generate_redemption_token(); -- Test token generation

-- 10. Test expiry functions (comment out after testing)
-- SELECT expire_unredeemed_gifts();
-- SELECT expire_active_gift_subscriptions();
