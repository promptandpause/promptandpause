-- =========================================================================
-- PART 3 — LONGITUDINAL REFLECTION INTELLIGENCE (Schema)
-- =========================================================================
-- Adds:
-- 1) monthly_reflection_summaries table
-- 2) performance indexes to support safe self-comparison later
-- 3) resurfacing_eligible flag on reflections
--
-- Note:
-- - This is schema-only. Intelligence generation stays server-side.
-- =========================================================================

-- 1) Monthly Reflection Summaries (Premium+)
CREATE TABLE IF NOT EXISTS public.monthly_reflection_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  month_start date not null,
  month_end date not null,

  overview_text text not null,
  observations jsonb not null,
  theme_reflection text not null,
  closing_question text not null,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (user_id, month_start)
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION update_monthly_reflection_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS monthly_reflection_summaries_updated_at ON public.monthly_reflection_summaries;

CREATE TRIGGER monthly_reflection_summaries_updated_at
  BEFORE UPDATE ON public.monthly_reflection_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_reflection_summaries_updated_at();

-- 2) Indexes to support safe self-comparison (added now for future-proofing)
CREATE INDEX IF NOT EXISTS idx_reflections_user_created
ON public.reflections (user_id, created_at);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'mood_entries'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_moods_user_created ON public.mood_entries (user_id, created_at)';
  END IF;
END
$$;

-- 3) Flag reflections eligible for resurfacing
ALTER TABLE public.reflections
ADD COLUMN IF NOT EXISTS resurfacing_eligible boolean default false;

-- 4) Resurfacing event log (persistence + auditability; prevents accidental nudging)
CREATE TABLE IF NOT EXISTS public.reflection_resurfacing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  surfaced_at timestamptz not null default now(),
  unique (user_id, reflection_id)
);

CREATE INDEX IF NOT EXISTS idx_resurfacing_user_surfaced
ON public.reflection_resurfacing_events (user_id, surfaced_at desc);

ALTER TABLE public.reflection_resurfacing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their resurfacing events" ON public.reflection_resurfacing_events;
CREATE POLICY "Users can view their resurfacing events"
  ON public.reflection_resurfacing_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their resurfacing events" ON public.reflection_resurfacing_events;
CREATE POLICY "Users can insert their resurfacing events"
  ON public.reflection_resurfacing_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- Verification
-- =========================================================================
-- SELECT * FROM public.monthly_reflection_summaries LIMIT 5;
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'reflections' AND column_name = 'resurfacing_eligible';
