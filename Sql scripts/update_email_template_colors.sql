-- =============================================================================
-- Update Email Template Customizations to Forest Green Theme
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Update all existing email_template_customizations to use new Forest Green theme
UPDATE email_template_customizations
SET 
  logo_url = 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg',
  primary_color = '#384c37',    -- Forest green (main accent)
  secondary_color = '#4a6349',  -- Lighter forest
  background_color = '#f4f0eb', -- Warm cream background
  button_text_color = '#ffffff', -- White text on buttons
  updated_at = NOW();

-- Log the update count
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % email template customization(s) to Forest Green theme', updated_count;
END $$;

-- =============================================================================
-- Verify the update
-- =============================================================================
SELECT 
  etc.id,
  et.name as template_name,
  et.template_key,
  etc.primary_color,
  etc.secondary_color,
  etc.background_color,
  etc.updated_at
FROM email_template_customizations etc
JOIN email_templates et ON et.id = etc.template_id
ORDER BY et.name;
