CREATE OR REPLACE VIEW public.admin_user_stats
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  p.email,
  p.full_name,
  p.subscription_status,
  p.billing_cycle,
  p.created_at,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM public.prompts_history ph
      WHERE ph.user_id = p.id
    ),
    0
  ) AS total_prompts,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM public.reflections r
      WHERE r.user_id = p.id
    ),
    0
  ) AS total_reflections,
  CASE
    WHEN COALESCE((SELECT COUNT(*) FROM public.prompts_history ph WHERE ph.user_id = p.id), 0) > 0
      THEN ROUND(
        COALESCE((SELECT COUNT(*) FROM public.reflections r WHERE r.user_id = p.id), 0)::NUMERIC /
        COALESCE((SELECT COUNT(*) FROM public.prompts_history ph WHERE ph.user_id = p.id), 1)::NUMERIC * 100,
        1
      )
    ELSE 0
  END AS engagement_rate_percent,
  CASE
    WHEN COALESCE((
      SELECT MAX(created_at)
      FROM public.reflections r
      WHERE r.user_id = p.id
    ), '1970-01-01'::TIMESTAMP) >= NOW() - INTERVAL '7 days' THEN 'active'
    WHEN COALESCE((
      SELECT MAX(created_at)
      FROM public.reflections r
      WHERE r.user_id = p.id
    ), '1970-01-01'::TIMESTAMP) >= NOW() - INTERVAL '30 days' THEN 'moderate'
    WHEN COALESCE((
      SELECT MAX(created_at)
      FROM public.reflections r
      WHERE r.user_id = p.id
    ), '1970-01-01'::TIMESTAMP) >= NOW() - INTERVAL '90 days' THEN 'inactive'
    ELSE 'dormant'
  END AS activity_status,
  (
    SELECT MAX(created_at)
    FROM public.reflections r
    WHERE r.user_id = p.id
  ) AS last_activity_at
FROM public.profiles p
WHERE p.email NOT LIKE '%@promptandpause.com';

GRANT SELECT ON public.admin_user_stats TO authenticated;

CREATE OR REPLACE VIEW public.security_audit_summary
WITH (security_invoker = true) AS
SELECT
  DATE(created_at) AS date,
  event_type,
  severity,
  COUNT(*) AS event_count,
  COUNT(DISTINCT ip_address) AS unique_ips,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.security_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type, severity
ORDER BY date DESC, event_count DESC;

GRANT SELECT ON public.security_audit_summary TO authenticated;

ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_journals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own self journals" ON public.self_journals;
CREATE POLICY "Users can manage own self journals"
  ON public.self_journals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to admin_activity_log" ON public.admin_activity_log;
CREATE POLICY "Service role full access to admin_activity_log"
  ON public.admin_activity_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on admin_otp_codes" ON public.admin_otp_codes;
CREATE POLICY "Service role full access on admin_otp_codes"
  ON public.admin_otp_codes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on admin_sessions" ON public.admin_sessions;
CREATE POLICY "Service role full access on admin_sessions"
  ON public.admin_sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to admin_users" ON public.admin_users;
CREATE POLICY "Service role full access to admin_users"
  ON public.admin_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage allowed IPs" ON public.allowed_ips;
CREATE POLICY "Service role can manage allowed IPs"
  ON public.allowed_ips
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage blocked IPs" ON public.blocked_ips;
CREATE POLICY "Service role can manage blocked IPs"
  ON public.blocked_ips
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can insert crisis tool usage" ON public.crisis_tool_usage;
CREATE POLICY "Anyone can insert crisis tool usage"
  ON public.crisis_tool_usage
  FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert IP logs" ON public.ip_logs;
CREATE POLICY "Service role can insert IP logs"
  ON public.ip_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage mood insights" ON public.mood_insights;
CREATE POLICY "Service role can manage mood insights"
  ON public.mood_insights
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage security logs" ON public.security_logs;
CREATE POLICY "Service role can manage security logs"
  ON public.security_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to responses" ON public.support_responses;
CREATE POLICY "Service role full access to responses"
  ON public.support_responses
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to tickets" ON public.support_tickets;
CREATE POLICY "Service role full access to tickets"
  ON public.support_tickets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert weekly insights" ON public.weekly_insights_cache;
DROP POLICY IF EXISTS "Service role can update weekly insights" ON public.weekly_insights_cache;
DROP POLICY IF EXISTS "Service role can manage weekly insights" ON public.weekly_insights_cache;
CREATE POLICY "Service role can manage weekly insights"
  ON public.weekly_insights_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER FUNCTION public.update_support_request_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.handle_focus_areas_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.increment_focus_area_reflection_count() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_maintenance_windows_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.validate_weekend_maintenance() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.decrement_focus_area_reflection_count() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_monthly_reflection_summaries_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_maintenance_mode_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_support_ticket_timestamp() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.generate_redemption_token() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.is_super_admin(user_email text) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.check_age_compliance() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.detect_country_from_ip(ip_address inet) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.clean_old_security_logs() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.expire_unredeemed_gifts() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_weekly_insights_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.get_support_team_id_by_name(team_name text) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.auto_assign_support_ticket(ticket_id uuid) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.trigger_auto_assign_support_ticket() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_push_subscriptions_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_gift_subscriptions_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_admin_user_timestamp() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.is_admin_user(user_email text) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.expire_active_gift_subscriptions() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.expire_discount_invitations() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_password_set_flag() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.calculate_mrr() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.get_engagement_stats(days_back integer) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.get_daily_engagement(days_back integer) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.get_email_stats() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.expire_trial_subscriptions() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_maintenance_status_cache() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.get_support_stats() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.get_recent_cron_runs(job_name_filter text, limit_count integer) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_user_achievements_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.get_admin_role(user_email text) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.log_admin_activity(p_admin_email text, p_action_type text, p_target_type text, p_target_id uuid, p_details jsonb, p_ip_address text, p_user_agent text) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.update_profiles_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.cleanup_old_cron_logs() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.get_cron_job_stats(job_name_filter text, days_back integer) SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.process_email_queue() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.handle_updated_at() SET search_path = public, auth, extensions, cron, net, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth, extensions, cron, net, pg_temp;
