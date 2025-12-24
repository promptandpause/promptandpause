-- Create support tickets system tables
-- Run this in Supabase SQL Editor to set up support ticket functionality

-- ============================================================================
-- SUPPORT TICKETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- ============================================================================
-- SUPPORT RESPONSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  responder_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'::jsonb
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_support_responses_ticket_id ON support_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_responses_created_at ON support_responses(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_responses ENABLE ROW LEVEL SECURITY;

-- Support Tickets Policies
-- Users can view their own tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tickets
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (limited fields)
DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;
CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to tickets" ON support_tickets;
CREATE POLICY "Service role full access to tickets"
  ON support_tickets
  USING (true)
  WITH CHECK (true);

-- Support Responses Policies
-- Users can view responses to their tickets
DROP POLICY IF EXISTS "Users can view responses to own tickets" ON support_responses;
CREATE POLICY "Users can view responses to own tickets"
  ON support_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_responses.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Users can create responses to their tickets
DROP POLICY IF EXISTS "Users can create responses" ON support_responses;
CREATE POLICY "Users can create responses"
  ON support_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_responses.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to responses" ON support_responses;
CREATE POLICY "Service role full access to responses"
  ON support_responses
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on support_tickets
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_tickets_timestamp ON support_tickets;
CREATE TRIGGER update_support_tickets_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get support ticket statistics
CREATE OR REPLACE FUNCTION get_support_stats()
RETURNS TABLE (
  total_tickets BIGINT,
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  resolved_tickets BIGINT,
  avg_response_time_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_tickets,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_tickets,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_tickets,
    COUNT(*) FILTER (WHERE status = 'resolved' OR status = 'closed')::BIGINT as resolved_tickets,
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
      ) FILTER (WHERE resolved_at IS NOT NULL),
      0
    )::NUMERIC as avg_response_time_hours
  FROM support_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================

-- Check if tables exist
SELECT 
  'support_tickets' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'support_tickets'
  ) AS exists;

SELECT 
  'support_responses' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'support_responses'
  ) AS exists;

-- Get current stats
SELECT * FROM get_support_stats();

-- Show all tickets (if any)
SELECT 
  id,
  subject,
  status,
  priority,
  created_at
FROM support_tickets
ORDER BY created_at DESC
LIMIT 10;
