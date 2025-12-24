-- Fix duplicate rows in maintenance_mode table
-- The table should only have ONE row

-- 1. Delete all rows
DELETE FROM maintenance_mode;

-- 2. Insert a single row with maintenance mode enabled (since you just enabled it)
INSERT INTO maintenance_mode (is_enabled, enabled_by, enabled_at)
VALUES (
  true, 
  '703a8574-bed3-4276-9bae-d6f78834c4ae'::uuid,
  NOW()
);

-- 3. Add a unique constraint to prevent multiple rows in the future
-- Add a column with a constant value and unique constraint
ALTER TABLE maintenance_mode ADD COLUMN IF NOT EXISTS singleton_guard INTEGER DEFAULT 1;

-- Drop constraint if it exists, then add it
ALTER TABLE maintenance_mode DROP CONSTRAINT IF EXISTS maintenance_mode_singleton;
ALTER TABLE maintenance_mode ADD CONSTRAINT maintenance_mode_singleton UNIQUE (singleton_guard);

-- 4. Verify only one row exists
SELECT COUNT(*) as row_count FROM maintenance_mode;

-- 5. View the single row
SELECT * FROM maintenance_mode;
