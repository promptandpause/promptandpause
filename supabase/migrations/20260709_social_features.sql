-- =============================================================================
-- PHASE 1: SOCIAL FEATURES
-- Adds opt-in sharing, friend system, circles, comments, whiteboard,
-- community prompts, and profile customization.
-- =============================================================================

-- ──────────────────────────────────────────────
-- 1. EXTEND EXISTING TABLES
-- ──────────────────────────────────────────────

-- Add visibility & sharing columns to reflections
ALTER TABLE reflections
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'friends_only', 'public')),
  ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true;

-- Extend profiles for social/customization features
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_theme jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS mood_song_url text,
  ADD COLUMN IF NOT EXISTS mood_song_title text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS share_default text NOT NULL DEFAULT 'private'
    CHECK (share_default IN ('private', 'friends_only', 'public')),
  ADD COLUMN IF NOT EXISTS is_public_profile boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_discover boolean NOT NULL DEFAULT false;

-- ──────────────────────────────────────────────
-- 2. NEW TABLES
-- ──────────────────────────────────────────────

-- Friend system
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Friend circles (groups)
CREATE TABLE IF NOT EXISTS circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, name)
);

CREATE TABLE IF NOT EXISTS circle_members (
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (circle_id, friend_id)
);

-- Comments on shared reflections
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id uuid NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Whiteboard entries (profile guestbook)
CREATE TABLE IF NOT EXISTS whiteboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL DEFAULT 'text'
    CHECK (content_type IN ('text', 'doodle', 'voice_note', 'sticker')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Community prompts (Prompt Marketplace)
CREATE TABLE IF NOT EXISTS community_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_text text NOT NULL CHECK (char_length(prompt_text) <= 500),
  category text,
  votes_count integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES community_prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL DEFAULT 'up'
    CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, user_id)
);

-- Notifications for social interactions
CREATE TABLE IF NOT EXISTS social_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('friend_request', 'friend_accepted', 'new_comment', 'whiteboard', 'share')),
  actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reflection_id uuid REFERENCES reflections(id) ON DELETE CASCADE,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 3. INDEXES
-- ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_id);
CREATE INDEX IF NOT EXISTS idx_friends_addressee ON friends(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_comments_reflection ON comments(reflection_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_profile ON whiteboard_entries(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_community_prompts_status ON community_prompts(status);
CREATE INDEX IF NOT EXISTS idx_community_prompts_featured ON community_prompts(is_featured);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_reflections_visibility ON reflections(visibility, created_at DESC);

-- ──────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

-- Friends: users can see their own friend relationships
CREATE POLICY "users_can_view_own_friends" ON friends
  FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "users_can_request_friends" ON friends
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "users_can_update_own_friend_requests" ON friends
  FOR UPDATE USING (addressee_id = auth.uid() OR requester_id = auth.uid());

-- Circles: owned by user
CREATE POLICY "users_manage_own_circles" ON circles
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "circle_members_read" ON circles
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM circle_members WHERE circle_id = id AND friend_id = auth.uid())
  );

-- Circle members
CREATE POLICY "owners_manage_circle_members" ON circle_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM circles WHERE id = circle_id AND owner_id = auth.uid())
  );

CREATE POLICY "members_view_circle" ON circle_members
  FOR SELECT USING (friend_id = auth.uid());

-- Comments: read if you can see the reflection
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM reflections r
      WHERE r.id = reflection_id
      AND (
        r.visibility = 'public'
        OR r.user_id = auth.uid()
        OR (r.visibility = 'friends_only' AND EXISTS (
          SELECT 1 FROM friends
          WHERE status = 'accepted'
          AND ((requester_id = auth.uid() AND addressee_id = r.user_id)
            OR (addressee_id = auth.uid() AND requester_id = r.user_id))
        ))
      )
    )
  );

CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM reflections r
      WHERE r.id = reflection_id
      AND r.allow_comments = true
      AND (
        r.visibility = 'public'
        OR (r.visibility = 'friends_only' AND EXISTS (
          SELECT 1 FROM friends
          WHERE status = 'accepted'
          AND ((requester_id = auth.uid() AND addressee_id = r.user_id)
            OR (addressee_id = auth.uid() AND requester_id = r.user_id))
        ))
      )
    )
  );

CREATE POLICY "comments_update_delete_own" ON comments
  FOR UPDATE USING (author_id = auth.uid());

-- Whiteboard: read if profile is public or you're friends
CREATE POLICY "whiteboard_select" ON whiteboard_entries
  FOR SELECT USING (
    author_id = auth.uid()
    OR profile_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = profile_user_id AND p.is_public_profile = true
    )
    OR EXISTS (
      SELECT 1 FROM friends
      WHERE status = 'accepted'
      AND ((requester_id = auth.uid() AND addressee_id = profile_user_id)
        OR (addressee_id = auth.uid() AND requester_id = profile_user_id))
    )
  );

CREATE POLICY "whiteboard_insert" ON whiteboard_entries
  FOR INSERT WITH CHECK (author_id = auth.uid());

-- Community prompts
CREATE POLICY "prompts_select" ON community_prompts
  FOR SELECT USING (status = 'approved' OR author_id = auth.uid());

CREATE POLICY "prompts_insert" ON community_prompts
  FOR INSERT WITH CHECK (author_id = auth.uid());

-- Prompt votes
CREATE POLICY "votes_select" ON prompt_votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "votes_insert" ON prompt_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Social notifications: user sees own
CREATE POLICY "notifications_select" ON social_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON social_notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON social_notifications
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- ──────────────────────────────────────────────
-- 5. RPC FUNCTIONS
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_prompt_votes(prompt_id uuid)
RETURNS void AS $$
  UPDATE community_prompts SET votes_count = votes_count + 1 WHERE id = prompt_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION decrement_prompt_votes(prompt_id uuid)
RETURNS void AS $$
  UPDATE community_prompts SET votes_count = GREATEST(votes_count - 1, 0) WHERE id = prompt_id;
$$ LANGUAGE sql;
