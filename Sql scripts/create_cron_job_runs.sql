-- ============================================================================
-- Cron Job Runs Table
-- ============================================================================
-- This table logs execution of cron jobs for monitoring and debugging
-- Used by: /api/cron/send-daily-prompts, /api/cron/expire-gifts, admin cron-jobs page

CREATE TABLE IF NOT EXISTS cron_job_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  total_users INTEGER,
  successful_sends INTEGER,
  failed_sends INTEGER,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cron_job_runs_job_name ON cron_job_runs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_job_runs_status ON cron_job_runs(status);
CREATE INDEX IF NOT EXISTS idx_cron_job_runs_started_at ON cron_job_runs(started_at DESC);

-- Grant permissions to service role (used by cron endpoints)
GRANT ALL ON cron_job_runs TO service_role;
GRANT SELECT ON cron_job_runs TO authenticated;
GRANT SELECT ON cron_job_runs TO anon;

-- Enable RLS
ALTER TABLE cron_job_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies: read-only for authenticated/anon, full for service role
CREATE POLICY "Allow full access to service role" ON cron_job_runs
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Allow read access to authenticated users" ON cron_job_runs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to anonymous users" ON cron_job_runs
  FOR SELECT USING (auth.role() = 'anon');
