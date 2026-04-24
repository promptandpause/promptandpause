DROP POLICY IF EXISTS "Service role full access to admin_activity_log" ON "public"."admin_activity_log";
CREATE POLICY "Service role full access to admin_activity_log" ON "public"."admin_activity_log" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to admin_activity_logs" ON "public"."admin_activity_logs";
CREATE POLICY "Service role full access to admin_activity_logs" ON "public"."admin_activity_logs" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on admin_otp_codes" ON "public"."admin_otp_codes";
CREATE POLICY "Service role full access on admin_otp_codes" ON "public"."admin_otp_codes" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on admin_sessions" ON "public"."admin_sessions";
CREATE POLICY "Service role full access on admin_sessions" ON "public"."admin_sessions" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to admin_users" ON "public"."admin_users";
CREATE POLICY "Service role full access to admin_users" ON "public"."admin_users" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage allowed IPs" ON "public"."allowed_ips";
CREATE POLICY "Service role can manage allowed IPs" ON "public"."allowed_ips" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage blocked IPs" ON "public"."blocked_ips";
CREATE POLICY "Service role can manage blocked IPs" ON "public"."blocked_ips" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own breathing sessions" ON "public"."breathing_sessions";
CREATE POLICY "Users can manage own breathing sessions" ON "public"."breathing_sessions" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Anyone can insert crisis tool usage" ON "public"."crisis_tool_usage";
CREATE POLICY "Anyone can insert crisis tool usage" ON "public"."crisis_tool_usage" FOR INSERT TO public WITH CHECK (((user_id IS NULL) OR ((select auth.uid()) = user_id)));

DROP POLICY IF EXISTS "Users can view own crisis tool usage" ON "public"."crisis_tool_usage";
CREATE POLICY "Users can view own crisis tool usage" ON "public"."crisis_tool_usage" FOR SELECT TO public USING ((((select auth.uid()) = user_id) OR (user_id IS NULL)));

DROP POLICY IF EXISTS "Allow full access to service role" ON "public"."cron_job_runs";
CREATE POLICY "Allow full access to service role" ON "public"."cron_job_runs" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to anonymous users" ON "public"."cron_job_runs";
CREATE POLICY "Allow read access to anonymous users" ON "public"."cron_job_runs" FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow read access to authenticated users" ON "public"."cron_job_runs";
CREATE POLICY "Allow read access to authenticated users" ON "public"."cron_job_runs" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own daily affirmations" ON "public"."daily_affirmations";
CREATE POLICY "Users can insert own daily affirmations" ON "public"."daily_affirmations" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can read own daily affirmations" ON "public"."daily_affirmations";
CREATE POLICY "Users can read own daily affirmations" ON "public"."daily_affirmations" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own daily affirmations" ON "public"."daily_affirmations";
CREATE POLICY "Users can update own daily affirmations" ON "public"."daily_affirmations" FOR UPDATE TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own daily rituals" ON "public"."daily_rituals";
CREATE POLICY "Users can manage own daily rituals" ON "public"."daily_rituals" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Service role can manage discount invitations" ON "public"."discount_invitations";
CREATE POLICY "Service role can manage discount invitations" ON "public"."discount_invitations" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own discount invitations" ON "public"."discount_invitations";
CREATE POLICY "Users can view own discount invitations" ON "public"."discount_invitations" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Service role can manage email queue" ON "public"."email_queue";
CREATE POLICY "Service role can manage email queue" ON "public"."email_queue" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage email_template_customizations" ON "public"."email_template_customizations";
CREATE POLICY "Service role can manage email_template_customizations" ON "public"."email_template_customizations" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage email_template_version_history" ON "public"."email_template_version_history";
CREATE POLICY "Service role can manage email_template_version_history" ON "public"."email_template_version_history" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage email_templates" ON "public"."email_templates";
CREATE POLICY "Service role can manage email_templates" ON "public"."email_templates" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can check gift status by token" ON "public"."gift_subscriptions";
CREATE POLICY "Public can check gift status by token" ON "public"."gift_subscriptions" FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role can manage gifts" ON "public"."gift_subscriptions";
CREATE POLICY "Service role can manage gifts" ON "public"."gift_subscriptions" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own received gifts" ON "public"."gift_subscriptions";
CREATE POLICY "Users can view own received gifts" ON "public"."gift_subscriptions" FOR SELECT TO public USING (((select auth.uid()) = recipient_user_id));

