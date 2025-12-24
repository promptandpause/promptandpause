-- Create admin users system with role-based access control
-- Run this in Supabase SQL Editor to set up admin user management

-- ============================================================================
-- ADMIN USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'employee')),
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT email_domain_check CHECK (email LIKE '%@promptandpause.com')
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- ============================================================================
-- ADMIN ACTIVITY LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin Users Policies
-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to admin_users" ON admin_users;
CREATE POLICY "Service role full access to admin_users"
  ON admin_users
  USING (true)
  WITH CHECK (true);

-- Admin Activity Log Policies
-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to admin_activity_log" ON admin_activity_log;
CREATE POLICY "Service role full access to admin_activity_log"
  ON admin_activity_log
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on admin_users
CREATE OR REPLACE FUNCTION update_admin_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_timestamp ON admin_users;
CREATE TRIGGER update_admin_users_timestamp
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_user_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = user_email
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin user role
CREATE OR REPLACE FUNCTION get_admin_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM admin_users
  WHERE email = user_email
  AND is_active = true;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has super admin access
CREATE OR REPLACE FUNCTION is_super_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = user_email
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_email TEXT,
  p_action_type TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_admin_user_id UUID;
  v_log_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_user_id
  FROM admin_users
  WHERE email = p_admin_email;
  
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found: %', p_admin_email;
  END IF;
  
  -- Insert activity log
  INSERT INTO admin_activity_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    v_admin_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL SUPER ADMIN SETUP
-- ============================================================================

-- This will create a super admin entry for the existing admin email
-- You need to run this AFTER the table is created and update the email/user_id

-- Example (uncomment and update with your actual admin user details):
-- INSERT INTO admin_users (user_id, email, full_name, role, created_at)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'full_name', 'Super Admin'),
--   'super_admin',
--   NOW()
-- FROM auth.users
-- WHERE email = 'your-admin@promptandpause.com'
-- ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================

-- Check if tables exist
SELECT 
  'admin_users' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_users'
  ) AS exists;

SELECT 
  'admin_activity_log' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_activity_log'
  ) AS exists;

-- Show all admin users (if any)
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM admin_users
ORDER BY created_at DESC;
