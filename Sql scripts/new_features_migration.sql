-- =============================================================================
-- PROMPT & PAUSE - NEW FEATURES MIGRATION
-- Phase 1-3: Gratitude, Mood Insights, Goals, Habits, Breathing, Rituals
-- =============================================================================

-- =============================================================================
-- 1. GRATITUDE ENTRIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gratitude_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of gratitude items [{text, photo_url?}]
  reflection_id UUID REFERENCES public.reflections(id) ON DELETE SET NULL, -- Optional link to reflection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON public.gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_date ON public.gratitude_entries(entry_date DESC);

ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gratitude entries"
  ON public.gratitude_entries FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 2. GOALS TABLE (Premium Feature)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('personal', 'professional', 'wellness', 'relationships', 'financial', 'other')),
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  why_important TEXT, -- Purpose/motivation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_category ON public.goals(category);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 3. WEEKLY INTENTIONS TABLE (Premium Feature)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_intentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  intentions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of intentions
  reflection TEXT, -- End of week reflection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_intentions_user_id ON public.weekly_intentions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_intentions_week ON public.weekly_intentions(week_start DESC);

ALTER TABLE public.weekly_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weekly intentions"
  ON public.weekly_intentions FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. HABITS TABLE (Premium Feature)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✓', -- Emoji or icon name
  category TEXT DEFAULT 'wellness' CHECK (category IN ('wellness', 'productivity', 'social', 'health', 'mindfulness', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON public.habits(is_active);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habits"
  ON public.habits FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 5. HABIT LOGS TABLE (Premium Feature)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  value NUMERIC, -- Optional: for habits with numeric values (e.g., hours slept)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(log_date DESC);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habit logs"
  ON public.habit_logs FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 6. BREATHING SESSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.breathing_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technique TEXT NOT NULL, -- 'box', '478', 'calm', 'energize', etc.
  duration_seconds INTEGER NOT NULL,
  completed BOOLEAN DEFAULT true,
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breathing_sessions_user_id ON public.breathing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_breathing_sessions_date ON public.breathing_sessions(created_at DESC);

ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own breathing sessions"
  ON public.breathing_sessions FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 7. DAILY RITUALS TABLE (Premium Feature)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.daily_rituals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('morning', 'evening', 'custom')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of ritual items [{name, duration_minutes, order}]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_rituals_user_id ON public.daily_rituals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rituals_type ON public.daily_rituals(type);

ALTER TABLE public.daily_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily rituals"
  ON public.daily_rituals FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 8. RITUAL COMPLETIONS TABLE (Premium Feature)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ritual_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ritual_id UUID NOT NULL REFERENCES public.daily_rituals(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items_completed JSONB DEFAULT '[]'::jsonb, -- Which items were completed
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ritual_id, completion_date)
);

CREATE INDEX IF NOT EXISTS idx_ritual_completions_user_id ON public.ritual_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_ritual_completions_date ON public.ritual_completions(completion_date DESC);

ALTER TABLE public.ritual_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ritual completions"
  ON public.ritual_completions FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 9. CRISIS TOOL USAGE TABLE (Analytics - Optional)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.crisis_tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be anonymous
  tool_type TEXT NOT NULL CHECK (tool_type IN ('grounding_54321', 'box_breathing', 'panic_button', 'coping_statements', 'hotline_access')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_tool_usage_user_id ON public.crisis_tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_crisis_tool_usage_type ON public.crisis_tool_usage(tool_type);
CREATE INDEX IF NOT EXISTS idx_crisis_tool_usage_date ON public.crisis_tool_usage(created_at DESC);

-- No RLS - allow anonymous usage tracking
ALTER TABLE public.crisis_tool_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crisis tool usage"
  ON public.crisis_tool_usage FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert crisis tool usage"
  ON public.crisis_tool_usage FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- 10. MOOD INSIGHTS CACHE TABLE (For weekly/monthly analytics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mood_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  average_mood NUMERIC(3,2),
  mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining')),
  total_reflections INTEGER DEFAULT 0,
  top_emotions JSONB DEFAULT '[]'::jsonb,
  insights JSONB DEFAULT '{}'::jsonb, -- AI-generated or calculated insights
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_mood_insights_user_id ON public.mood_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_insights_period ON public.mood_insights(period_type, period_start DESC);

ALTER TABLE public.mood_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood insights"
  ON public.mood_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage mood insights"
  ON public.mood_insights FOR ALL
  USING (true);

-- =============================================================================
-- 11. ADD GRATITUDE COLUMN TO REFLECTIONS (Link gratitude to reflections)
-- =============================================================================
ALTER TABLE public.reflections 
ADD COLUMN IF NOT EXISTS gratitude_items JSONB DEFAULT '[]'::jsonb;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE public.gratitude_entries IS 'Daily gratitude entries - 3 items for free, unlimited for premium';
COMMENT ON TABLE public.goals IS 'User goals with categories and progress tracking - Premium feature';
COMMENT ON TABLE public.weekly_intentions IS 'Weekly intention setting and reflection - Premium feature';
COMMENT ON TABLE public.habits IS 'User-defined habits to track - Premium feature';
COMMENT ON TABLE public.habit_logs IS 'Daily habit completion logs - Premium feature';
COMMENT ON TABLE public.breathing_sessions IS 'Breathing exercise session logs';
COMMENT ON TABLE public.daily_rituals IS 'Morning/evening ritual definitions - Premium feature';
COMMENT ON TABLE public.ritual_completions IS 'Daily ritual completion tracking - Premium feature';
COMMENT ON TABLE public.crisis_tool_usage IS 'Anonymous crisis tool usage analytics';
COMMENT ON TABLE public.mood_insights IS 'Cached mood analytics for weekly/monthly insights';
