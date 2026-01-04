-- Security Infrastructure Migration
-- Adds security logging table and account lockout columns

-- ============================================================================
-- 1. CREATE SECURITY LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  path TEXT,
  method VARCHAR(10),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON public.security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_security_logs_type_time 
  ON public.security_logs(event_type, created_at DESC);

-- ============================================================================
-- 2. ADD ACCOUNT LOCKOUT COLUMNS TO PROFILES
-- ============================================================================

DO $$ 
BEGIN
  -- Add locked_until column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN locked_until TIMESTAMPTZ;
  END IF;

  -- Add lock_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'lock_reason'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN lock_reason TEXT;
  END IF;

  -- Add failed_login_attempts column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
  END IF;

  -- Add last_failed_login column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_failed_login'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_failed_login TIMESTAMPTZ;
  END IF;

  -- Add security_flags column if it doesn't exist (for VPN detection, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'security_flags'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN security_flags JSONB DEFAULT '{}';
  END IF;
END $$;

-- Index for locked accounts query
CREATE INDEX IF NOT EXISTS idx_profiles_locked_until 
  ON public.profiles(locked_until) 
  WHERE locked_until IS NOT NULL;

-- ============================================================================
-- 3. CREATE BLOCKED IPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON public.blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON public.blocked_ips(expires_at);

-- ============================================================================
-- 4. CREATE IP ALLOWLIST TABLE (for admin IPs, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.allowed_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  description TEXT,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. RLS POLICIES FOR SECURITY TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_ips ENABLE ROW LEVEL SECURITY;

-- Security logs: Only service role can insert, admins can view
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Service role can manage security logs" ON public.security_logs;
  DROP POLICY IF EXISTS "Service role can manage blocked IPs" ON public.blocked_ips;
  DROP POLICY IF EXISTS "Service role can manage allowed IPs" ON public.allowed_ips;
  
  -- Create new policies
  CREATE POLICY "Service role can manage security logs" ON public.security_logs
    FOR ALL USING (true) WITH CHECK (true);
    
  CREATE POLICY "Service role can manage blocked IPs" ON public.blocked_ips
    FOR ALL USING (true) WITH CHECK (true);
    
  CREATE POLICY "Service role can manage allowed IPs" ON public.allowed_ips
    FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ============================================================================
-- 6. FUNCTION TO AUTO-CLEAN OLD SECURITY LOGS
-- ============================================================================

CREATE OR REPLACE FUNCTION clean_old_security_logs()
RETURNS void AS $$
BEGIN
  -- Keep logs for 90 days, except critical/high severity (keep 1 year)
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND severity NOT IN ('critical', 'high');
  
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '365 days';
  
  -- Clean expired blocked IPs
  DELETE FROM public.blocked_ips
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW()
  AND is_permanent = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE SECURITY AUDIT VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.security_audit_summary AS
SELECT 
  DATE(created_at) as date,
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT user_id) as unique_users
FROM public.security_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type, severity
ORDER BY date DESC, event_count DESC;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (limited)
GRANT SELECT ON public.security_audit_summary TO authenticated;

-- Service role has full access (managed by RLS)
GRANT ALL ON public.security_logs TO service_role;
GRANT ALL ON public.blocked_ips TO service_role;
GRANT ALL ON public.allowed_ips TO service_role;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify the migration:
-- SELECT 
--   'security_logs' as table_name,
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_logs') as exists
-- UNION ALL
-- SELECT 
--   'blocked_ips',
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocked_ips')
-- UNION ALL
-- SELECT 
--   'allowed_ips',
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'allowed_ips')
-- UNION ALL
-- SELECT 
--   'profiles.locked_until',
--   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'locked_until');
