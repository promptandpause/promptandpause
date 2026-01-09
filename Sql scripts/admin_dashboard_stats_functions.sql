-- ============================================================================
-- Admin Dashboard Stats Functions
-- ============================================================================
-- This file contains PostgreSQL functions to power the admin dashboard
-- with real-time statistics about users, revenue, and engagement.
--
-- Run this in Supabase SQL Editor to create the functions.
-- ============================================================================

-- ============================================================================
-- Drop Existing Functions (if they exist)
-- ============================================================================
DROP FUNCTION IF EXISTS calculate_mrr();
DROP FUNCTION IF EXISTS get_engagement_stats(INTEGER);
DROP FUNCTION IF EXISTS get_daily_engagement(INTEGER);

-- ============================================================================
-- 1. Calculate MRR (Monthly Recurring Revenue)
-- ============================================================================
-- Returns total MRR, subscription counts, and user counts
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS TABLE (
  total_mrr NUMERIC,
  monthly_subs BIGINT,
  annual_subs BIGINT,
  free_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH subscription_counts AS (
    SELECT
      -- Count monthly subscribers (£12/month)
      COUNT(*) FILTER (
        WHERE subscription_status = 'premium' 
        AND billing_cycle = 'monthly'
      ) AS monthly_count,
      
      -- Count annual subscribers (£99/year = £8.25/month MRR)
      COUNT(*) FILTER (
        WHERE subscription_status = 'premium' 
        AND billing_cycle = 'yearly'
      ) AS annual_count,
      
      -- Count free users
      COUNT(*) FILTER (
        WHERE subscription_status IS NULL 
        OR subscription_status = 'free'
        OR subscription_status = 'freemium'
        OR subscription_status = 'cancelled'
      ) AS free_count
    FROM profiles
  )
  SELECT
    -- Total MRR: (monthly_subs * £12) + (annual_subs * £8.25)
    (monthly_count * 12.00 + annual_count * 8.25)::NUMERIC AS total_mrr,
    monthly_count AS monthly_subs,
    annual_count AS annual_subs,
    free_count AS free_users
  FROM subscription_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Get Engagement Stats
-- ============================================================================
-- Returns engagement metrics for the specified time period
CREATE OR REPLACE FUNCTION get_engagement_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_prompts_sent BIGINT,
  total_reflections BIGINT,
  overall_engagement_rate NUMERIC,
  avg_reflection_length NUMERIC
) AS $$
DECLARE
  cutoff_date TIMESTAMP;
BEGIN
  cutoff_date := NOW() - (days_back || ' days')::INTERVAL;
  
  RETURN QUERY
  WITH stats AS (
    SELECT
      -- Count total prompts sent in period
      (SELECT COUNT(*) 
       FROM prompts_history 
       WHERE created_at >= cutoff_date) AS prompts_count,
      
      -- Count total reflections in period
      (SELECT COUNT(*) 
       FROM reflections 
       WHERE created_at >= cutoff_date) AS reflections_count,
      
      -- Calculate average reflection length
      (SELECT AVG(LENGTH(reflection_text))::NUMERIC 
       FROM reflections 
       WHERE created_at >= cutoff_date 
       AND reflection_text IS NOT NULL) AS avg_length
  )
  SELECT
    prompts_count AS total_prompts_sent,
    reflections_count AS total_reflections,
    -- Engagement rate: (reflections / prompts) * 100
    CASE 
      WHEN prompts_count > 0 
      THEN ROUND((reflections_count::NUMERIC / prompts_count::NUMERIC) * 100, 1)
      ELSE 0
    END AS overall_engagement_rate,
    COALESCE(avg_length, 0) AS avg_reflection_length
  FROM stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Get Daily Engagement Trends
-- ============================================================================
-- Returns daily engagement data for charts/graphs
CREATE OR REPLACE FUNCTION get_daily_engagement(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  prompts_sent BIGINT,
  reflections_created BIGINT,
  engagement_rate NUMERIC,
  active_users BIGINT
) AS $$
DECLARE
  cutoff_date TIMESTAMP;
