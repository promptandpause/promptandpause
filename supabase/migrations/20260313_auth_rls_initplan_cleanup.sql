DROP POLICY IF EXISTS "Users can view own email log" ON "public"."email_delivery_log";
CREATE POLICY "Users can view own email log" ON "public"."email_delivery_log" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their own email logs" ON "public"."email_logs";
CREATE POLICY "Users can view their own email logs" ON "public"."email_logs" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete own focus areas" ON "public"."focus_areas";
CREATE POLICY "Users can delete own focus areas" ON "public"."focus_areas" FOR DELETE TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert own focus areas" ON "public"."focus_areas";
CREATE POLICY "Users can insert own focus areas" ON "public"."focus_areas" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own focus areas" ON "public"."focus_areas";
CREATE POLICY "Users can update own focus areas" ON "public"."focus_areas" FOR UPDATE TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own focus areas" ON "public"."focus_areas";
CREATE POLICY "Users can view own focus areas" ON "public"."focus_areas" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own monthly summaries" ON "public"."monthly_reflection_summaries";
CREATE POLICY "Users can view own monthly summaries" ON "public"."monthly_reflection_summaries" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their monthly summaries" ON "public"."monthly_reflection_summaries";
CREATE POLICY "Users can view their monthly summaries" ON "public"."monthly_reflection_summaries" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own moods" ON "public"."moods";
CREATE POLICY "Users can manage own moods" ON "public"."moods" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own moods" ON "public"."moods";
CREATE POLICY "Users can view own moods" ON "public"."moods" FOR SELECT TO public USING (((select auth.uid()) = user_id));

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

