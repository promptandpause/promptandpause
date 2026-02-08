-- Daily affirmations cache (per user, per day)
CREATE TABLE IF NOT EXISTS public.daily_affirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affirmation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  text TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'gentle-motivating-grounded',
  source TEXT NOT NULL DEFAULT 'openrouter',
  ai_provider TEXT,
  ai_model TEXT,
  usage JSONB,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, affirmation_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_affirmations_user_id ON public.daily_affirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_affirmations_date ON public.daily_affirmations(affirmation_date DESC);

ALTER TABLE public.daily_affirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily affirmations"
  ON public.daily_affirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily affirmations"
  ON public.daily_affirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily affirmations"
  ON public.daily_affirmations FOR UPDATE
  USING (auth.uid() = user_id);
