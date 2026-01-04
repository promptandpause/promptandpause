-- ============================================================================
-- QUICK CHECK FOR IS_ACTIVE COLUMN
-- ============================================================================
-- Run this to specifically check if is_active column exists
-- ============================================================================

-- Check if is_active column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'focus_areas'
    AND column_name = 'is_active';

-- If no results above, the column doesn't exist
-- Run this to add it:

ALTER TABLE public.focus_areas
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Verify it was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'focus_areas'
    AND column_name = 'is_active';
