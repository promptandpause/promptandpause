-- ============================================================================
-- FINAL FIX - All Email Templates with Consistent Styling
-- ============================================================================
-- This script ensures:
-- 1. NO duplicate logos (logo only in email wrapper, not in html_body)
-- 2. Consistent colors, background, text styling across ALL templates
-- 3. No massive white gaps in header
-- 4. Professional, clean UX
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Define consistent styling variables for all templates
-- Background: #F9FAFB (light gray for sections)
-- Text: #374151 (dark gray for body text)
-- Headings: #1F2937 (darker gray for emphasis)
-- Primary: #4F46E5 (indigo for CTAs)
-- Accent: #818CF8 (light indigo for highlights)

-- 1. Update daily_reminder template
UPDATE email_templates
SET
  name = 'Daily Reminder',
  description = 'Daily reminder sent to users',
  subject = 'Your daily reminder 🔔',
  subject_template = 'Your daily reminder 🔔',
  html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">Here is your daily reminder for {{reminderDate}}.</p></div>',
  variables = '["userName", "reminderDate"]'::JSONB,
  category = 'transactional',
  is_active = true,
  updated_at = NOW()
WHERE template_key LIKE 'template_%' AND name = 'daily_reminder';

-- 2. Update ALL templates with consistent styling (NO logo in html_body)

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Welcome to Prompt & Pause, {{userName}}!</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">We are excited to have you join our community of mindful reflection.</p></div>' WHERE template_key = 'welcome';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Welcome to Premium, {{userName}}!</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">Your {{billingCycle}} subscription for {{amount}} is confirmed. Thank you for supporting Prompt & Pause!</p></div>' WHERE template_key = 'subscription_confirmation';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">Your subscription has been cancelled. Your access will continue until {{endDate}}.</p></div>' WHERE template_key = 'subscription_cancelled';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">Your trial expired on {{trialEndDate}}. Upgrade to continue your reflection journey with Prompt & Pause.</p></div>' WHERE template_key = 'trial_expired';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">Your data export from {{exportDate}} is ready for download.</p></div>' WHERE template_key = 'data_export';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Click the button below to reset your password. This link expires at {{expiryTime}}.</p><div style="text-align: center; margin: 24px 0;"><a href="{{resetLink}}" style="display: inline-block; padding: 14px 32px; background: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a></div></div>' WHERE template_key = 'password_reset';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Here is your reflection prompt for {{promptDate}}:</p><div style="background: #F9FAFB; border-left: 4px solid #4F46E5; padding: 20px; border-radius: 8px; margin: 16px 0;"><p style="color: #1F2937; font-size: 18px; line-height: 28px; margin: 0; font-weight: 500;">{{prompt}}</p></div></div>' WHERE template_key = 'daily_prompt';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Your weekly insights for {{weekStart}} - {{weekEnd}}:</p><div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 16px 0;"><p style="color: #1F2937; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">{{insights}}</p><p style="color: #6B7280; font-size: 14px; margin: 0;"><strong>Reflections:</strong> {{reflectionCount}} | <strong>Streak:</strong> {{streakDays}} days 🔥</p></div></div>' WHERE template_key = 'weekly_digest';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Congratulations {{userName}}! 🎉</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">You have reached a <strong>{{streakDays}}-day streak</strong>! Keep up the amazing work.</p><p style="color: #6B7280; font-size: 14px; line-height: 20px; margin: 0;">Next milestone: {{nextMilestone}} days</p></div>' WHERE template_key = 'streak_milestone';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Congratulations {{userName}}! 🏆</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">You unlocked: <strong>{{achievementName}}</strong></p><div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;"><p style="font-size: 48px; margin: 0 0 8px 0;">{{badgeIcon}}</p><p style="color: #78350F; font-size: 14px; margin: 0;">{{achievementDescription}}</p></div></div>' WHERE template_key = 'achievement_unlocked';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">We noticed you have not been active since {{lastActiveDate}} ({{daysSinceActive}} days ago). We miss you! Come back to continue your reflection journey.</p></div>' WHERE template_key = 'inactivity_reminder';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">We received your support request <strong>#{{requestId}}</strong> about {{subject}} ({{category}}). Our team will respond soon.</p></div>' WHERE template_key = 'support_confirmation';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">{{respondedBy}} responded to your request <strong>#{{requestId}}</strong>:</p><div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 16px 0;"><p style="color: #1F2937; font-size: 16px; line-height: 24px; margin: 0;">{{responseMessage}}</p></div></div>' WHERE template_key = 'support_response';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Scheduled maintenance on <strong>{{maintenanceDate}}</strong> from {{startTime}} to {{endTime}} ({{duration}}).</p><div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin: 16px 0;"><p style="color: #78350F; font-size: 14px; margin: 0;"><strong>Reason:</strong> {{reason}}</p></div></div>' WHERE template_key = 'maintenance_start';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Maintenance completed at {{completedAt}} (took {{duration}}). ✅</p><p style="color: #6B7280; font-size: 14px; line-height: 20px; margin: 16px 0 0 0;"><strong>Changes:</strong> {{changes}}</p></div>' WHERE template_key = 'maintenance_complete';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">New feature released on {{releaseDate}}: <strong>{{featureName}}</strong> 🚀</p><div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 16px 0;"><p style="color: #1F2937; font-size: 16px; line-height: 24px; margin: 0;">{{featureDescription}}</p></div></div>' WHERE template_key = 'feature_announcement';

UPDATE email_templates SET html_body = '<div style="padding: 32px; background: #ffffff;"><div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;"><p style="color: #991B1B; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">{{alertTitle}}</p><p style="color: #7F1D1D; font-size: 14px; margin: 0;">Severity: {{severity}}</p></div><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi {{userName}},</p><p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">{{alertMessage}}</p><p style="color: #1F2937; font-size: 16px; line-height: 24px; margin: 0; font-weight: 600;">Action required: {{actionRequired}}</p></div>' WHERE template_key = 'system_alert';

-- 3. Ensure all templates have logo_url set
UPDATE email_template_customizations
SET logo_url = 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg'
WHERE logo_url IS NULL OR logo_url != 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg';

-- 4. Ensure consistent colors for all template customizations
UPDATE email_template_customizations
SET 
  primary_color = '#4F46E5',
  secondary_color = '#818CF8',
  background_color = '#F5F5DC';

-- ============================================================================
-- Verification Query
-- ============================================================================

SELECT 
  et.template_key,
  et.name,
  et.category,
  LENGTH(et.html_body) as html_length,
  etc.logo_url IS NOT NULL as has_logo,
  etc.primary_color,
  etc.background_color
FROM email_templates et
LEFT JOIN email_template_customizations etc ON et.id = etc.template_id
ORDER BY et.name;
