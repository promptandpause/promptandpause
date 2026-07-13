-- =============================================================================
-- Prompt & Pause - Org B2B schema + Admin infrastructure
-- =============================================================================

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================

DROP POLICY IF EXISTS "Org owners can manage their organization" ON public.organizations;
DROP POLICY IF EXISTS "Active members can view organization" ON public.organizations;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  seat_count int NOT NULL DEFAULT 0,
  plan text NOT NULL DEFAULT 'team',
  billing_interval text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_sub ON public.organizations(stripe_subscription_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can manage their organization"
  ON public.organizations FOR ALL
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Active members can view organization"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =============================================================================
-- ORGANIZATION_MEMBERS
-- =============================================================================

DROP POLICY IF EXISTS "Members can view org roster" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON public.organization_members;

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'removed')),
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org roster"
  ON public.organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage org members"
  ON public.organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =============================================================================
-- ORGANIZATION_INVITES
-- =============================================================================

DROP POLICY IF EXISTS "Admins can manage org invites" ON public.organization_invites;

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_org ON public.organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON public.organization_invites(token);

ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage org invites"
  ON public.organization_invites FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =============================================================================
-- ORGANIZATION_CONSENT
-- =============================================================================

DROP POLICY IF EXISTS "Users can manage own consent" ON public.organization_consent;

CREATE TABLE IF NOT EXISTS public.organization_consent (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consented_at timestamptz NOT NULL DEFAULT now(),
  consent_version text NOT NULL,
  PRIMARY KEY (organization_id, user_id)
);

ALTER TABLE public.organization_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own consent"
  ON public.organization_consent FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- ADMIN_ACTIVITY_LOG TABLE (Singular - used by log_admin_activity RPC)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_email 
  ON public.admin_activity_log(admin_email);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at 
  ON public.admin_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type 
  ON public.admin_activity_log(action_type);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to admin_activity_log" 
  ON public.admin_activity_log FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

-- =============================================================================
-- LOG_ADMIN_ACTIVITY RPC
-- =============================================================================

-- =============================================================================
-- LOG_ADMIN_ACTIVITY RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_admin_email text,
  p_action_type text,
  p_target_type text,
  p_target_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_activity_log (
    admin_email,
    action_type,
    target_type,
    target_id,
    details,
    created_at
  ) VALUES (
    p_admin_email,
    p_action_type,
    p_target_type,
    p_target_id,
    p_details,
    now()
  );
END;
$$;

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS organization_members_updated_at ON public.organization_members;
CREATE TRIGGER organization_members_updated_at BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