DROP POLICY IF EXISTS "usage_delete" ON "public"."prompt_focus_area_usage";
CREATE POLICY "usage_delete" ON "public"."prompt_focus_area_usage" FOR DELETE TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "usage_insert" ON "public"."prompt_focus_area_usage";
CREATE POLICY "usage_insert" ON "public"."prompt_focus_area_usage" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "usage_select" ON "public"."prompt_focus_area_usage";
CREATE POLICY "usage_select" ON "public"."prompt_focus_area_usage" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON "public"."push_subscriptions";
CREATE POLICY "Users can delete own subscriptions" ON "public"."push_subscriptions" FOR DELETE TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON "public"."push_subscriptions";
CREATE POLICY "Users can insert own subscriptions" ON "public"."push_subscriptions" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own subscriptions" ON "public"."push_subscriptions";
CREATE POLICY "Users can view own subscriptions" ON "public"."push_subscriptions" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert their resurfacing events" ON "public"."reflection_resurfacing_events";
CREATE POLICY "Users can insert their resurfacing events" ON "public"."reflection_resurfacing_events" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their resurfacing events" ON "public"."reflection_resurfacing_events";
CREATE POLICY "Users can view their resurfacing events" ON "public"."reflection_resurfacing_events" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can create own reflections" ON "public"."reflections";
CREATE POLICY "Users can create own reflections" ON "public"."reflections" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete own reflections" ON "public"."reflections";
CREATE POLICY "Users can delete own reflections" ON "public"."reflections" FOR DELETE TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert own reflections" ON "public"."reflections";
CREATE POLICY "Users can insert own reflections" ON "public"."reflections" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own reflections" ON "public"."reflections";
CREATE POLICY "Users can update own reflections" ON "public"."reflections" FOR UPDATE TO public USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own reflections" ON "public"."reflections";
CREATE POLICY "Users can view own reflections" ON "public"."reflections" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own subscription" ON "public"."subscriptions";
CREATE POLICY "Users can view own subscription" ON "public"."subscriptions" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can add responses to their tickets" ON "public"."support_request_responses";
CREATE POLICY "Users can add responses to their tickets" ON "public"."support_request_responses" FOR INSERT TO public WITH CHECK (((request_id IN ( SELECT support_requests.id
   FROM support_requests
  WHERE (support_requests.user_id = (select auth.uid())))) AND ((author_type)::text = 'user'::text) AND (author_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Users can view responses on their tickets" ON "public"."support_request_responses";
CREATE POLICY "Users can view responses on their tickets" ON "public"."support_request_responses" FOR SELECT TO public USING ((request_id IN ( SELECT support_requests.id
   FROM support_requests
  WHERE (support_requests.user_id = (select auth.uid())))));

DROP POLICY IF EXISTS "Users can create support requests" ON "public"."support_requests";
CREATE POLICY "Users can create support requests" ON "public"."support_requests" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own open requests" ON "public"."support_requests";
CREATE POLICY "Users can update own open requests" ON "public"."support_requests" FOR UPDATE TO public USING ((((select auth.uid()) = user_id) AND (status = 'open'::text) AND (admin_response IS NULL)));

DROP POLICY IF EXISTS "Users can view own support requests" ON "public"."support_requests";
CREATE POLICY "Users can view own support requests" ON "public"."support_requests" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can add responses to their tickets" ON "public"."support_responses";
CREATE POLICY "Users can add responses to their tickets" ON "public"."support_responses" FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = support_responses.ticket_id) AND (support_tickets.user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "Users can create responses" ON "public"."support_responses";
CREATE POLICY "Users can create responses" ON "public"."support_responses" FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = support_responses.ticket_id) AND (support_tickets.user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "Users can view responses to own tickets" ON "public"."support_responses";
CREATE POLICY "Users can view responses to own tickets" ON "public"."support_responses" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = support_responses.ticket_id) AND (support_tickets.user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "Users can view responses to their tickets" ON "public"."support_responses";
CREATE POLICY "Users can view responses to their tickets" ON "public"."support_responses" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = support_responses.ticket_id) AND (support_tickets.user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "Users can view their team memberships" ON "public"."support_team_members";
CREATE POLICY "Users can view their team memberships" ON "public"."support_team_members" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can create support tickets" ON "public"."support_tickets";
CREATE POLICY "Users can create support tickets" ON "public"."support_tickets" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can create tickets" ON "public"."support_tickets";
CREATE POLICY "Users can create tickets" ON "public"."support_tickets" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own tickets" ON "public"."support_tickets";
CREATE POLICY "Users can update own tickets" ON "public"."support_tickets" FOR UPDATE TO public USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own tickets" ON "public"."support_tickets";
CREATE POLICY "Users can view own tickets" ON "public"."support_tickets" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their own support tickets" ON "public"."support_tickets";
CREATE POLICY "Users can view their own support tickets" ON "public"."support_tickets" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete own achievements" ON "public"."user_achievements";
CREATE POLICY "Users can delete own achievements" ON "public"."user_achievements" FOR DELETE TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert own achievements" ON "public"."user_achievements";
CREATE POLICY "Users can insert own achievements" ON "public"."user_achievements" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own achievements" ON "public"."user_achievements";
CREATE POLICY "Users can update own achievements" ON "public"."user_achievements" FOR UPDATE TO public USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own achievements" ON "public"."user_achievements";
CREATE POLICY "Users can view own achievements" ON "public"."user_achievements" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert own preferences" ON "public"."user_preferences";
CREATE POLICY "Users can insert own preferences" ON "public"."user_preferences" FOR INSERT TO public WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own age consent" ON "public"."user_preferences";
CREATE POLICY "Users can manage own age consent" ON "public"."user_preferences" FOR ALL TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own preferences" ON "public"."user_preferences";
CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE TO public USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own preferences" ON "public"."user_preferences";
CREATE POLICY "Users can view own preferences" ON "public"."user_preferences" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own profile" ON "public"."users";
CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO public USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can view own profile" ON "public"."users";
CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT TO public USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can view own weekly insights" ON "public"."weekly_insights_cache";
CREATE POLICY "Users can view own weekly insights" ON "public"."weekly_insights_cache" FOR SELECT TO public USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their own weekly insights" ON "public"."weekly_insights_cache";
CREATE POLICY "Users can view their own weekly insights" ON "public"."weekly_insights_cache" FOR SELECT TO public USING (((select auth.uid()) = user_id));