BEGIN
  cutoff_date := NOW() - (days_back || ' days')::INTERVAL;
  
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      DATE(cutoff_date),
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS day
  ),
  daily_prompts AS (
    SELECT
      DATE(created_at) AS day,
      COUNT(*) AS count
    FROM prompts_history
    WHERE created_at >= cutoff_date
    GROUP BY DATE(created_at)
  ),
  daily_reflections AS (
    SELECT
      DATE(created_at) AS day,
      COUNT(*) AS count,
      COUNT(DISTINCT user_id) AS users
    FROM reflections
    WHERE created_at >= cutoff_date
    GROUP BY DATE(created_at)
  )
  SELECT
    ds.day AS date,
    COALESCE(dp.count, 0) AS prompts_sent,
    COALESCE(dr.count, 0) AS reflections_created,
    CASE 
      WHEN COALESCE(dp.count, 0) > 0 
      THEN ROUND((COALESCE(dr.count, 0)::NUMERIC / dp.count::NUMERIC) * 100, 1)
      ELSE 0
    END AS engagement_rate,
    COALESCE(dr.users, 0) AS active_users
  FROM date_series ds
  LEFT JOIN daily_prompts dp ON ds.day = dp.day
  LEFT JOIN daily_reflections dr ON ds.day = dr.day
  ORDER BY ds.day DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Admin User Stats View (for Analytics Page)
-- ============================================================================
-- Creates a comprehensive view of user statistics for the analytics dashboard
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

FROM profiles p;

-- Grant access to the view
GRANT SELECT ON admin_user_stats TO authenticated;

-- ============================================================================
-- 5. Email Stats Function (for Email Tracking Page)
-- ============================================================================
-- Returns email delivery and engagement statistics
DROP FUNCTION IF EXISTS get_email_stats();

CREATE OR REPLACE FUNCTION get_email_stats()
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_bounced BIGINT,
  total_opened BIGINT,
  delivery_rate NUMERIC,
  open_rate NUMERIC,
  bounce_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH email_counts AS (
    SELECT
      COUNT(*) AS sent_count,
      COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')) AS delivered_count,
      COUNT(*) FILTER (WHERE status = 'bounced') AS bounced_count,
      COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) AS opened_count
    FROM email_logs
  )
  SELECT
    sent_count AS total_sent,
    delivered_count AS total_delivered,
    bounced_count AS total_bounced,
    opened_count AS total_opened,
    -- Delivery rate: (delivered / sent) * 100
    CASE 
      WHEN sent_count > 0 
      THEN ROUND((delivered_count::NUMERIC / sent_count::NUMERIC) * 100, 1)
      ELSE 0
    END AS delivery_rate,
    -- Open rate: (opened / delivered) * 100
    CASE 
      WHEN delivered_count > 0 
      THEN ROUND((opened_count::NUMERIC / delivered_count::NUMERIC) * 100, 1)
      ELSE 0
    END AS open_rate,
    -- Bounce rate: (bounced / sent) * 100
    CASE 
      WHEN sent_count > 0 
      THEN ROUND((bounced_count::NUMERIC / sent_count::NUMERIC) * 100, 1)
      ELSE 0
    END AS bounce_rate
  FROM email_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant Execute Permissions
-- ============================================================================
-- Allow authenticated users to execute these functions
-- (Admin auth is checked in the API layer)

GRANT EXECUTE ON FUNCTION calculate_mrr() TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_engagement(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_stats() TO authenticated;

-- ============================================================================
-- Test Queries (Optional - for verification)
-- ============================================================================
-- Uncomment to test the functions and view after creation:

-- SELECT * FROM calculate_mrr();
-- SELECT * FROM get_engagement_stats(30);
-- SELECT * FROM get_daily_engagement(7);
-- SELECT * FROM admin_user_stats LIMIT 10;
-- SELECT * FROM get_email_stats();
