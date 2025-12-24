-- Create maintenance_mode table for persistent maintenance mode state
-- This table stores a single row that tracks the current maintenance mode status

CREATE TABLE IF NOT EXISTS maintenance_mode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES auth.users(id),
  disabled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row if table is empty
INSERT INTO maintenance_mode (is_enabled)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM maintenance_mode);

-- Add RLS policies
ALTER TABLE maintenance_mode ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to maintenance_mode"
  ON maintenance_mode
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read maintenance mode status
CREATE POLICY "Authenticated users can read maintenance_mode"
  ON maintenance_mode
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_maintenance_mode_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists before creating
DROP TRIGGER IF EXISTS maintenance_mode_updated_at ON maintenance_mode;

CREATE TRIGGER maintenance_mode_updated_at
  BEFORE UPDATE ON maintenance_mode
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_mode_updated_at();

-- Add comment
COMMENT ON TABLE maintenance_mode IS 'Stores global maintenance mode state. Should only contain one row.';
