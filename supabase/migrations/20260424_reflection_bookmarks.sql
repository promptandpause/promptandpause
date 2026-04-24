-- Reflection bookmarks: lets users "save for later" or "revisit tomorrow"
-- a specific reflection. Persisted server-side so it follows the user
-- across devices and browsers.

CREATE TABLE IF NOT EXISTS public.reflection_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_id UUID NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('saved', 'revisit')),
  revisit_on DATE, -- only used when kind = 'revisit'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reflection_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_reflection_bookmarks_user
  ON public.reflection_bookmarks(user_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflection_bookmarks_revisit_due
  ON public.reflection_bookmarks(user_id, revisit_on)
  WHERE kind = 'revisit';

ALTER TABLE public.reflection_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own bookmarks" ON public.reflection_bookmarks;
CREATE POLICY "Users can read own bookmarks"
  ON public.reflection_bookmarks FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.reflection_bookmarks;
CREATE POLICY "Users can insert own bookmarks"
  ON public.reflection_bookmarks FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own bookmarks" ON public.reflection_bookmarks;
CREATE POLICY "Users can update own bookmarks"
  ON public.reflection_bookmarks FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.reflection_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON public.reflection_bookmarks FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
