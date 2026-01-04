-- ============================================================================
-- ADD AGE VERIFICATION TO PROFILES TABLE
-- ============================================================================
-- Add age verification fields for UK/US compliance
-- ============================================================================

-- Add age verification columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_verification_method VARCHAR(50) DEFAULT 'self_declared', -- 'self_declared', 'document', 'third_party'
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'US', -- ISO 3166-1 alpha-2
ADD COLUMN IF NOT EXISTS region_compliance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_consent_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_consent_accepted_at TIMESTAMPTZ;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_age_verified ON public.profiles(age_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_profiles_region_compliance ON public.profiles(region_compliance);

-- Add constraint for valid country codes (UK and US for now)
ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS valid_country_code 
  CHECK (country_code IN ('US', 'GB', 'UK'));

-- Add RLS policies for age verification data
CREATE POLICY IF NOT EXISTS "Users can view own age verification" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own age verification" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to check age compliance
CREATE OR REPLACE FUNCTION check_age_compliance()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user meets minimum age requirement based on country
  IF NEW.date_of_birth IS NOT NULL THEN
    DECLARE
      user_age INTEGER;
      min_age INTEGER;
    BEGIN
      -- Calculate age
      user_age := DATE_PART('year', AGE(NOW(), NEW.date_of_birth));
      
      -- Set minimum age based on country
      CASE NEW.country_code
        WHEN 'GB', 'UK' THEN min_age := 16; -- UK/EU minimum age
        WHEN 'US' THEN min_age := 13; -- US minimum age (COPPA)
        ELSE min_age := 16; -- Default to higher age for safety
      END CASE;
      
      -- Set compliance status
      IF user_age >= min_age THEN
        NEW.region_compliance := true;
        NEW.age_verified := true;
      ELSE
        NEW.region_compliance := false;
        NEW.age_verified := false;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for age compliance check
DROP TRIGGER IF EXISTS trigger_check_age_compliance ON public.profiles;
CREATE TRIGGER trigger_check_age_compliance
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_age_compliance();

-- Function to auto-detect country from IP (for future use)
CREATE OR REPLACE FUNCTION detect_country_from_ip(ip_address INET)
RETURNS VARCHAR(2) AS $$
BEGIN
  -- This would integrate with a GeoIP service
  -- For now, return default based on common patterns
  -- In production, integrate with MaxMind GeoIP2 or similar service
  
  -- Simple heuristic for demo (replace with actual GeoIP service)
  IF ip_address IS NOT NULL THEN
    -- UK IP ranges (simplified - use proper GeoIP in production)
    IF ip_address <<= inet '81.0.0.0/8' OR 
       ip_address <<= inet '82.0.0.0/8' OR 
       ip_address <<= inet '83.0.0.0/8' OR 
       ip_address <<= inet '84.0.0.0/8' OR 
       ip_address <<= inet '85.0.0.0/8' THEN
      RETURN 'GB';
    END IF;
  END IF;
  
  RETURN 'US'; -- Default to US
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verification queries
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
--   AND column_name IN ('date_of_birth', 'age_verified', 'country_code', 'region_compliance')
-- ORDER BY ordinal_position;
