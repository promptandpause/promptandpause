-- ============================================================================
-- PREMIUM FOCUS OVERRIDE - "Tune My Focus"
-- ============================================================================
-- Allows premium users to manually override their daily focus area rotation.
-- Override can be:
--   1. Today only (expires at end of day)
--   2. Until cleared (persistent override)
-- ============================================================================

-- Add focus override columns to user_preferences table
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS focus_override_area TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS focus_override_until DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS focus_override_set_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_focus_override 
ON public.user_preferences(focus_override_until)
WHERE focus_override_area IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN public.user_preferences.focus_override_area IS 
  'Premium feature: manually selected focus area that overrides rotation';
COMMENT ON COLUMN public.user_preferences.focus_override_until IS 
  'Date until which override is active. NULL = permanent until cleared';
COMMENT ON COLUMN public.user_preferences.focus_override_set_at IS 
  'Timestamp when the override was set (for audit trail)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_preferences' 
--   AND column_name LIKE '%focus_override%'
-- ORDER BY ordinal_position;
