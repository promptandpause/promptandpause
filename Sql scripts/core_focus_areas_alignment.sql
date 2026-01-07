-- =========================================================================
-- CORE FOCUS AREAS ALIGNMENT (2026)
-- =========================================================================
-- Purpose:
-- - Align user_preferences.focus_areas with the 6-core taxonomy:
--   Clarity
--   Emotional Balance
--   Work & Responsibility
--   Relationships
--   Change & Uncertainty
--   Grounding
--
-- Notes:
-- - This is a safe normalization/backfill script.
-- - It does NOT delete rows; it only updates the focus_areas array.
-- - Default suggestion remains: ['Clarity','Emotional Balance'].
-- =========================================================================

-- 1) Ensure the focus_areas column has a sensible default
ALTER TABLE public.user_preferences
  ALTER COLUMN focus_areas SET DEFAULT ARRAY['Clarity','Emotional Balance']::text[];

-- 2) Normalize existing values to canonical core names (case-insensitive)
-- Mapping policy (cautious, non-diagnostic):
-- - Career / Work-Life Balance / Finances -> Work & Responsibility
-- - Family / Relationships -> Relationships
-- - Mindfulness / Gratitude / Health -> Grounding
-- - Self-esteem / Grief -> Emotional Balance
-- - Personal Growth -> Clarity
-- - Unknown values are dropped
UPDATE public.user_preferences
SET focus_areas = (
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT normalized
      FROM (
        SELECT CASE
          WHEN lower(trim(v)) IN ('clarity') THEN 'Clarity'
          WHEN lower(trim(v)) IN ('emotional balance','emotional_balance') THEN 'Emotional Balance'
          WHEN lower(trim(v)) IN ('work & responsibility','work and responsibility','work','career','career growth','work-life balance','work life balance','finances','finance') THEN 'Work & Responsibility'
          WHEN lower(trim(v)) IN ('relationships','relationship','family','friends') THEN 'Relationships'
          WHEN lower(trim(v)) IN ('change & uncertainty','change and uncertainty','change','uncertainty','transitions','transition') THEN 'Change & Uncertainty'
          WHEN lower(trim(v)) IN ('grounding','mindfulness','gratitude','health') THEN 'Grounding'
          WHEN lower(trim(v)) IN ('self-esteem','self esteem','self-esteem','grief') THEN 'Emotional Balance'
          WHEN lower(trim(v)) IN ('personal growth','growth') THEN 'Clarity'
          ELSE NULL
        END AS normalized
        FROM unnest(COALESCE(public.user_preferences.focus_areas, ARRAY[]::text[])) AS v
      ) t
      WHERE normalized IS NOT NULL
    ),
    ARRAY[]::text[]
  )
);

-- 3) Backfill any empty/null arrays to the default suggestion
UPDATE public.user_preferences
SET focus_areas = ARRAY['Clarity','Emotional Balance']::text[]
WHERE focus_areas IS NULL
   OR array_length(focus_areas, 1) IS NULL;

-- =========================================================================
-- Verification
-- =========================================================================
-- SELECT focus_areas, COUNT(*)
-- FROM public.user_preferences
-- GROUP BY focus_areas
-- ORDER BY COUNT(*) DESC;
