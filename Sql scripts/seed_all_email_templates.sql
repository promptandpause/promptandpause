-- ============================================================================
-- Seed All Email Templates
-- ============================================================================
-- This script creates entries for ALL email templates used in the application
-- Run this in Supabase SQL Editor to populate the email_templates table
-- ============================================================================

-- First, ensure the table exists (it should from previous migrations)
-- If not, you'll need to run the admin panel migration first

-- ============================================================================
-- Insert All Email Templates
-- ============================================================================

INSERT INTO email_templates (template_key, name, description, subject, subject_template, html_body, variables, category, is_active)
VALUES
  -- TRANSACTIONAL EMAILS
  (
    'welcome',
    'Welcome Email',
    'Sent when a new user signs up',
    'Welcome to Prompt & Pause',
    'Welcome to Prompt & Pause',
    '<p>Hi {{userName}},</p><p>Welcome to Prompt &amp; Pause. This is a private space designed to help you pause and reflect &mdash; at your own pace.</p><p>Here''s how most people use Prompt &amp; Pause:</p><ul><li>Each day, you''ll see one thoughtful question. You can write a little or a lot &mdash; there''s no right length.</li><li>Over time, you may receive gentle weekly or monthly reflections that offer perspective on your entries. These are optional.</li><li>Occasionally, something you wrote in the past may resurface &mdash; only when it feels relevant.</li></ul><p>You can adjust when your daily prompt arrives, or update your focus areas, anytime in Settings.</p><p><a href="https://promptandpause.com/dashboard">Open your dashboard</a></p><p>If you ever have questions, just reply to this email &mdash; we read every message.</p>',
    '["userName", "email"]'::JSONB,
    'transactional',
    true
  ),
  (
    'subscription_confirmation',
    'Subscription Confirmation',
    'Sent when user subscribes to premium',
    'Your Premium subscription is confirmed',
    'Your Premium subscription is confirmed',
    '<p>Hi {{userName}}, your {{billingCycle}} subscription for {{amount}} is confirmed.</p>',
    '["userName", "planName", "billingCycle", "amount"]'::JSONB,
    'transactional',
    true
  ),
  (
    'subscription_cancelled',
    'Subscription Cancelled',
    'Sent when user cancels their subscription',
    'Your subscription has been cancelled',
    'Your subscription has been cancelled',
    '<p>Hi {{userName}}, your subscription has been cancelled. Access will continue until {{endDate}}.</p>',
    '["userName", "endDate"]'::JSONB,
    'transactional',
    true
  ),
  (
    'trial_expired',
    'Trial Expired',
    'Sent when user trial period expires',
    'Your trial has expired - Upgrade to continue',
    'Your trial has expired - Upgrade to continue',
    '<p>Hi {{userName}}, your trial expired on {{trialEndDate}}.</p><p>If you''d like to continue with Premium features, you can upgrade at any time.</p>',
    '["userName", "trialEndDate"]'::JSONB,
    'transactional',
    true
  ),
  (
    'data_export',
    'Data Export Ready',
    'Sent when user data export is ready for download',
    'Your data export is ready',
    'Your data export is ready',
    '<p>Hi {{userName}}, your data export from {{exportDate}} is ready for download.</p>',
    '["userName", "exportDate"]'::JSONB,
    'transactional',
    true
  ),
  (
    'password_reset',
    'Password Reset',
    'Sent when user requests password reset',
    'Reset your password',
    'Reset your password',
    '<p>Hi {{userName}}, click <a href="{{resetLink}}">here</a> to reset your password. Link expires at {{expiryTime}}.</p>',
    '["userName", "resetLink", "expiryTime"]'::JSONB,
    'transactional',
    true
  ),

  -- ENGAGEMENT EMAILS
  (
    'daily_prompt',
    'Daily Reflection Prompt',
    'Daily prompt sent to users for reflection',
    'Your reflection prompt',
    'Your reflection prompt',
    '<p>Hi {{userName}}, here is your prompt for {{promptDate}}:</p><p><strong>{{prompt}}</strong></p>',
    '["userName", "prompt", "promptDate"]'::JSONB,
    'transactional',
    true
  ),
  (
    'weekly_digest',
    'Weekly Insights Digest',
    'Weekly AI-generated insights and summary',
    'Your weekly reflection summary',
    'Your weekly reflection summary',
    '<p>Hi {{userName}}, here is your weekly reflection summary for {{weekStart}} - {{weekEnd}}:</p><p>{{insights}}</p><p>Reflections this week: {{reflectionCount}}</p>',
    '["userName", "weekStart", "weekEnd", "insights", "reflectionCount", "streakDays"]'::JSONB,
    'transactional',
    true
  ),
  (
    'streak_milestone',
    'Streak Milestone',
    'Sent when user reaches reflection streak milestone',
    'A note from Prompt & Pause',
    'A note from Prompt & Pause',
    '<p>Hi {{userName}},</p><p>This is a gentle check-in. If you''d like a prompt today, you can open Prompt & Pause whenever you''re ready.</p>',
    '["userName", "streakDays", "nextMilestone"]'::JSONB,
    'transactional',
    true
  ),
  (
    'achievement_unlocked',
    'Achievement Unlocked',
    'Sent when user unlocks a new achievement',
    'A note from Prompt & Pause',
    'A note from Prompt & Pause',
    '<p>Hi {{userName}},</p><p>{{achievementDescription}}</p>',
    '["userName", "achievementName", "achievementDescription", "badgeIcon"]'::JSONB,
    'transactional',
    true
  ),
  (
    'inactivity_reminder',
    'We Miss You',
    'Sent to inactive users to re-engage them',
    'A gentle check-in',
    'A gentle check-in',
    '<p>Hi {{userName}},</p><p>If you''d like a quiet moment to reflect, Prompt & Pause is here whenever you return.</p>',
    '["userName", "lastActiveDate", "daysSinceActive"]'::JSONB,
    'transactional',
    true
  ),

  -- SUPPORT EMAILS
  (
    'support_confirmation',
    'Support Request Received',
    'Confirmation sent when user submits support request',
    'We received your support request',
    'We received your support request',
    '<p>Hi {{userName}}, we received your support request #{{requestId}} about {{subject}} ({{category}}). We will respond soon.</p>',
    '["userName", "requestId", "subject", "category"]'::JSONB,
    'transactional',
    true
  ),
  (
    'support_response',
    'Support Response',
    'Sent when admin responds to support ticket',
    'Response to your support request #{{requestId}}',
    'Response to your support request #{{requestId}}',
    '<p>Hi {{userName}}, {{respondedBy}} responded to your request #{{requestId}}:</p><p>{{responseMessage}}</p>',
    '["userName", "requestId", "responseMessage", "respondedBy"]'::JSONB,
    'transactional',
    true
  ),

  -- NOTIFICATION EMAILS
  (
    'maintenance_start',
    'Scheduled Maintenance Notice',
    'Sent before scheduled maintenance begins',
    'Scheduled Maintenance: {{maintenanceDate}}',
    'Scheduled Maintenance: {{maintenanceDate}}',
    '<p>Hi {{userName}}, scheduled maintenance on {{maintenanceDate}} from {{startTime}} to {{endTime}} ({{duration}}). Reason: {{reason}}</p>',
    '["userName", "maintenanceDate", "startTime", "endTime", "duration", "reason"]'::JSONB,
    'transactional',
    true
  ),
  (
    'maintenance_complete',
    'Maintenance Complete',
    'Sent when maintenance is finished',
    'We are back online! Maintenance complete ✅',
    'We are back online! Maintenance complete ✅',
    '<p>Hi {{userName}}, maintenance completed at {{completedAt}} (took {{duration}}). Changes: {{changes}}</p>',
    '["userName", "completedAt", "duration", "changes"]'::JSONB,
    'transactional',
    true
  ),
  (
    'feature_announcement',
    'New Feature Announcement',
    'Sent when new features are released',
    'New Feature: {{featureName}} 🚀',
    'New Feature: {{featureName}} 🚀',
    '<p>Hi {{userName}}, new feature released on {{releaseDate}}: <strong>{{featureName}}</strong></p><p>{{featureDescription}}</p>',
    '["userName", "featureName", "featureDescription", "releaseDate"]'::JSONB,
    'transactional',
    true
  ),
  (
    'system_alert',
    'System Alert',
    'Critical system notifications',
    'Important: {{alertTitle}}',
    'Important: {{alertTitle}}',
    '<p>Hi {{userName}}, <strong>{{alertTitle}}</strong> ({{severity}})</p><p>{{alertMessage}}</p><p>Action required: {{actionRequired}}</p>',
    '["userName", "alertTitle", "alertMessage", "severity", "actionRequired"]'::JSONB,
    'transactional',
    true
  )

ON CONFLICT (template_key) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  subject_template = EXCLUDED.subject_template,
  html_body = EXCLUDED.html_body,
  variables = EXCLUDED.variables,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- Create Default Customizations for Each Template
-- ============================================================================

INSERT INTO email_template_customizations (
  template_id,
  primary_color,
  secondary_color,
  background_color
)
SELECT 
  id,
  '#4F46E5', -- primary_color (indigo)
  '#818CF8', -- secondary_color (light indigo)
  '#F5F5DC' -- background_color (beige)
FROM email_templates
WHERE NOT EXISTS (
  SELECT 1 FROM email_template_customizations 
  WHERE template_id = email_templates.id
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify all templates were created:

SELECT 
  template_key,
  name,
  category,
  is_active,
  jsonb_array_length(variables) as variable_count
FROM email_templates
ORDER BY category, name;
