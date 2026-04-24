-- Lightweight activation/retention event log
-- Used to understand the signup -> first reflection -> return funnel
-- without introducing a third-party analytics dependency.

CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event ON public.user_events(event);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON public.user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_user_event_created
  ON public.user_events(user_id, event, created_at DESC);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Users may insert their own events
DROP POLICY IF EXISTS "Users can insert own events" ON public.user_events;
CREATE POLICY "Users can insert own events"
  ON public.user_events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users may read their own events (for future "your activity" views)
DROP POLICY IF EXISTS "Users can read own events" ON public.user_events;
CREATE POLICY "Users can read own events"
  ON public.user_events FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- No UPDATE / DELETE policies: events are append-only.
