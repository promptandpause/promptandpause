-- Follow system: auto-follow (no approval needed), separate from friend requests

CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows
CREATE POLICY "anyone_can_view_follows" ON follows
  FOR SELECT TO public
  USING (true);

-- Users can follow/unfollow themselves
CREATE POLICY "users_can_insert_own_follows" ON follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "users_can_delete_own_follows" ON follows
  FOR DELETE USING (follower_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
