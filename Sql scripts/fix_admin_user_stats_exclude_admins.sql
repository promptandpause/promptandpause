-- ============================================================================
-- Fix: Exclude admin emails from admin_user_stats view
-- ============================================================================
-- This ensures admins never appear in user exports, analytics, or counts

DROP VIEW IF EXISTS admin_user_stats;

CREATE VIEW admin_user_stats AS
SELECT
  p.id AS user_id,
  p.email,
  p.full_name,
  p.subscription_status,
  p.billing_cycle,
  p.created_at,
  
  -- Count prompts from prompts_history
  COALESCE(
    (SELECT COUNT(*) 
     FROM prompts_history ph 
     WHERE ph.user_id = p.id), 
    0
  ) AS total_prompts,
  
  -- Count reflections
  COALESCE(
    (SELECT COUNT(*) 
     FROM reflections r 
     WHERE r.user_id = p.id), 
    0
  ) AS total_reflections,
  
  -- Calculate engagement rate
  CASE 
    WHEN COALESCE((SELECT COUNT(*) FROM prompts_history ph WHERE ph.user_id = p.id), 0) > 0 
    THEN ROUND(
      COALESCE((SELECT COUNT(*) FROM reflections r WHERE r.user_id = p.id), 0)::NUMERIC / 
      COALESCE((SELECT COUNT(*) FROM prompts_history ph WHERE ph.user_id = p.id), 1)::NUMERIC * 100, 
      1
    )
    ELSE 0
  END AS engagement_rate_percent,
  
  -- Determine activity status based on last activity
  CASE
    WHEN COALESCE((
      SELECT MAX(created_at) 
      FROM reflections r 
      WHERE r.user_id = p.id
    ), '1970-01-01'::TIMESTAMP) >= NOW() - INTERVAL '7 days' THEN 'active'
    WHEN COALESCE((
      SELECT MAX(created_at) 
      FROM reflections r 
      WHERE r.user_id = p.id
    ), '1970-01-01'::TIMESTAMP) >= NOW() - INTERVAL '30 days' THEN 'moderate'
    WHEN COALESCE((
      SELECT MAX(created_at) 
      FROM reflections r 
      WHERE r.user_id = p.id
    ), '1970-01-01'::TIMESTAMP) >= NOW() - INTERVAL '90 days' THEN 'inactive'
    ELSE 'dormant'
  END AS activity_status,
  
  -- Last activity timestamp
  (
    SELECT MAX(created_at) 
    FROM reflections r 
    WHERE r.user_id = p.id
  ) AS last_activity_at

FROM profiles p
-- CRITICAL: Exclude admin emails from user-facing queries
WHERE p.email NOT LIKE '%@promptandpause.com';

-- Grant access to the view
GRANT SELECT ON admin_user_stats TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW admin_user_stats IS 'User statistics for admin dashboard. Excludes admin accounts (@promptandpause.com) to maintain separation between users and operators.';
