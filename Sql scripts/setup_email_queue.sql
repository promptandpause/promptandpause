-- =====================================================
-- Email Queue System for Welcome Emails
-- =====================================================
-- Ensures all users (OAuth and email/password) receive welcome emails
-- Uses queue table + cron job for reliable delivery
-- =====================================================

-- Step 1: Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'trial_expiration', 'weekly_digest', 'daily_prompt')),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_email_type ON email_queue(email_type);

-- Step 3: Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Service role can manage email queue" ON email_queue;

CREATE POLICY "Service role can manage email queue"
  ON email_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 5: Grant permissions
GRANT ALL ON email_queue TO service_role;
GRANT SELECT ON email_queue TO authenticated;

-- Step 6: Create function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS TABLE(processed INTEGER, sent INTEGER, failed INTEGER) AS $$
DECLARE
  processed_count INTEGER := 0;
  sent_count INTEGER := 0;
  failed_count INTEGER := 0;
BEGIN
  -- This function is called by the cron job
  -- It marks emails as ready to be sent by the API
  -- The actual sending happens in the API endpoint
  
  -- Count pending emails
  SELECT COUNT(*) INTO processed_count
  FROM email_queue
  WHERE status = 'pending'
    AND scheduled_for <= NOW()
    AND retry_count < 3;
  
  -- Return counts
  RETURN QUERY SELECT processed_count, sent_count, failed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant execute permission
GRANT EXECUTE ON FUNCTION process_email_queue() TO service_role;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if table exists
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'email_queue'
-- ORDER BY ordinal_position;

-- Check pending emails
-- SELECT 
--   id,
--   email_type,
--   recipient_email,
--   recipient_name,
--   scheduled_for,
--   status,
--   retry_count
-- FROM email_queue
-- WHERE status = 'pending'
-- ORDER BY scheduled_for ASC;

-- Check sent emails (last 24 hours)
-- SELECT 
--   email_type,
--   recipient_email,
--   sent_at,
--   status
-- FROM email_queue
-- WHERE sent_at > NOW() - INTERVAL '24 hours'
-- ORDER BY sent_at DESC;

-- Manual cleanup (delete old sent emails)
-- DELETE FROM email_queue
-- WHERE status = 'sent'
--   AND sent_at < NOW() - INTERVAL '30 days';
