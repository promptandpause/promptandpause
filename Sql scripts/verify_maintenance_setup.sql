-- Verify maintenance_mode table setup
-- Run this to check if everything is configured correctly

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'maintenance_mode'
) AS table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'maintenance_mode'
ORDER BY ordinal_position;

-- 3. Check if there's a row in the table
SELECT COUNT(*) as row_count FROM maintenance_mode;

-- 4. View current maintenance mode status
SELECT * FROM maintenance_mode;

-- 5. If no row exists, insert one
INSERT INTO maintenance_mode (is_enabled)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM maintenance_mode);

-- 6. Verify the insert worked
SELECT * FROM maintenance_mode;
