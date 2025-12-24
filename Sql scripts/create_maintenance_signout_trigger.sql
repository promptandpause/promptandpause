-- =====================================================
-- Maintenance Mode Sign Out Trigger
-- =====================================================
-- This trigger automatically signs out all users when
-- maintenance mode is turned OFF (is_enabled changes from true to false)
-- This ensures a clean state after maintenance is completed
-- =====================================================

-- Function to sign out all users by invalidating their sessions
CREATE OR REPLACE FUNCTION sign_out_all_users_on_maintenance_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if maintenance mode is being turned OFF (true -> false)
  IF OLD.is_enabled = true AND NEW.is_enabled = false THEN
    
    -- Log the event
    RAISE NOTICE 'Maintenance mode disabled - signing out all users';
    
    -- Delete all active sessions from auth.sessions table
    -- This will force all users to re-authenticate
    DELETE FROM auth.sessions;
    
    -- Optional: Log this action in admin activity logs
    INSERT INTO admin_activity_log (
      action,
      details,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      'maintenance_mode_disabled_signout',
      jsonb_build_object(
        'message', 'All users signed out due to maintenance mode being disabled',
        'timestamp', NOW()
      ),
      '127.0.0.1',
      'System Trigger',
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS maintenance_mode_signout_trigger ON maintenance_mode;

-- Create trigger that fires AFTER maintenance_mode is updated
CREATE TRIGGER maintenance_mode_signout_trigger
  AFTER UPDATE ON maintenance_mode
  FOR EACH ROW
  EXECUTE FUNCTION sign_out_all_users_on_maintenance_end();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sign_out_all_users_on_maintenance_end() TO authenticated;
GRANT EXECUTE ON FUNCTION sign_out_all_users_on_maintenance_end() TO service_role;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the trigger was created successfully:
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'maintenance_mode_signout_trigger';
