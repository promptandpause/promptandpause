-- =============================================================================
-- Email queue: open up email_type to the full lifecycle + add metadata column
-- =============================================================================
-- The original email_queue was defined with a narrow CHECK constraint that
-- only allowed 4 email types ('welcome', 'trial_expiration', 'weekly_digest',
-- 'daily_prompt'). The lifecycle has since grown — any insert for a
-- getting_started / trial_started / trial_ending_soon etc. row would be
-- rejected by the old constraint. This migration replaces it with a superset
-- covering every current and near-term lifecycle email.
--
-- It also adds a `metadata` jsonb column so senders that need per-row context
-- (e.g. trial_end_date for the trial_started / trial_ending_soon templates)
-- don't have to re-query profiles at send time.
--
-- The migration is idempotent: safe to run on databases where the old
-- constraint was already hand-dropped and on fresh databases alike.
-- =============================================================================

-- 1. Drop any existing email_type CHECK constraint. Postgres auto-names these
--    as `<table>_<column>_check`, but we look it up dynamically in case the
--    old constraint was named differently (e.g. by a previous ad-hoc ALTER).
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.email_queue'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%email_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.email_queue DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

-- 2. Add the superset constraint. Keep it named so future migrations can
--    find it unambiguously.
ALTER TABLE public.email_queue
  ADD CONSTRAINT email_queue_email_type_check
  CHECK (email_type IN (
    -- Onboarding + activation
    'welcome',
    'getting_started',
    -- Trial lifecycle
    'trial_started',
    'trial_ending_soon',
    'trial_expiration',
    'trial_expired',
    -- Regular content
    'daily_prompt',
    'weekly_digest',
    'monthly_reflection',
    -- Security + billing
    'new_device_sign_in',
    'payment_failed',
    -- Retention (content-based only; see brand anti-pattern list)
    'reflection_resurface'
  ));

-- 3. Metadata column for per-row send context. Safe to re-run: IF NOT EXISTS.
ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 4. Partial index to make the trial-reminder cron's scheduling lookup fast
--    without bloating the primary index on (status, scheduled_for).
CREATE INDEX IF NOT EXISTS idx_email_queue_user_type_status
  ON public.email_queue (user_id, email_type, status);
