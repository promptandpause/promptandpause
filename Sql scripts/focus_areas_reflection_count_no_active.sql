-- ============================================================================
-- FOCUS AREAS REFLECTION COUNT UPDATE (WITHOUT IS_ACTIVE)
-- ============================================================================
-- This SQL adds reflection_count tracking to focus_areas and automatically
-- updates counts when reflections are created with a focus area.
-- 
-- VERSION: Modified to work without is_active column
-- ============================================================================

-- Step 1: Add reflection_count column to focus_areas table (if not exists)
ALTER TABLE public.focus_areas
ADD COLUMN IF NOT EXISTS reflection_count INTEGER DEFAULT 0;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_focus_areas_reflection_count 
ON public.focus_areas(user_id, reflection_count DESC);

-- Step 3: Backfill existing reflection counts from prompt_focus_area_usage
-- This counts how many times each focus area was used in prompts
UPDATE public.focus_areas fa
SET reflection_count = (
  SELECT COUNT(*)
  FROM public.prompt_focus_area_usage pfau
  WHERE pfau.focus_area_name = fa.name
    AND pfau.user_id = fa.user_id
);

-- Step 4: Create function to increment focus area reflection count
CREATE OR REPLACE FUNCTION increment_focus_area_reflection_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the focus_areas table for this user and focus area name
  UPDATE public.focus_areas
  SET 
    reflection_count = reflection_count + 1,
    updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND name = NEW.focus_area_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on prompt_focus_area_usage table
-- This automatically increments the count when a new prompt uses a focus area
DROP TRIGGER IF EXISTS trigger_increment_focus_area_count ON public.prompt_focus_area_usage;

CREATE TRIGGER trigger_increment_focus_area_count
AFTER INSERT ON public.prompt_focus_area_usage
FOR EACH ROW
EXECUTE FUNCTION increment_focus_area_reflection_count();

-- Step 6: Create function to decrement count (for deletions)
CREATE OR REPLACE FUNCTION decrement_focus_area_reflection_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement the count when a prompt_focus_area_usage is deleted
  UPDATE public.focus_areas
  SET 
    reflection_count = GREATEST(0, reflection_count - 1),
    updated_at = NOW()
  WHERE user_id = OLD.user_id
    AND name = OLD.focus_area_name;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger for deletions
DROP TRIGGER IF EXISTS trigger_decrement_focus_area_count ON public.prompt_focus_area_usage;

CREATE TRIGGER trigger_decrement_focus_area_count
AFTER DELETE ON public.prompt_focus_area_usage
FOR EACH ROW
EXECUTE FUNCTION decrement_focus_area_reflection_count();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the setup worked correctly:

-- Check that reflection_count column exists and has data
-- SELECT id, user_id, name, reflection_count, created_at 
-- FROM public.focus_areas 
-- ORDER BY reflection_count DESC 
-- LIMIT 10;

-- Check total counts match between tables
-- SELECT 
--   fa.name,
--   fa.reflection_count as stored_count,
--   COUNT(pfau.id) as actual_count
-- FROM public.focus_areas fa
-- LEFT JOIN public.prompt_focus_area_usage pfau 
--   ON pfau.user_id = fa.user_id 
--   AND pfau.focus_area_name = fa.name
-- GROUP BY fa.id, fa.name, fa.reflection_count
-- HAVING fa.reflection_count != COUNT(pfau.id);
