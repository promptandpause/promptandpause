-- =============================================================================
-- Prompt & Pause - Fix org RLS infinite recursion
-- The org RLS policies were self-referential (policy on organization_members
-- SELECTs organization_members). Once the workspace-sharing policy started
-- referencing organization_members from reflections, every user-scoped
-- reflections query hit:
--   "infinite recursion detected in policy for relation organization_members"
--
-- Fix: SECURITY DEFINER helpers (run as table owner, bypass RLS) for the
-- membership check, and rewrite all org + workspace policies to use them.
-- =============================================================================

-- ──────────────────────────────────────────────
-- 1. SECURITY DEFINER HELPERS
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO anon, authenticated;

-- ──────────────────────────────────────────────
-- 2. ORGANIZATIONS POLICIES (was: self-referential via organization_members)
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Org owners can manage their organization" ON public.organizations;
CREATE POLICY "Org owners can manage their organization" ON public.organizations
  FOR ALL USING (public.is_org_admin(id)) WITH CHECK (public.is_org_admin(id));

DROP POLICY IF EXISTS "Active members can view organization" ON public.organizations;
CREATE POLICY "Active members can view organization" ON public.organizations
  FOR SELECT USING (public.is_org_member(id));

-- ──────────────────────────────────────────────
-- 3. ORGANIZATION_MEMBERS POLICIES (was: self-referential)
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Members can view org roster" ON public.organization_members;
CREATE POLICY "Members can view org roster" ON public.organization_members
  FOR SELECT USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Admins can manage org members" ON public.organization_members;
CREATE POLICY "Admins can manage org members" ON public.organization_members
  FOR ALL USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));

-- ──────────────────────────────────────────────
-- 4. ORGANIZATION_INVITES POLICY (was: self-referential)
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can manage org invites" ON public.organization_invites;
CREATE POLICY "Admins can manage org invites" ON public.organization_invites
  FOR ALL USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));

-- ──────────────────────────────────────────────
-- 5. WORKSPACE REFLECTIONS POLICY (use helper, no recursion)
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Workspace members can view workspace reflections" ON public.reflections;
CREATE POLICY "Workspace members can view workspace reflections" ON public.reflections
  FOR SELECT TO public
  USING (visibility = 'workspace' AND workspace_id IS NOT NULL AND public.is_org_member(workspace_id));

-- ──────────────────────────────────────────────
-- 6. COMMENTS POLICIES (workspace branch via helper)
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
        OR (r.visibility = 'workspace' AND r.workspace_id IS NOT NULL AND public.is_org_member(r.workspace_id))
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
        OR (r.visibility = 'workspace' AND r.workspace_id IS NOT NULL AND public.is_org_member(r.workspace_id))
      )
    )
  );

-- ──────────────────────────────────────────────
-- 7. LIKES POLICY (workspace branch via helper)
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
        OR (r.visibility = 'workspace' AND r.workspace_id IS NOT NULL AND public.is_org_member(r.workspace_id))
      )
    )
  );
