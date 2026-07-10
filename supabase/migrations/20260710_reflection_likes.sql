-- ──────────────────────────────────────────────
-- Add reflection likes/reactions support
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reflection_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reflection_id uuid NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, reflection_id)
);

ALTER TABLE reflection_likes ENABLE ROW LEVEL SECURITY;

-- Users can see who liked any reflection they can view
CREATE POLICY "anyone_can_view_likes" ON reflection_likes
  FOR SELECT TO public
  USING (
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

-- Authenticated users can toggle their own like
CREATE POLICY "users_can_manage_own_likes" ON reflection_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_likes" ON reflection_likes
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_reflection_likes_reflection ON reflection_likes(reflection_id);
CREATE INDEX IF NOT EXISTS idx_reflection_likes_user ON reflection_likes(user_id, reflection_id);
