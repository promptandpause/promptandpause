-- ============================================================================
-- Create Admin User (SQL-only method)
-- ============================================================================
-- This script creates an admin user with an encrypted password.
-- 
-- IMPORTANT: 
-- - Passwords are hashed using bcrypt (Supabase Auth default)
-- - Password is NEVER stored in plain text
-- - Only the bcrypt hash is visible in auth.users
-- 
-- Usage:
-- 1. Replace placeholders with actual values
-- 2. Run in Supabase SQL Editor
-- 3. The user will be created in auth.users AND admin_users table
-- ============================================================================

DO $$
DECLARE
  v_admin_email TEXT := 'superadmin@promptandpause.com';
  v_admin_password TEXT := 'X9mQ2rT7vK4pN8sL1cD6hF0yW3aZ5eGJ';
  v_admin_full_name TEXT := 'System Admin';
  v_admin_role TEXT := 'super_admin';
  v_department TEXT := 'Operations';
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Validate email domain
  IF v_admin_email NOT LIKE '%@promptandpause.com' THEN
    RAISE EXCEPTION 'Admin email must end with @promptandpause.com';
  END IF;

  -- Validate role
  IF v_admin_role NOT IN ('super_admin', 'admin', 'employee') THEN
    RAISE EXCEPTION 'Invalid role. Must be: super_admin, admin, or employee';
  END IF;

  -- Check if user already exists
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = v_admin_email
  ) THEN
    RAISE EXCEPTION 'User with email % already exists', v_admin_email;
  END IF;

  -- Generate UUID for the user
  v_user_id := gen_random_uuid();

  -- Hash password using bcrypt (Supabase Auth standard)
  -- This uses pgcrypto extension (available in Supabase)
  SELECT crypt(v_admin_password, gen_salt('bf')) INTO v_encrypted_password;

  -- Insert into auth.users (Supabase Auth table)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_admin_email,
    v_encrypted_password,
    NOW(),
    jsonb_build_object(
      'full_name', v_admin_full_name,
      'is_admin', true,
      'admin_role', v_admin_role
    ),
    NOW(),
    NOW(),
    NOW()
  );

  -- Insert into profiles table
  INSERT INTO profiles (
    id,
    email,
    full_name,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_admin_email,
    v_admin_full_name,
    NOW(),
    NOW()
  );

  -- Insert into admin_users table (source of truth for admin access)
  INSERT INTO admin_users (
    user_id,
    email,
    full_name,
    role,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_admin_email,
    v_admin_full_name,
    v_admin_role,
    v_department,
    true,
    NOW(),
    NOW()
  );

  -- Log the admin creation
  INSERT INTO admin_activity_logs (
    admin_email,
    action_type,
    target_type,
    target_id,
    details,
    ip_address,
    created_at
  ) VALUES (
    'system',
    'admin_user_created',
    'admin_user',
    v_user_id,
    jsonb_build_object(
      'role', v_admin_role,
      'department', v_department,
      'method', 'sql_script'
    ),
    '127.0.0.1',
    NOW()
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin user created successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', v_admin_email;
  RAISE NOTICE 'Password: % (REMEMBER THIS - it will not be shown again)', v_admin_password;
  RAISE NOTICE 'Role: %', v_admin_role;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IMPORTANT: Change this password after first login!';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- Verification Query (run after creation to verify)
-- ============================================================================
-- Check that the user was created in auth.users
-- SELECT id, email, email_confirmed_at, created_at 
-- FROM auth.users 
-- WHERE email = 'admin@promptandpause.com';

-- Check that the user was created in admin_users
-- SELECT user_id, email, role, is_active, created_at 
-- FROM admin_users 
-- WHERE email = 'admin@promptandpause.com';

-- Check that the user was created in profiles
-- SELECT id, email, full_name, created_at 
-- FROM profiles 
-- WHERE email = 'admin@promptandpause.com';

-- Check the activity log
-- SELECT * FROM admin_activity_logs 
-- WHERE action_type = 'admin_user_created' 
-- ORDER BY created_at DESC 
-- LIMIT 1;

-- ============================================================================
-- Password Hash Verification (for reference only)
-- ============================================================================
-- The password is stored as a bcrypt hash in auth.users.encrypted_password
-- Format: $2b$12$... (bcrypt format)
-- 
-- To verify a password matches the hash:
-- SELECT crypt('your_password', encrypted_password) = encrypted_password 
-- FROM auth.users 
-- WHERE email = 'admin@promptandpause.com';
-- 
-- Returns: true if password matches, false otherwise
-- ============================================================================
