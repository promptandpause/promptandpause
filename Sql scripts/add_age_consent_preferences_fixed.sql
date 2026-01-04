-- ============================================================================
-- UPDATE USER PREFERENCES FOR AGE CONSENT (FIXED SYNTAX)
-- ============================================================================
-- Add age consent tracking to user preferences
-- ============================================================================

-- Add age consent columns to user_preferences table
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS age_consent_version VARCHAR(10) DEFAULT '2026.01',
ADD COLUMN IF NOT EXISTS age_consent_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_consent_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parental_consent_email TEXT, -- For users under age in some jurisdictions
ADD COLUMN IF NOT EXISTS parental_consent_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parental_consent_verified_at TIMESTAMPTZ;

-- Add index
CREATE INDEX IF NOT EXISTS idx_user_preferences_age_consent 
ON public.user_preferences(age_consent_accepted);

-- Check if policy exists before creating it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can manage own age consent'
        AND tablename = 'user_preferences'
    ) THEN
        CREATE POLICY "Users can manage own age consent" ON public.user_preferences
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Verification
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_preferences' 
--   AND column_name LIKE '%age_consent%'
-- ORDER BY ordinal_position;
