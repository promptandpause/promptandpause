-- ──────────────────────────────────────────────
-- Fix RLS policies for shared reflections
-- Drops the overly-restrictive "public profile required"
-- policy and replaces with proper visibility-based policies
-- ──────────────────────────────────────────────

-- Drop old policy (requires is_public_profile on author)
DROP POLICY IF EXISTS "Anyone can view public reflections" ON public.reflections;

-- 1. Anyone can view reflections with visibility = 'public'
CREATE POLICY "Anyone can view public reflections" ON public.reflections
  FOR SELECT TO public
  USING (visibility = 'public');

-- 2. Friends can view friends_only reflections
CREATE POLICY "Friends can view friends_only reflections" ON public.reflections
  FOR SELECT TO public
  USING (
    visibility = 'friends_only'
    AND (
      EXISTS (
        SELECT 1 FROM friends
        WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = reflections.user_id)
          OR (addressee_id = auth.uid() AND requester_id = reflections.user_id)
        )
      )
    )
  );
