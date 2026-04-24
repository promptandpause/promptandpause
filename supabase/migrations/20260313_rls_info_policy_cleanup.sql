DROP POLICY IF EXISTS "Service role full access to admin_activity_logs" ON public.admin_activity_logs;
CREATE POLICY "Service role full access to admin_activity_logs"
  ON public.admin_activity_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage email_template_customizations" ON public.email_template_customizations;
CREATE POLICY "Service role can manage email_template_customizations"
  ON public.email_template_customizations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage email_template_version_history" ON public.email_template_version_history;
CREATE POLICY "Service role can manage email_template_version_history"
  ON public.email_template_version_history
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage email_templates" ON public.email_templates;
CREATE POLICY "Service role can manage email_templates"
  ON public.email_templates
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage hubspot_sync_log" ON public.hubspot_sync_log;
CREATE POLICY "Service role can manage hubspot_sync_log"
  ON public.hubspot_sync_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage prompt_library" ON public.prompt_library;
CREATE POLICY "Service role can manage prompt_library"
  ON public.prompt_library
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
