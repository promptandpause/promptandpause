-- ============================================================================
-- ADD IS_ACTIVE COLUMN TO EXISTING FOCUS AREAS TABLE
-- ============================================================================
-- Run this if the table already exists but is missing the is_active column
-- ============================================================================

-- Add is_active column if it doesn't exist
ALTER TABLE public.focus_areas
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for is_active column
CREATE INDEX IF NOT EXISTS idx_focus_areas_active ON public.focus_areas(user_id, is_active);

-- Update existing records to have is_active = true (in case any NULL values exist)
UPDATE public.focus_areas 
SET is_active = true 
WHERE is_active IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'focus_areas'
    AND column_name = 'is_active';
