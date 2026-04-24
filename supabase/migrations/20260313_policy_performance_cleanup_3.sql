DROP POLICY IF EXISTS "Service role can manage security logs" ON public.security_logs;
CREATE POLICY "Service role can manage security logs" ON public.security_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own received gifts" ON public.gift_subscriptions;

DROP POLICY IF EXISTS "Allow authenticated read access to maintenance_mode" ON public.maintenance_mode;
DROP POLICY IF EXISTS "Authenticated users can read maintenance_mode" ON public.maintenance_mode;
CREATE POLICY "Authenticated users can read maintenance_mode" ON public.maintenance_mode FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service role full access to maintenance_mode" ON public.maintenance_mode;
DROP POLICY IF EXISTS "Service role has full access to maintenance_mode" ON public.maintenance_mode;
CREATE POLICY "Service role has full access to maintenance_mode" ON public.maintenance_mode FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own monthly summaries" ON public.monthly_reflection_summaries;
DROP POLICY IF EXISTS "Users can view their monthly summaries" ON public.monthly_reflection_summaries;
CREATE POLICY "Users can view own monthly summaries" ON public.monthly_reflection_summaries FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own moods" ON public.moods;
DROP POLICY IF EXISTS "Users can view own moods" ON public.moods;
CREATE POLICY "Users can manage own moods" ON public.moods FOR ALL TO public USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own age verification" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO public USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can update own age verification" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO public USING (((select auth.uid()) = id)) WITH CHECK (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can create own reflections" ON public.reflections;
DROP POLICY IF EXISTS "Users can insert own reflections" ON public.reflections;
CREATE POLICY "Users can insert own reflections" ON public.reflections FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Anonymous users can submit support requests" ON public.support_requests;
DROP POLICY IF EXISTS "Users can create support requests" ON public.support_requests;
CREATE POLICY "Users can create support requests" ON public.support_requests FOR INSERT TO public WITH CHECK ((((select auth.uid()) = user_id) OR ((user_id IS NULL) AND ((source)::text = ANY ((ARRAY['homepage_form'::character varying, 'email'::character varying])::text[])))));
