-- =========================================================================
-- CRITICAL SECURITY FIX: Enable RLS on ALL User Data Tables
-- =========================================================================
-- This script ensures Row Level Security is enabled on every table
-- containing user data, with deny-by-default policies.
--
-- RUN THIS IMMEDIATELY - Missing RLS = catastrophic privacy breach risk
-- =========================================================================

-- 1. PROFILES TABLE (uses 'id' not 'user_id')
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. REFLECTIONS TABLE
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reflections" ON public.reflections;
CREATE POLICY "Users can view own reflections"
  ON public.reflections
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reflections" ON public.reflections;
CREATE POLICY "Users can insert own reflections"
  ON public.reflections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reflections" ON public.reflections;
CREATE POLICY "Users can update own reflections"
  ON public.reflections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reflections" ON public.reflections;
CREATE POLICY "Users can delete own reflections"
  ON public.reflections
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3. PROMPTS_HISTORY TABLE
ALTER TABLE public.prompts_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prompts" ON public.prompts_history;
CREATE POLICY "Users can view own prompts"
  ON public.prompts_history
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prompts" ON public.prompts_history;
CREATE POLICY "Users can insert own prompts"
  ON public.prompts_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. WEEKLY_INSIGHTS_CACHE TABLE
ALTER TABLE public.weekly_insights_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weekly insights" ON public.weekly_insights_cache;
CREATE POLICY "Users can view own weekly insights"
  ON public.weekly_insights_cache
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage weekly insights" ON public.weekly_insights_cache;
CREATE POLICY "Service role can manage weekly insights"
  ON public.weekly_insights_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. MONTHLY_REFLECTION_SUMMARIES TABLE
ALTER TABLE public.monthly_reflection_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own monthly summaries" ON public.monthly_reflection_summaries;
CREATE POLICY "Users can view own monthly summaries"
  ON public.monthly_reflection_summaries
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage monthly summaries" ON public.monthly_reflection_summaries;
CREATE POLICY "Service role can manage monthly summaries"
  ON public.monthly_reflection_summaries
  FOR ALL
  USING (auth.role() = 'service_role');

-- 6. USER_PREFERENCES TABLE
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. MOOD_ENTRIES TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mood_entries'
  ) THEN
    EXECUTE 'ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own moods" ON public.mood_entries';
    EXECUTE 'CREATE POLICY "Users can view own moods" ON public.mood_entries FOR SELECT USING (auth.uid() = user_id)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own moods" ON public.mood_entries';
    EXECUTE 'CREATE POLICY "Users can insert own moods" ON public.mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- 8. ACHIEVEMENTS TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'achievements'
  ) THEN
    EXECUTE 'ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements';
    EXECUTE 'CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage achievements" ON public.achievements';
    EXECUTE 'CREATE POLICY "Service role can manage achievements" ON public.achievements FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- 9. NOTIFICATION_PREFERENCES TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_preferences'
  ) THEN
    EXECUTE 'ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own notification prefs" ON public.notification_preferences';
    EXECUTE 'CREATE POLICY "Users can view own notification prefs" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own notification prefs" ON public.notification_preferences';
    EXECUTE 'CREATE POLICY "Users can update own notification prefs" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- =========================================================================
-- VERIFICATION QUERIES
-- =========================================================================
-- Run these to confirm RLS is enabled:

-- Check RLS status on all tables:
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'reflections',
    'prompts_history',
    'weekly_insights_cache',
    'monthly_reflection_summaries',
    'user_preferences',
    'mood_entries',
    'achievements',
    'notification_preferences'
  )
ORDER BY tablename;

-- Check policies on critical tables:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'reflections',
    'prompts_history',
    'weekly_insights_cache',
    'monthly_reflection_summaries',
    'user_preferences'
  )
ORDER BY tablename, policyname;
