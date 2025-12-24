-- ============================================================================
-- Update Email Templates - Daily Reminder & Add Logo to All Templates
-- ============================================================================
-- This script updates the daily_reminder template and adds logo to all templates
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Update daily_reminder template to match new structure
UPDATE email_templates
SET
  name = 'Daily Reminder',
  description = 'Daily reminder sent to users',
  subject = 'Your daily reminder 🔔',
  subject_template = 'Your daily reminder 🔔',
  html_body = '<p>Hi {{userName}}, this is your daily reminder for {{reminderDate}}.</p>',
  variables = '["userName", "reminderDate"]'::JSONB,
  category = 'transactional',
  is_active = true,
  updated_at = NOW()
WHERE template_key LIKE 'template_%' AND name = 'daily_reminder';

-- 2. Add logo_url column to email_template_customizations if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_template_customizations' 
    AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE email_template_customizations 
    ADD COLUMN logo_url TEXT;
  END IF;
END $$;

-- 3. Update all template customizations with the logo URL
UPDATE email_template_customizations
SET logo_url = 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg'
WHERE logo_url IS NULL OR logo_url = '';

-- 4. For templates without customizations, create them with the logo
INSERT INTO email_template_customizations (
  template_id,
  primary_color,
  secondary_color,
  background_color,
  logo_url
)
SELECT 
  id,
  '#4F46E5', -- primary_color (indigo)
  '#818CF8', -- secondary_color (light indigo)
  '#F5F5DC', -- background_color (beige)
  'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg' -- logo_url
FROM email_templates
WHERE NOT EXISTS (
  SELECT 1 FROM email_template_customizations 
  WHERE template_id = email_templates.id
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify all templates have the logo:

SELECT 
  et.template_key,
  et.name,
  etc.logo_url,
  etc.primary_color
FROM email_templates et
LEFT JOIN email_template_customizations etc ON et.id = etc.template_id
ORDER BY et.name;
