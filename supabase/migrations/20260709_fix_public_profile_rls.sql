-- ──────────────────────────────────────────────
-- Fix RLS policies to support public profiles
-- Allows anyone to view profiles/reflections where
-- the profile owner has is_public_profile = true
-- ──────────────────────────────────────────────

-- 1. Allow anyone to VIEW public profiles
CREATE POLICY "Anyone can view public profiles" ON public.profiles
  FOR SELECT TO public
  USING (is_public_profile = true);

-- 2. Allow anyone to VIEW public reflections (non-private)
CREATE POLICY "Anyone can view public reflections" ON public.reflections
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = reflections.user_id
      AND p.is_public_profile = true
    )
    AND visibility != 'private'
  );
