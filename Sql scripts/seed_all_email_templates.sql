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
    'Welcome to Prompt & Pause! 🌟',
    'Welcome to Prompt & Pause! 🌟',
    '<p>Welcome to Prompt & Pause, {{userName}}!</p>',
    '["userName", "email"]'::JSONB,
    'transactional',
    true
  ),
  (
    'subscription_confirmation',
    'Subscription Confirmation',
    'Sent when user subscribes to premium',
    'Welcome to Premium! Your subscription is confirmed 🎉',
    'Welcome to Premium! Your subscription is confirmed 🎉',
    '<p>Welcome to Premium, {{userName}}! Your {{billingCycle}} subscription for {{amount}} is confirmed.</p>',
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
    '<p>Hi {{userName}}, your trial expired on {{trialEndDate}}. Upgrade to continue your reflection journey.</p>',
    '["userName", "trialEndDate"]'::JSONB,
    'transactional',
    true
  ),
  (
    'data_export',
    'Data Export Ready',
    'Sent when user data export is ready for download',
    'Your data export is ready 📦',
    'Your data export is ready 📦',
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
    'Your daily reflection prompt 💭',
    'Your daily reflection prompt 💭',
    '<p>Hi {{userName}}, here is your reflection prompt for {{promptDate}}:</p><p><strong>{{prompt}}</strong></p>',
    '["userName", "prompt", "promptDate"]'::JSONB,
    'transactional',
    true
  ),
  (
    'weekly_digest',
    'Weekly Insights Digest',
    'Weekly AI-generated insights and summary',
    'Your Weekly Insights 📊',
    'Your Weekly Insights 📊',
    '<p>Hi {{userName}}, your weekly insights for {{weekStart}} - {{weekEnd}}:</p><p>{{insights}}</p><p>Reflections: {{reflectionCount}} | Streak: {{streakDays}} days</p>',
    '["userName", "weekStart", "weekEnd", "insights", "reflectionCount", "streakDays"]'::JSONB,
    'transactional',
    true
  ),
  (
    'streak_milestone',
    'Streak Milestone',
    'Sent when user reaches reflection streak milestone',
    'Amazing! You hit a {{streakDays}}-day streak! 🔥',
    'Amazing! You hit a {{streakDays}}-day streak! 🔥',
    '<p>Congratulations {{userName}}! You have reached a {{streakDays}}-day streak! Next milestone: {{nextMilestone}} days.</p>',
    '["userName", "streakDays", "nextMilestone"]'::JSONB,
    'transactional',
    true
  ),
  (
    'achievement_unlocked',
    'Achievement Unlocked',
    'Sent when user unlocks a new achievement',
    'Achievement Unlocked: {{achievementName}} 🏆',
    'Achievement Unlocked: {{achievementName}} 🏆',
    '<p>Congratulations {{userName}}! You unlocked: <strong>{{achievementName}}</strong></p><p>{{achievementDescription}}</p><p>{{badgeIcon}}</p>',
    '["userName", "achievementName", "achievementDescription", "badgeIcon"]'::JSONB,
    'transactional',
    true
  ),
  (
    'inactivity_reminder',
    'We Miss You',
    'Sent to inactive users to re-engage them',
    'We miss you! Come back to your reflection journey 🌱',
    'We miss you! Come back to your reflection journey 🌱',
    '<p>Hi {{userName}}, we noticed you have not been active since {{lastActiveDate}} ({{daysSinceActive}} days ago). Come back to continue your reflection journey!</p>',
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
