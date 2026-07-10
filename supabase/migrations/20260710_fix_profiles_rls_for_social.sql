-- ──────────────────────────────────────────────
-- Fix RLS on profiles so social features work
-- The old policy required is_public_profile = true,
-- which broke profiles!inner joins for any reflection
-- whose author hadn't explicitly opted in.
--
-- Authenticated users need to see basic profile info
-- (full_name, display_name, username, avatar_url)
-- for any reflection they're allowed to view.
-- ──────────────────────────────────────────────

-- Allow any authenticated user to view any profile
-- (profiles table only contains non-sensitive display info)
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);
