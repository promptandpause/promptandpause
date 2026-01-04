-- ============================================================================
-- CHECK FOCUS AREAS TABLE STRUCTURE
-- ============================================================================
-- Run this in your Supabase SQL Editor to check if the table exists and its structure
-- ============================================================================

-- Check if table exists
SELECT 
    table_name,
    table_type,
    is_typed
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'focus_areas';

-- If table exists, show its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'focus_areas'
ORDER BY ordinal_position;

-- Check if there's any data in the table (if it exists)
SELECT COUNT(*) as row_count 
FROM public.focus_areas;

-- Show sample data if table exists (limit 5)
SELECT * 
FROM public.focus_areas 
LIMIT 5;

-- Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'focus_areas';