DROP POLICY IF EXISTS "Users can manage own goals" ON "public"."goals";
CREATE POLICY "Users can manage own goals" ON "public"."goals" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own gratitude entries" ON "public"."gratitude_entries";
CREATE POLICY "Users can manage own gratitude entries" ON "public"."gratitude_entries" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own habit logs" ON "public"."habit_logs";
CREATE POLICY "Users can manage own habit logs" ON "public"."habit_logs" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own habits" ON "public"."habits";
CREATE POLICY "Users can manage own habits" ON "public"."habits" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Service role can manage hubspot_sync_log" ON "public"."hubspot_sync_log";
CREATE POLICY "Service role can manage hubspot_sync_log" ON "public"."hubspot_sync_log" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert IP logs" ON "public"."ip_logs";
CREATE POLICY "Service role can insert IP logs" ON "public"."ip_logs" FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own IP logs" ON "public"."ip_logs";
CREATE POLICY "Users can view own IP logs" ON "public"."ip_logs" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Service role can manage monthly summaries" ON "public"."monthly_reflection_summaries";
CREATE POLICY "Service role can manage monthly summaries" ON "public"."monthly_reflection_summaries" FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Users can view own monthly summaries" ON "public"."monthly_reflection_summaries";
CREATE POLICY "Users can view own monthly summaries" ON "public"."monthly_reflection_summaries" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their monthly summaries" ON "public"."monthly_reflection_summaries";
CREATE POLICY "Users can view their monthly summaries" ON "public"."monthly_reflection_summaries" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Service role can manage mood insights" ON "public"."mood_insights";
CREATE POLICY "Service role can manage mood insights" ON "public"."mood_insights" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own mood insights" ON "public"."mood_insights";
CREATE POLICY "Users can view own mood insights" ON "public"."mood_insights" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Service role can manage all profiles" ON "public"."profiles";
CREATE POLICY "Service role can manage all profiles" ON "public"."profiles" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON "public"."profiles";
CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO public WITH CHECK (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can update own age verification" ON "public"."profiles";
CREATE POLICY "Users can update own age verification" ON "public"."profiles" FOR UPDATE TO public USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";
CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO public USING (((select auth.uid()) = id)) WITH CHECK (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can view own age verification" ON "public"."profiles";
CREATE POLICY "Users can view own age verification" ON "public"."profiles" FOR SELECT TO public USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can view own profile" ON "public"."profiles";
CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO public USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Service role can manage prompt_library" ON "public"."prompt_library";
CREATE POLICY "Service role can manage prompt_library" ON "public"."prompt_library" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own prompts" ON "public"."prompts_history";
CREATE POLICY "Users can insert own prompts" ON "public"."prompts_history" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own prompts" ON "public"."prompts_history";
CREATE POLICY "Users can view own prompts" ON "public"."prompts_history" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own ritual completions" ON "public"."ritual_completions";
CREATE POLICY "Users can manage own ritual completions" ON "public"."ritual_completions" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own self journals" ON "public"."self_journals";
CREATE POLICY "Users can manage own self journals" ON "public"."self_journals" FOR ALL TO public USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Service role can manage subscription events" ON "public"."subscription_events";
CREATE POLICY "Service role can manage subscription events" ON "public"."subscription_events" FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own subscription events" ON "public"."subscription_events";
CREATE POLICY "Users can view own subscription events" ON "public"."subscription_events" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Service role full access to responses" ON "public"."support_responses";

DROP POLICY IF EXISTS "Users can add responses to their tickets" ON "public"."support_responses";

DROP POLICY IF EXISTS "Users can create responses" ON "public"."support_responses";

DROP POLICY IF EXISTS "Users can view responses to own tickets" ON "public"."support_responses";

DROP POLICY IF EXISTS "Users can view responses to their tickets" ON "public"."support_responses";

DROP POLICY IF EXISTS "Service role full access to tickets" ON "public"."support_tickets";

DROP POLICY IF EXISTS "Users can create support tickets" ON "public"."support_tickets";

DROP POLICY IF EXISTS "Users can create tickets" ON "public"."support_tickets";

DROP POLICY IF EXISTS "Users can update own tickets" ON "public"."support_tickets";

DROP POLICY IF EXISTS "Users can view own tickets" ON "public"."support_tickets";

DROP POLICY IF EXISTS "Users can view their own support tickets" ON "public"."support_tickets";

DROP POLICY IF EXISTS "Users can insert own preferences" ON "public"."user_preferences";

DROP POLICY IF EXISTS "Users can manage own age consent" ON "public"."user_preferences";

DROP POLICY IF EXISTS "Users can update own preferences" ON "public"."user_preferences";

DROP POLICY IF EXISTS "Users can view own preferences" ON "public"."user_preferences";

DROP POLICY IF EXISTS "Service role can manage weekly insights" ON "public"."weekly_insights_cache";

DROP POLICY IF EXISTS "Users can view own weekly insights" ON "public"."weekly_insights_cache";

DROP POLICY IF EXISTS "Users can view their own weekly insights" ON "public"."weekly_insights_cache";

DROP POLICY IF EXISTS "Users can manage own weekly intentions" ON "public"."weekly_intentions";
CREATE POLICY "Users can manage own weekly intentions" ON "public"."weekly_intentions" FOR ALL TO public USING (((select auth.uid()) = user_id));

CREATE POLICY "Service role full access to tickets" ON public.support_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (((select auth.uid()) = user_id));
CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (((select auth.uid()) = user_id));

CREATE POLICY "Service role full access to responses" ON public.support_responses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can create responses" ON public.support_responses FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1 FROM support_tickets WHERE ((support_tickets.id = support_responses.ticket_id) AND (support_tickets.user_id = (select auth.uid()))))));
CREATE POLICY "Users can view responses to own tickets" ON public.support_responses FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM support_tickets WHERE ((support_tickets.id = support_responses.ticket_id) AND (support_tickets.user_id = (select auth.uid()))))));

CREATE POLICY "Service role can manage weekly insights" ON public.weekly_insights_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own weekly insights" ON public.weekly_insights_cache FOR SELECT TO authenticated USING (((select auth.uid()) = user_id));

CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL TO authenticated USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));