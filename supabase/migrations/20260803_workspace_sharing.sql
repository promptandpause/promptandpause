-- =============================================================================
-- Prompt & Pause - Workspace-only sharing
-- Adds a 'workspace' visibility level + workspace_id to reflections so
-- members can share reflections that are visible only inside their workspace,
-- and extends comments/likes RLS so teammates can engage with them.
-- =============================================================================

-- ──────────────────────────────────────────────
-- 1. REFLECTIONS: workspace_id column
-- ──────────────────────────────────────────────

ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reflections_workspace
  ON public.reflections(workspace_id, created_at DESC);

-- ──────────────────────────────────────────────
-- 2. REFLECTIONS: extend visibility CHECK to allow 'workspace'
-- ──────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reflections_visibility_check'
      AND conrelid = 'public.reflections'::regclass
  ) THEN
    ALTER TABLE public.reflections DROP CONSTRAINT reflections_visibility_check;
  END IF;
END $$;

ALTER TABLE public.reflections
  ADD CONSTRAINT reflections_visibility_check
  CHECK (visibility IN ('private', 'friends_only', 'public', 'workspace'));

-- ──────────────────────────────────────────────
-- 3. RLS: active members can read workspace reflections
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Workspace members can view workspace reflections" ON public.reflections;

CREATE POLICY "Workspace members can view workspace reflections" ON public.reflections
  FOR SELECT TO public
  USING (
    visibility = 'workspace'
    AND workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = reflections.workspace_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- ──────────────────────────────────────────────
-- 4. COMMENTS: workspace members can read + comment on workspace reflections
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "comments_select" ON public.comments;

CREATE POLICY "comments_select" ON public.comments
  FOR SELECT USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.reflections r
      WHERE r.id = comments.reflection_id
      AND (
        r.visibility = 'public'
        OR r.user_id = auth.uid()
        OR (r.visibility = 'friends_only' AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE status = 'accepted'
          AND ((requester_id = auth.uid() AND addressee_id = r.user_id)
            OR (addressee_id = auth.uid() AND requester_id = r.user_id))
        ))
        OR (r.visibility = 'workspace' AND r.workspace_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = r.workspace_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        ))
      )
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON public.comments;

CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reflections r
      WHERE r.id = comments.reflection_id
      AND r.allow_comments = true
      AND (
        r.visibility = 'public'
        OR (r.visibility = 'friends_only' AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE status = 'accepted'
          AND ((requester_id = auth.uid() AND addressee_id = r.user_id)
            OR (addressee_id = auth.uid() AND requester_id = r.user_id))
        ))
        OR (r.visibility = 'workspace' AND r.workspace_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = r.workspace_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        ))
      )
    )
  );

-- ──────────────────────────────────────────────
-- 5. LIKES: workspace members can see likes on workspace reflections
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "anyone_can_view_likes" ON public.reflection_likes;

CREATE POLICY "anyone_can_view_likes" ON public.reflection_likes
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.reflections r
      WHERE r.id = reflection_likes.reflection_id
      AND (
        r.visibility = 'public'
        OR r.user_id = auth.uid()
        OR (r.visibility = 'friends_only' AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE status = 'accepted'
          AND ((requester_id = auth.uid() AND addressee_id = r.user_id)
            OR (addressee_id = auth.uid() AND requester_id = r.user_id))
        ))
        OR (r.visibility = 'workspace' AND r.workspace_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = r.workspace_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        ))
      )
    )
  );
