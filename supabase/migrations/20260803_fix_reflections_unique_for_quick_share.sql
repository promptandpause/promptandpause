-- =============================================================================
-- Prompt & Pause - Allow multiple Quick Shares per day
--
-- The original UNIQUE(user_id, date) constraint on reflections enforced one
-- reflection per user per day. Quick Shares are meant to be unlimited, but the
-- constraint made every additional Quick Share on the same day fail with:
--
--   duplicate key value violates unique constraint "reflections_user_id_date_key"
--
-- (PostgreSQL 23505 -> PostgREST 409 -> the route caught it and returned a 500).
--
-- Fix: replace the full unique constraint with a PARTIAL unique index that only
-- enforces one reflection per day for prompt-driven reflections. Quick Share
-- rows (prompt_text = 'Quick Share') are excluded from the index, so they are
-- unlimited.
--
-- The app never relies on the reflections/user+date uniqueness (nothing queries
-- reflections by date with .single()), so dropping the constraint is safe.
-- =============================================================================

-- Drop the old constraint (its auto-created backing index goes with it).
ALTER TABLE public.reflections
  DROP CONSTRAINT IF EXISTS reflections_user_id_date_key;

-- Remove any stray index with the same name, then recreate it as a partial
-- unique index that skips Quick Shares.
DROP INDEX IF EXISTS reflections_user_id_date_key;

CREATE UNIQUE INDEX reflections_user_id_date_key
  ON public.reflections(user_id, date)
  WHERE prompt_text <> 'Quick Share';
