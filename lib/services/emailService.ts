import { Resend } from 'resend'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { MonthlyReflection, WeeklyDigest } from '@/lib/types/reflection'
import { logger } from '@/lib/utils/logger'
import { getTemplateByKey } from '@/lib/services/emailTemplateService'
import { EmailTemplateCustomization, DEFAULT_EMAIL_CUSTOMIZATION } from '@/lib/types/emailTemplate'
// Import professional email template system
import { BRAND_COLORS, emailWrapper, contentSection, h1, h2, h3, paragraph, ctaButton, infoBox, alertBox } from '@/lib/services/emailTemplates'

/**
 * Email Service for Prompt & Pause
 * 
 * Handles all transactional email delivery using Resend API.
 * All emails are logged to the email_delivery_log table for tracking.
 * 
 * Environment Variables Required:
 * - RESEND_API_KEY: API key from Resend
 * - NOREPLY_EMAIL: Verified sender email address
 */

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = process.env.NOREPLY_EMAIL || 'noreply@promptandpause.com'
const PROMPTS_EMAIL = process.env.RESEND_FROM_EMAIL || 'prompts@promptandpause.com'
const BILLING_EMAIL = process.env.BILLING_EMAIL || 'billing@promptandpause.com'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@promptandpause.com'
const NOREPLY_EMAIL = process.env.NOREPLY_EMAIL || 'noreply@promptandpause.com'
const APP_NAME = 'Prompt & Pause'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promptandpause.com'


// Brand colors from professional template system - Twitter-like white/blue/black theme
const BG_CREAM = BRAND_COLORS.backgroundLight   // #f7f8fa - Light gray
const BG_WHITE = BRAND_COLORS.backgroundPure    // #ffffff - Pure white
const BG_LIGHT = BRAND_COLORS.backgroundSection // #f0f1f3 - Section gray
const BORDER_COLOR = BRAND_COLORS.border        // #eff3f4 - Border gray
const TEXT_DARK = BRAND_COLORS.textDark         // #0f1419 - Near black
const TEXT_GRAY = BRAND_COLORS.textGray         // #536471 - Secondary text
const TEXT_MUTED = BRAND_COLORS.textMuted       // #8b98a5 - Muted text
const PRIMARY_ACCENT = BRAND_COLORS.primary     // #1d9bf0 - Twitter blue
const SECONDARY_ACCENT = BRAND_COLORS.primaryLight // #4ab3f4 - Light blue

// Brand CDN Logo URL - Links to homepage
const LOGO_URL = 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg'

function renderTemplateString(template: string, variables: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key]
    if (value === null || value === undefined) return _match
    return String(value)
  })
}

const SUBJECT_TEMPLATE_OVERRIDES: Record<string, string> = {
  support_confirmation: 'Support ticket #{{requestId}} received',
  support_response: 'Support ticket #{{requestId}} update',
}

async function getSubjectForTemplate(
  templateKey: string,
  variables: Record<string, string | number | null | undefined> = {}
): Promise<string> {
  try {
    const override = SUBJECT_TEMPLATE_OVERRIDES[templateKey]
    if (override) {
      return renderTemplateString(override, variables)
    }

    const result = await getTemplateByKey(templateKey)
    if (result.success && result.data?.subject_template) {
      return renderTemplateString(result.data.subject_template, variables)
    }
  } catch (error) {
    logger.error('email_subject_template_fetch_error', { error, templateKey })
  }
  return APP_NAME
}

async function logEmailSend(params: {
  userId: string
  recipientEmail: string
  subject: string
  templateName: string
  provider: string
  status: string
  providerMessageId?: string | null
  errorMessage?: string | null
  metadata?: Record<string, any>
  sentAt?: string
}): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('email_logs')
      .insert({
        user_id: params.userId,
        recipient_email: params.recipientEmail,
        subject: params.subject,
        template_name: params.templateName,
        provider: params.provider,
        status: params.status,
        provider_message_id: params.providerMessageId || null,
        error_message: params.errorMessage || null,
        metadata: params.metadata || null,
        sent_at: params.sentAt || new Date().toISOString(),
      })

    if (error) {
      logger.error('email_logs_insert_error', {
        error,
        templateName: params.templateName,
        recipientEmail: params.recipientEmail,
        status: params.status,
      })
    }
  } catch (error) {
    logger.error('email_logs_unexpected_insert_error', { error, templateName: params.templateName })
  }
}

// =============================================================================
// CUSTOMIZATION CACHING AND DB INTEGRATION
// =============================================================================

// In-memory cache for template customizations (5-minute TTL)
interface CachedCustomization {
  customization: EmailTemplateCustomization
  fetchedAt: number
}

const customizationCache = new Map<string, CachedCustomization>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get template customization with caching and fallback to defaults
 * @param templateKey - Template key to fetch customization for
 * @returns Customization or defaults if DB fetch fails
 */
async function getTemplateCustomization(templateKey: string): Promise<EmailTemplateCustomization> {
  // Check cache first
  const cached = customizationCache.get(templateKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.customization
  }

  try {
    // Fetch from database
    const result = await getTemplateByKey(templateKey)
    
    if (result.success && result.data?.customization) {
      const customization = result.data.customization
      
      // Cache the result
      customizationCache.set(templateKey, {
        customization,
        fetchedAt: Date.now(),
      })
      
      return customization
    }
    
    // No customization found, use defaults
    logger.warn('email_customization_not_found', { templateKey })
    return createDefaultCustomization()
  } catch (error) {
    // On DB error, fallback to defaults
    logger.error('email_customization_fetch_error', { error, templateKey })
    return createDefaultCustomization()
  }
}

/**
 * Create default customization object from constants
 */
function createDefaultCustomization(): EmailTemplateCustomization {
  return {
    id: 'default',
    template_id: 'default',
    logo_url: DEFAULT_EMAIL_CUSTOMIZATION.logo_url,
    primary_color: DEFAULT_EMAIL_CUSTOMIZATION.primary_color,
    secondary_color: DEFAULT_EMAIL_CUSTOMIZATION.secondary_color,
    background_color: DEFAULT_EMAIL_CUSTOMIZATION.background_color,
    button_text_color: DEFAULT_EMAIL_CUSTOMIZATION.button_text_color,
    custom_css: null,
    custom_header_text: null,
    custom_footer_text: null,
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Bust cache for a specific template (called after updates)
 */
export function bustCustomizationCache(templateKey: string): void {
  customizationCache.delete(templateKey)
  logger.info('email_customization_cache_busted', { templateKey })
}

/**
 * Clear entire customization cache
 */
export function clearCustomizationCache(): void {
  customizationCache.clear()
  logger.info('email_customization_cache_cleared')
}

/**
 * Sanitize custom CSS to prevent injection attacks
 * Whitelist basic safe CSS properties
 */
function sanitizeCustomCSS(css: string | null): string {
  if (!css) return ''
  
  // Remove script tags, javascript:, and on* event handlers
  let sanitized = css
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
  
  // Whitelist approach: only allow safe CSS properties
  const safeProperties = [
    'color', 'background', 'background-color', 'font-size', 'font-weight',
    'font-family', 'text-align', 'margin', 'padding', 'border', 'border-radius',
    'width', 'height', 'display', 'line-height', 'letter-spacing'
  ]
  
  // Basic validation - in production, use a proper CSS parser
  const lines = sanitized.split(';').filter(line => {
    const property = line.split(':')[0]?.trim().toLowerCase()
    return property && safeProperties.includes(property)
  })
  
  return lines.join('; ')
}

/**
 * Apply customization to HTML template
 * @param html - Base HTML template
 * @param customization - Customization to apply
 * @returns Customized HTML
 */
function applyCustomization(html: string, customization: EmailTemplateCustomization): string {
  let customized = html
  
  // Replace logo URL if customized
  if (customization.logo_url) {
    customized = customized.replace(
      new RegExp(LOGO_URL, 'g'),
      customization.logo_url
    )
  }
  
  // Replace color variables
  customized = customized
    .replace(new RegExp(PRIMARY_ACCENT, 'g'), customization.primary_color)
    .replace(new RegExp(SECONDARY_ACCENT, 'g'), customization.secondary_color)
    .replace(new RegExp(BG_CREAM, 'g'), customization.background_color)
  
  // Inject custom CSS if provided (in <head>)
  if (customization.custom_css) {
    const sanitizedCSS = sanitizeCustomCSS(customization.custom_css)
    if (sanitizedCSS) {
      customized = customized.replace(
        '</head>',
        `<style type="text/css">${sanitizedCSS}</style></head>`
      )
    }
  }
  
  // Replace custom header text if provided
  if (customization.custom_header_text) {
    // Inject after logo in header
    customized = customized.replace(
      /(<!--[\s\S]*?Header with Logo[\s\S]*?<\/td>)/,
      `$1\n<tr><td style="padding: 16px 20px; text-align: center;">${customization.custom_header_text}</td></tr>`
    )
  }
  
  // Replace footer text if provided
  if (customization.custom_footer_text) {
    customized = customized.replace(
      /(<!--[\s\S]*?Footer[\s\S]*?)<p style="color: [^"]+; font-size: 13px[^>]+>[^<]+<\/p>/,
      `$1<p style="color: ${TEXT_GRAY}; font-size: 13px; margin: 0 0 8px 0;">${customization.custom_footer_text}</p>`
    )
  }
  
  return customized
}

// =============================================================================
// UNIVERSAL EMAIL TEMPLATE UTILITIES
// =============================================================================

/**
 * Generate logo img tag with conditional color inversion
 * @param onDarkBackground - Whether the logo is on a dark background (requires white inversion)
 */
function getLogoImgTag(onDarkBackground: boolean = false): string {
  const filterStyle = onDarkBackground ? 'filter: brightness(0) invert(1);' : ''
  return `<img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 44px; width: auto; display: block; ${filterStyle}" />`
}

/**
 * Generate a standard button using the new professional template system
 * @param href - Button link URL
 * @param label - Button text
 */
function standardButton({ href, label }: { href: string; label: string }): string {
  return ctaButton(label, href)
}

/**
 * Generate universal base email HTML structure using new professional template system
 * @param options - Email template options
 */
function buildBaseEmail(options: {
  preheader: string
  title: string
  bodyHTML: string
  footerHTML?: string
}): string {
  const { preheader, title, bodyHTML, footerHTML } = options
  
  return emailWrapper(bodyHTML, { preheader, title })
}

// =============================================================================
// EMAIL SENDING FUNCTIONS
// =============================================================================

// =============================================================================
// EMAIL GENERATION WITH CUSTOMIZATION
// =============================================================================

/**
 * Generate email HTML with DB-backed customization
 * @param templateKey - Template key for fetching customization
 * @param generator - Function that generates the base HTML
 * @returns Customized HTML or base HTML on error
 */
async function generateWithCustomization(
  templateKey: string,
  generator: () => string
): Promise<string> {
  try {
    const customization = await getTemplateCustomization(templateKey)
    const baseHTML = generator()
    return applyCustomization(baseHTML, customization)
  } catch (error) {
    logger.error('email_customization_apply_error', { error, templateKey })
    // Fallback to base HTML on error
    return generator()
  }
}

// =============================================================================
// EMAIL SENDING FUNCTIONS
// =============================================================================

/**
 * Send welcome email to new users after signup
 * 
 * @param email - Recipient email address
 * @param name - User's name (or fallback to email)
 * @returns Promise with email send result
 */
export async function sendWelcomeEmail(
  email: string,
  name: string | null,
  userId?: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = name || email.split('@')[0]
    const html = await generateWithCustomization('welcome', () => 
      generateWelcomeEmailHTML(displayName)
    )

    const subject = await getSubjectForTemplate('welcome', { userName: displayName })

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_welcome_send_error', { error, email })
      await logEmailSend({
        userId: userId || 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'welcome',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: userId || 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'welcome',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_welcome_unexpected_error', { error, email })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send "getting started" email — fires after onboarding completes.
 *
 * Distinct from the welcome email (which goes out on first login). This one
 * arrives once the user has a `user_preferences` row and gives them three
 * concrete next steps in their reflection practice.
 *
 * @param email - Recipient email address
 * @param name - User's name (or fallback to email)
 * @param userId - Optional user ID for logging
 * @returns Promise with email send result
 */
export async function sendGettingStartedEmail(
  email: string,
  name: string | null,
  userId?: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = name || email.split('@')[0]
    const html = await generateWithCustomization('getting_started', () =>
      generateGettingStartedEmailHTML(displayName)
    )

    // Falls back to a sensible default when the admin hasn't customized
    // the subject for this template yet.
    const subject =
      (await getSubjectForTemplate('getting_started', { userName: displayName })) ||
      `You're set up, ${displayName} — here's how to start`

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_getting_started_send_error', { error, email })
      await logEmailSend({
        userId: userId || 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'getting_started',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: userId || 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'getting_started',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_getting_started_unexpected_error', { error, email })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send "trial started" email — confirms the 7-day premium trial is active.
 *
 * Honest companion to the existing `trial_expiration` / `trial_expired`
 * emails: tells the user up-front what they get, when it ends, and that
 * they'll be warned 48h before. Reduces support tickets from users who
 * discover the trial only when it silently downgrades.
 */
export async function sendTrialStartedEmail(
  email: string,
  name: string | null,
  trialEndDate: string,
  userId?: string | null,
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = name || email.split('@')[0]
    const html = await generateWithCustomization('trial_started', () =>
      generateTrialStartedEmailHTML(displayName, trialEndDate),
    )

    const subject =
      (await getSubjectForTemplate('trial_started', { userName: displayName })) ||
      `Your ${APP_NAME} trial is on — until ${formatTrialDate(trialEndDate)}`

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_trial_started_send_error', { error, email })
      await logEmailSend({
        userId: userId || 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'trial_started',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: userId || 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'trial_started',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_trial_started_unexpected_error', { error, email })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send "trial ending soon" email — fires ~48 hours before trial_end_date.
 *
 * Complements the existing expiration email. Gives the user runway to
 * decide before any downgrade. Tone is calm, not urgent (Stripe Dashboard
 * standard: clarity about what changes, no countdown-timer anxiety).
 */
export async function sendTrialEndingSoonEmail(
  email: string,
  name: string | null,
  trialEndDate: string,
  userId?: string | null,
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = name || email.split('@')[0]
    const html = await generateWithCustomization('trial_ending_soon', () =>
      generateTrialEndingSoonEmailHTML(displayName, trialEndDate),
    )

    const subject =
      (await getSubjectForTemplate('trial_ending_soon', { userName: displayName })) ||
      `Your trial ends ${formatTrialDate(trialEndDate)}`

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_trial_ending_soon_send_error', { error, email })
      await logEmailSend({
        userId: userId || 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'trial_ending_soon',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: userId || 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'trial_ending_soon',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_trial_ending_soon_unexpected_error', { error, email })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send "new device sign-in" security email.
 *
 * Fires the first time we see a given (country, browser-family) combo for a
 * user. Linear-tier security hygiene: calm, not alarming. No marketing,
 * no links other than a single "secure your account" action.
 *
 * Send inline from the auth callback (not queued) — security emails should
 * arrive as close to the event as possible. The sender is still idempotent
 * via its own short-circuits below + a 30-day email_logs lookback in the
 * caller (see auth callback's new-device detection).
 */
export async function sendNewDeviceSignInEmail(
  email: string,
  name: string | null,
  details: {
    country?: string | null
    city?: string | null
    userAgent?: string | null
    signedInAt?: string
  },
  userId?: string | null,
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = name || email.split('@')[0]
    const html = await generateWithCustomization('new_device_sign_in', () =>
      generateNewDeviceSignInEmailHTML(displayName, details),
    )

    const subject =
      (await getSubjectForTemplate('new_device_sign_in', {
        userName: displayName,
      })) || `New sign-in to your ${APP_NAME} account`

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_new_device_send_error', { error, email })
      await logEmailSend({
        userId: userId || 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'new_device_sign_in',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: userId || 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'new_device_sign_in',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_new_device_unexpected_error', { error, email })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send "payment failed" email — fires from the Stripe webhook on
 * `invoice.payment_failed`. Calm, specific, no countdown language.
 */
export async function sendPaymentFailedEmail(
  email: string,
  name: string | null,
  details: {
    amount?: number | null
    currency?: string | null
    nextAttemptAt?: string | null
  },
  userId?: string | null,
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = name || email.split('@')[0]
    const html = await generateWithCustomization('payment_failed', () =>
      generatePaymentFailedEmailHTML(displayName, details),
    )

    const subject =
      (await getSubjectForTemplate('payment_failed', { userName: displayName })) ||
      `We couldn't process your ${APP_NAME} payment`

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_payment_failed_send_error', { error, email })
      await logEmailSend({
        userId: userId || 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'payment_failed',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: userId || 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'payment_failed',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_payment_failed_unexpected_error', { error, email })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send the monthly reflection email (Premium-only).
 *
 * Fulfils the pricing-page promise of a "monthly reflection" feature. Sent
 * on the 1st of each month by /api/cron/send-monthly-reflection, scoped to
 * the previous calendar month. Zero-reflection months are intentionally
 * skipped by the cron, so the body always has something to say.
 */
export async function sendMonthlyReflectionEmail(
  email: string,
  userId: string,
  name: string | null,
  reflection: MonthlyReflection,
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = name || email.split('@')[0]
    const html = await generateWithCustomization('monthly_reflection', () =>
      generateMonthlyReflectionEmailHTML(displayName, reflection),
    )

    const subject =
      (await getSubjectForTemplate('monthly_reflection', {
        userName: displayName,
        monthLabel: reflection.monthLabel,
      })) || `Your ${reflection.monthLabel} reflection`

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${PROMPTS_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_monthly_reflection_send_error', { error, email, userId })
      await logEmailSend({
        userId,
        recipientEmail: email,
        subject,
        templateName: 'monthly_reflection',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId,
      recipientEmail: email,
      subject,
      templateName: 'monthly_reflection',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_monthly_reflection_unexpected_error', { error, email, userId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/** Human-friendly date used in trial email subjects + bodies. */
function formatTrialDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  } catch {
    return 'soon'
  }
}

/**
 * Send daily reflection prompt email
 * 
 * @param email - Recipient email address
 * @param prompt - The daily reflection prompt text
 * @param userId - User ID for logging
 * @param userName - User's name for personalization
 * @returns Promise with email send result
 */
export async function sendDailyPromptEmail(
  email: string,
  prompt: string,
  userId: string,
  userName: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      await logEmailDelivery(userId, 'daily_prompt', email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('daily_prompt', () => 
      generateDailyPromptEmailHTML(displayName, prompt)
    )

    const subject = await getSubjectForTemplate('daily_prompt', { userName: displayName })

    // Retry logic for rate limit errors (429) with exponential backoff
    const MAX_RETRIES = 3
    let lastError: any = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { data, error } = await resend.emails.send({
        from: `${APP_NAME} <${PROMPTS_EMAIL}>`,
        to: email,
        subject,
        html,
      })

      if (!error) {
        await logEmailDelivery(userId, 'daily_prompt', email, 'sent', data?.id || null)
        await logEmailSend({
          userId,
          recipientEmail: email,
          subject,
          templateName: 'daily_prompt',
          provider: 'resend',
          status: 'sent',
          providerMessageId: data?.id || null,
        })
        return { success: true, emailId: data?.id }
      }

      lastError = error

      // If rate limited and we have retries left, wait with exponential backoff
      if (error.message?.includes('rate_limit') && attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt + 1) * 500 // 1s, 2s, 4s
        logger.warn('email_prompt_rate_limited', { email, userId, attempt: attempt + 1, backoffMs })
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }

      // Non-rate-limit error or exhausted retries
      break
    }

    logger.error('email_prompt_send_error', { error: lastError, email, userId })
    await logEmailDelivery(userId, 'daily_prompt', email, 'failed', null, lastError?.message)
    await logEmailSend({
      userId,
      recipientEmail: email,
      subject,
      templateName: 'daily_prompt',
      provider: 'resend',
      status: 'failed',
      providerMessageId: null,
      errorMessage: lastError?.message,
    })
    return { success: false, error: lastError?.message }
  } catch (error) {
    logger.error('email_prompt_unexpected_error', { error, email, userId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery(userId, 'daily_prompt', email, 'failed', null, errorMessage)
    await logEmailSend({
      userId,
      recipientEmail: email,
      subject: APP_NAME,
      templateName: 'daily_prompt',
      provider: 'resend',
      status: 'failed',
      providerMessageId: null,
      errorMessage,
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * Batch send daily prompt emails using Resend's batch API
 * Sends up to 100 emails per API call (counts as 1 request against rate limit)
 * With 600ms delay between batch calls, handles 5000+ users in ~30 seconds
 * 
 * @param emailPayloads - Array of { email, prompt, userId, userName } objects
 * @returns Promise with batch results
 */
export async function sendBatchDailyPromptEmails(
  emailPayloads: Array<{ email: string; prompt: string; userId: string; userName: string | null }>
): Promise<{ sent: number; failed: number; results: Array<{ userId: string; status: 'sent' | 'failed'; emailId?: string; error?: string }> }> {
  if (!process.env.RESEND_API_KEY) {
    return {
      sent: 0,
      failed: emailPayloads.length,
      results: emailPayloads.map(p => ({ userId: p.userId, status: 'failed' as const, error: 'Email service not configured' })),
    }
  }

  const BATCH_SIZE = 100 // Resend max per batch call
  const RATE_LIMIT_DELAY_MS = 600 // Stay under 2 req/sec
  const MAX_RETRIES = 3

  // Pre-generate all HTML content (this is CPU-bound, not API-bound)
  const subject = await getSubjectForTemplate('daily_prompt', {})
  const preparedEmails: Array<{
    userId: string
    email: string
    resendPayload: { from: string; to: string; subject: string; html: string }
  }> = []

  for (const payload of emailPayloads) {
    const displayName = payload.userName || payload.email.split('@')[0]
    const html = await generateWithCustomization('daily_prompt', () =>
      generateDailyPromptEmailHTML(displayName, payload.prompt)
    )
    const userSubject = await getSubjectForTemplate('daily_prompt', { userName: displayName })

    preparedEmails.push({
      userId: payload.userId,
      email: payload.email,
      resendPayload: {
        from: `${APP_NAME} <${PROMPTS_EMAIL}>`,
        to: payload.email,
        subject: userSubject || subject,
        html,
      },
    })
  }

  // Send in batches of 100 using Resend batch API
  const allResults: Array<{ userId: string; status: 'sent' | 'failed'; emailId?: string; error?: string }> = []
  let totalSent = 0
  let totalFailed = 0

  for (let i = 0; i < preparedEmails.length; i += BATCH_SIZE) {
    const batch = preparedEmails.slice(i, i + BATCH_SIZE)
    const batchPayloads = batch.map(b => b.resendPayload)

    let success = false
    let lastError: any = null
    let responseData: any = null

    // Retry with exponential backoff for rate limit errors
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await resend.batch.send(batchPayloads)

        if (!error && data) {
          responseData = data
          success = true
          break
        }

        lastError = error

        if (error?.message?.includes('rate_limit') && attempt < MAX_RETRIES) {
          const backoffMs = Math.pow(2, attempt + 1) * 500
          logger.warn('email_batch_rate_limited', { batchIndex: i / BATCH_SIZE, attempt: attempt + 1, backoffMs })
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          continue
        }

        break
      } catch (err) {
        lastError = err
        if (attempt < MAX_RETRIES) {
          const backoffMs = Math.pow(2, attempt + 1) * 500
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          continue
        }
        break
      }
    }

    if (success && responseData) {
      // Map results back to users
      const dataArray = Array.isArray(responseData) ? responseData : (responseData.data || [])
      for (let j = 0; j < batch.length; j++) {
        const emailId = dataArray[j]?.id || null
        allResults.push({ userId: batch[j].userId, status: 'sent', emailId })
        totalSent++

        // Log each successful send
        logEmailDelivery(batch[j].userId, 'daily_prompt', batch[j].email, 'sent', emailId).catch(() => {})
        logEmailSend({
          userId: batch[j].userId,
          recipientEmail: batch[j].email,
          subject: batch[j].resendPayload.subject,
          templateName: 'daily_prompt',
          provider: 'resend',
          status: 'sent',
          providerMessageId: emailId,
        }).catch(() => {})
      }
    } else {
      // Entire batch failed
      const errorMsg = lastError instanceof Error ? lastError.message : (lastError?.message || 'Batch send failed')
      for (const item of batch) {
        allResults.push({ userId: item.userId, status: 'failed', error: errorMsg })
        totalFailed++

        logEmailDelivery(item.userId, 'daily_prompt', item.email, 'failed', null, errorMsg).catch(() => {})
        logEmailSend({
          userId: item.userId,
          recipientEmail: item.email,
          subject: item.resendPayload.subject,
          templateName: 'daily_prompt',
          provider: 'resend',
          status: 'failed',
          providerMessageId: null,
          errorMessage: errorMsg,
        }).catch(() => {})
      }
    }

    // Rate limit delay between batch API calls (not after the last one)
    if (i + BATCH_SIZE < preparedEmails.length) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS))
    }
  }

  return { sent: totalSent, failed: totalFailed, results: allResults }
}

/**
 * Send weekly digest email with reflection summary
 * 
 * @param email - Recipient email address
 * @param userId - User ID for logging
 * @param userName - User's name for personalization
 * @param digestData - Weekly digest data
 * @returns Promise with email send result
 */
export async function sendWeeklyDigestEmail(
  email: string,
  userId: string,
  userName: string | null,
  digestData: WeeklyDigest
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      await logEmailDelivery(userId, 'weekly_digest', email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('weekly_digest', () => 
      generateWeeklyDigestEmailHTML(displayName, digestData)
    )

    const subject = await getSubjectForTemplate('weekly_digest', {
      userName: displayName,
      weekStart: digestData.weekStart,
      weekEnd: digestData.weekEnd,
    })

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${PROMPTS_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_digest_send_error', { error, email, userId })
      await logEmailDelivery(userId, 'weekly_digest', email, 'failed', null, error.message)
      await logEmailSend({
        userId,
        recipientEmail: email,
        subject,
        templateName: 'weekly_digest',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }
    await logEmailDelivery(userId, 'weekly_digest', email, 'sent', data?.id || null)

    await logEmailSend({
      userId,
      recipientEmail: email,
      subject,
      templateName: 'weekly_digest',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_digest_unexpected_error', { error, email, userId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery(userId, 'weekly_digest', email, 'failed', null, errorMessage)
    await logEmailSend({
      userId,
      recipientEmail: email,
      subject: APP_NAME,
      templateName: 'weekly_digest',
      provider: 'resend',
      status: 'failed',
      providerMessageId: null,
      errorMessage,
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * Send subscription confirmation or cancellation email
 * 
 * @param email - Recipient email address
 * @param userId - User ID for logging
 * @param type - Email type: 'confirmation' or 'cancellation'
 * @param planName - Subscription plan name (e.g., 'Monthly Premium', 'Annual Premium')
 * @param userName - User's name for personalization
 * @returns Promise with email send result
 */
/**
 * Send trial expiration email
 * 
 * @param email - Recipient email address
 * @param userId - User ID for logging
 * @param userName - User's name for personalization
 * @returns Promise with email send result
 */
export async function sendTrialExpiredEmail(
  email: string,
  userId: string,
  userName: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      await logEmailDelivery(userId, 'trial_expired', email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]

    const html = await generateWithCustomization('trial_expired', () => 
      generateTrialExpiredEmailHTML(displayName)
    )

    const subject = await getSubjectForTemplate('trial_expired', { userName: displayName })

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_trial_expired_send_error', { error, email, userId })
      await logEmailDelivery(userId, 'trial_expired', email, 'failed', null, error.message)
      await logEmailSend({
        userId,
        recipientEmail: email,
        subject,
        templateName: 'trial_expired',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }
    await logEmailDelivery(userId, 'trial_expired', email, 'sent', data?.id || null)

    await logEmailSend({
      userId,
      recipientEmail: email,
      subject,
      templateName: 'trial_expired',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_trial_expired_unexpected_error', { error, email, userId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery(userId, 'trial_expired', email, 'failed', null, errorMessage)
    await logEmailSend({
      userId,
      recipientEmail: email,
      subject: APP_NAME,
      templateName: 'trial_expired',
      provider: 'resend',
      status: 'failed',
      providerMessageId: null,
      errorMessage,
    })
    return { success: false, error: errorMessage }
  }
}

export async function sendSubscriptionEmail(
  email: string,
  userId: string,
  type: 'confirmation' | 'cancellation',
  planName: string,
  userName: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      const emailType = type === 'confirmation' ? 'subscription_confirm' : 'subscription_cancelled'
      await logEmailDelivery(userId, emailType, email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const emailType = type === 'confirmation' ? 'subscription_confirm' : 'subscription_cancelled'

    const templateKey = type === 'confirmation' ? 'subscription_confirmation' : 'subscription_cancelled'
    const subject = await getSubjectForTemplate(templateKey, { userName: displayName, planName })

    const html = await generateWithCustomization(
      templateKey,
      () => type === 'confirmation'
        ? generateSubscriptionConfirmationHTML(displayName, planName)
        : generateSubscriptionCancellationHTML(displayName, planName)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_subscription_send_error', { error, email, userId, type, planName })
      await logEmailDelivery(userId, emailType, email, 'failed', null, error.message)
      await logEmailSend({
        userId,
        recipientEmail: email,
        subject,
        templateName: templateKey,
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
        metadata: { planName, type },
      })
      return { success: false, error: error.message }
    }
    await logEmailDelivery(userId, emailType, email, 'sent', data?.id || null)

    await logEmailSend({
      userId,
      recipientEmail: email,
      subject,
      templateName: templateKey,
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
      metadata: { planName, type },
    })
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_subscription_unexpected_error', { error, email, userId, type, planName })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const emailType = type === 'confirmation' ? 'subscription_confirm' : 'subscription_cancelled'
    await logEmailDelivery(userId, emailType, email, 'failed', null, errorMessage)
    await logEmailSend({
      userId,
      recipientEmail: email,
      subject: APP_NAME,
      templateName: type === 'confirmation' ? 'subscription_confirmation' : 'subscription_cancelled',
      provider: 'resend',
      status: 'failed',
      providerMessageId: null,
      errorMessage,
      metadata: { planName, type },
    })
    return { success: false, error: errorMessage }
  }
}

// =============================================================================
// EMAIL LOGGING
// =============================================================================

/**
 * Send data export email with PDF attachment
 * 
 * @param email - Recipient email address
 * @param userId - User ID for logging
 * @param userName - User's name for personalization
 * @param pdfBuffer - PDF file buffer
 * @returns Promise with email send result
 */
export async function sendDataExportEmail(
  email: string,
  userId: string,
  userName: string | null,
  pdfBuffer: Buffer
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      await logEmailDelivery(userId, 'data_export', email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('data_export', () => 
      generateDataExportEmailHTML(displayName)
    )

    const subject = await getSubjectForTemplate('data_export', { userName: displayName })

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: `promptandpause-data-export-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      logger.error('email_data_export_send_error', { error, email, userId })
      await logEmailDelivery(userId, 'data_export', email, 'failed', null, error.message)
      await logEmailSend({
        userId,
        recipientEmail: email,
        subject,
        templateName: 'data_export',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }
    await logEmailDelivery(userId, 'data_export', email, 'sent', data?.id || null)

    await logEmailSend({
      userId,
      recipientEmail: email,
      subject,
      templateName: 'data_export',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_data_export_unexpected_error', { error, email, userId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery(userId, 'data_export', email, 'failed', null, errorMessage)
    await logEmailSend({
      userId,
      recipientEmail: email,
      subject: APP_NAME,
      templateName: 'data_export',
      provider: 'resend',
      status: 'failed',
      providerMessageId: null,
      errorMessage,
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * Send account deletion confirmation email
 * 
 * Sent AFTER the account has been deleted. Since the user no longer exists,
 * we skip delivery logging (user_id is gone) but still log to email_logs table
 * using a placeholder ID.
 * 
 * @param email - Recipient email address
 * @param userId - Former user ID (for logging only)
 * @param userName - User's name for personalization
 * @returns Promise with email send result
 */
export async function sendAccountDeletionEmail(
  email: string,
  userId: string,
  userName: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('account_deletion', () => 
      generateAccountDeletionEmailHTML(displayName)
    )

    const subject = 'Your Prompt & Pause account has been deleted'

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_account_deletion_send_error', { error, email })
      return { success: false, error: error.message }
    }

    logger.info('email_account_deletion_sent', { email, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_account_deletion_unexpected_error', { error, email })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// =============================================================================
// EMAIL LOGGING
// =============================================================================

/**
 * Log email delivery to database for tracking and analytics
 * 
 * @param userId - User ID
 * @param emailType - Type of email sent
 * @param recipientEmail - Recipient's email address
 * @param status - Delivery status
 * @param resendEmailId - Resend email ID (if available)
 * @param errorMessage - Error message (if failed)
 */
export async function logEmailDelivery(
  userId: string,
  emailType: 'daily_prompt' | 'weekly_digest' | 'welcome' | 'subscription_confirm' | 'subscription_cancelled' | 'data_export' | 'trial_expired' | 'discount_invitation' | 'gift_recipient' | 'gift_buyer_confirm' | 'gift_activated' | 'gift_redeemed_buyer' | 'gift_expiring_soon',
  recipientEmail: string,
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed',
  resendEmailId: string | null,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    const logEntry = {
      user_id: userId,
      email_type: emailType,
      resend_email_id: resendEmailId,
      recipient_email: recipientEmail,
      status,
      error_message: errorMessage || null,
      sent_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('email_delivery_log')
      .insert(logEntry)

    if (error) {
      logger.error('email_delivery_log_error', { error, userId, emailType, recipientEmail, status })
    }
  } catch (error) {
    logger.error('email_delivery_unexpected_log_error', { error, userId, emailType, recipientEmail, status })
    // Don't throw - logging failures shouldn't break email sending
  }
}

// =============================================================================
// EMAIL HTML TEMPLATES
// =============================================================================

/**
 * Generate welcome email HTML using professional template system
 */
function generateWelcomeEmailHTML(name: string): string {
  const dashboardUrl = `${APP_URL.replace(/\/$/, '')}/dashboard`
  const bodyHTML = contentSection(`
    ${h1(`Welcome to ${APP_NAME}`)}
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph(`Welcome to ${APP_NAME}. This is a private space designed to help you pause and reflect — at your own pace.`)}
    
    ${paragraph(`Here\'s how most people use ${APP_NAME}:`)}
    
    ${infoBox(`
      <ul class="email-text-gray" style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <li class="email-text-gray" style="margin-bottom: 10px;">Each day, you\'ll see one thoughtful question. You can write a little or a lot — there\'s no right length.</li>
        <li class="email-text-gray" style="margin-bottom: 10px;">Over time, you may receive gentle weekly or monthly reflections that offer perspective on your entries. These are optional.</li>
        <li class="email-text-gray">Occasionally, something you wrote in the past may resurface — only when it feels relevant.</li>
      </ul>
    `)}
    
    ${paragraph('You can adjust when your daily prompt arrives, or update your focus areas, anytime in Settings.')}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: dashboardUrl, label: 'Open your dashboard' })}
    </div>
    
    ${paragraph('If you ever have questions, just reply to this email — we read every message.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: 'Welcome to Prompt & Pause',
    title: 'Welcome to Prompt & Pause',
    bodyHTML,
  })
}

/**
 * Generate "getting started" email HTML — sent once onboarding completes.
 *
 * Tone: quiet, specific, action-oriented (Apple HIG + Stripe dashboard clarity
 * + Headspace warmth). Unlike `welcome`, this email assumes the user has
 * already confirmed and onboarded, and gives them three concrete first steps
 * plus an honest promise of restraint.
 */
function generateGettingStartedEmailHTML(name: string): string {
  const dashboardUrl = `${APP_URL.replace(/\/$/, '')}/dashboard`
  const settingsUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/settings`

  const bodyHTML = contentSection(`
    ${h1("You're set up")}

    ${paragraph(`Hi ${name},`)}

    ${paragraph(`Your reflection space is ready. ${APP_NAME} is designed to be quiet — one prompt a day, nothing that nags. Here's how to make it yours in a few minutes.`)}

    ${infoBox(`
      <ol class="email-text-gray" style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <li class="email-text-gray" style="margin-bottom: 10px;"><strong>Answer today's prompt.</strong> Two sentences is plenty. You're building a habit, not a résumé.</li>
        <li class="email-text-gray" style="margin-bottom: 10px;"><strong>Pick a time that's yours.</strong> Most people choose early morning or the end of the workday. You can change this anytime in Settings.</li>
        <li class="email-text-gray"><strong>Come back tomorrow.</strong> That's the whole practice. We'll surface gentle patterns over time — never before they're useful.</li>
      </ol>
    `)}

    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: dashboardUrl, label: "Open today's prompt" })}
    </div>

    ${paragraph(`You can adjust your delivery time, focus areas, or reminder cadence in <a href="${settingsUrl}" style="color: ${PRIMARY_ACCENT}; text-decoration: underline;">Settings</a>. Nothing is locked in.`, { align: 'center', fontSize: '14px', color: TEXT_MUTED })}

    ${paragraph("If anything gets in the way — from a confusing button to the wrong reminder time — just reply to this email. A real person reads every message.", { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: "You're set up — here's how to make Prompt & Pause yours",
    title: "You're set up on Prompt & Pause",
    bodyHTML,
  })
}

/**
 * Generate "trial started" email HTML — confirms the 7-day premium trial.
 * Mirrors the lifecycle tone: specific dates, clear about what ends, no urgency.
 */
function generateTrialStartedEmailHTML(name: string, trialEndDate: string): string {
  const dashboardUrl = `${APP_URL.replace(/\/$/, '')}/dashboard`
  const settingsUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/settings`
  const prettyEnd = formatTrialDate(trialEndDate)

  const bodyHTML = contentSection(`
    ${h1('Your trial is on')}

    ${paragraph(`Hi ${name},`)}

    ${paragraph(`You're on Premium until <strong>${prettyEnd}</strong>. Nothing to do — all features are active. Here's what's included:`)}

    ${infoBox(`
      <ul class="email-text-gray" style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <li class="email-text-gray" style="margin-bottom: 10px;"><strong>Daily personalised prompts</strong>, seven days a week.</li>
        <li class="email-text-gray" style="margin-bottom: 10px;"><strong>Unlimited archive</strong> of everything you write.</li>
        <li class="email-text-gray" style="margin-bottom: 10px;"><strong>Weekly &amp; monthly reflections</strong> — gentle pattern summaries.</li>
        <li class="email-text-gray"><strong>Custom focus areas</strong> and export (PDF / TXT).</li>
      </ul>
    `)}

    ${paragraph(`We'll email you once, 48 hours before your trial ends, so there are no surprises. After that you can stay on the free tier or continue on Premium — your choice.`)}

    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: dashboardUrl, label: 'Open your dashboard' })}
    </div>

    ${paragraph(`Manage your plan anytime in <a href="${settingsUrl}" style="color: ${PRIMARY_ACCENT}; text-decoration: underline;">Settings</a>.`, { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: `Premium is active until ${prettyEnd}`,
    title: 'Your trial is on',
    bodyHTML,
  })
}

/**
 * Generate "trial ending soon" email HTML — calm 48h heads-up before downgrade.
 */
function generateTrialEndingSoonEmailHTML(name: string, trialEndDate: string): string {
  const pricingUrl = `${APP_URL.replace(/\/$/, '')}/pricing`
  const settingsUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/settings`
  const prettyEnd = formatTrialDate(trialEndDate)

  const bodyHTML = contentSection(`
    ${h1('Your trial ends in two days')}

    ${paragraph(`Hi ${name},`)}

    ${paragraph(`Just a heads-up: your Premium trial ends on <strong>${prettyEnd}</strong>. No action needed — we'll move you to the free tier automatically when the trial finishes.`)}

    ${infoBox(`
      <p class="email-text-gray" style="margin: 0 0 12px 0; color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong class="email-text-dark" style="color: ${TEXT_DARK}; font-weight: 600;">What stays on Free:</strong> three prompts a week, optional check-ins, your last 50 reflections.
      </p>
      <p class="email-text-gray" style="margin: 0; color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong class="email-text-dark" style="color: ${TEXT_DARK}; font-weight: 600;">What Premium keeps:</strong> daily prompts, unlimited archive, weekly &amp; monthly reflections, export.
      </p>
    `)}

    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: pricingUrl, label: 'Continue on Premium' })}
    </div>

    ${paragraph(`Not ready? That's fine. You can return to Premium anytime from <a href="${settingsUrl}" style="color: ${PRIMARY_ACCENT}; text-decoration: underline;">Settings</a> — your reflections stay either way.`, { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: `Your Premium trial ends ${prettyEnd}`,
    title: 'Your trial ends in two days',
    bodyHTML,
  })
}

/**
 * Extract a human-friendly browser + OS family from a raw User-Agent string.
 * Deliberately conservative: better to say "a browser" than mis-identify.
 */
function describeUserAgent(ua: string | null | undefined): string {
  if (!ua) return 'a browser'
  const lower = ua.toLowerCase()
  let browser = 'a browser'
  if (lower.includes('edg/')) browser = 'Edge'
  else if (lower.includes('chrome/') && !lower.includes('edg/')) browser = 'Chrome'
  else if (lower.includes('firefox/')) browser = 'Firefox'
  else if (lower.includes('safari/') && !lower.includes('chrome/')) browser = 'Safari'
  else if (lower.includes('opera') || lower.includes('opr/')) browser = 'Opera'

  let os = ''
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) os = ' on iOS'
  else if (lower.includes('android')) os = ' on Android'
  else if (lower.includes('mac os') || lower.includes('macintosh')) os = ' on macOS'
  else if (lower.includes('windows')) os = ' on Windows'
  else if (lower.includes('linux')) os = ' on Linux'

  return `${browser}${os}`
}

/**
 * Generate "new device sign-in" security email HTML — Linear / Stripe tone.
 */
function generateNewDeviceSignInEmailHTML(
  name: string,
  details: { country?: string | null; city?: string | null; userAgent?: string | null; signedInAt?: string },
): string {
  const settingsUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/settings`
  const supportUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/support`
  const uaLabel = describeUserAgent(details.userAgent)
  const locationLabel = [details.city, details.country].filter(Boolean).join(', ') || 'a new location'
  const when = details.signedInAt
    ? new Date(details.signedInAt).toLocaleString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'just now'

  const bodyHTML = contentSection(`
    ${h1('New sign-in to your account')}

    ${paragraph(`Hi ${name},`)}

    ${paragraph(`We noticed a sign-in to your ${APP_NAME} account from a device or location we haven't seen before.`)}

    ${infoBox(`
      <p class="email-text-gray" style="margin:0 0 8px 0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <strong class="email-text-dark" style="color:${TEXT_DARK};font-weight:600;">When:</strong> ${when}
      </p>
      <p class="email-text-gray" style="margin:0 0 8px 0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <strong class="email-text-dark" style="color:${TEXT_DARK};font-weight:600;">Where:</strong> ${locationLabel}
      </p>
      <p class="email-text-gray" style="margin:0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <strong class="email-text-dark" style="color:${TEXT_DARK};font-weight:600;">Device:</strong> ${uaLabel}
      </p>
    `)}

    ${paragraph(`If this was you, you can ignore this email — we'll stop sending it for this device.`)}

    ${paragraph(`If it wasn't you, head to Settings to sign out of all sessions and change your password.`, { fontSize: '15px' })}

    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: settingsUrl, label: 'Review account security' })}
    </div>

    ${paragraph(`Need help? Reply to this email or <a href="${supportUrl}" style="color:${PRIMARY_ACCENT};text-decoration:underline;">open a support ticket</a>. A real person reads every message.`, { align: 'center', fontSize: '13px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: `New sign-in from ${uaLabel} in ${locationLabel}`,
    title: 'New sign-in to your account',
    bodyHTML,
  })
}

/** Format a minor-unit Stripe amount into a human-friendly string. */
function formatStripeAmount(amount: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amount !== 'number' || !currency) return 'your payment'
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

/**
 * Generate "payment failed" email HTML — no urgency, no fear, just clarity.
 */
function generatePaymentFailedEmailHTML(
  name: string,
  details: { amount?: number | null; currency?: string | null; nextAttemptAt?: string | null },
): string {
  const billingUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/settings?tab=billing`
  const amountLabel = formatStripeAmount(details.amount, details.currency)
  const nextAttempt = details.nextAttemptAt
    ? new Date(details.nextAttemptAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : null

  const bodyHTML = contentSection(`
    ${h1("We couldn't process your payment")}

    ${paragraph(`Hi ${name},`)}

    ${paragraph(`Your card was declined when we tried to charge ${amountLabel} for ${APP_NAME} Premium. Your account stays on Premium for now — this is just a heads-up so nothing lapses unexpectedly.`)}

    ${infoBox(`
      <p class="email-text-gray" style="margin:0 0 8px 0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <strong class="email-text-dark" style="color:${TEXT_DARK};font-weight:600;">Most common fix:</strong> update your card details — expired cards are the usual cause.
      </p>
      ${
        nextAttempt
          ? `<p class="email-text-gray" style="margin:0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><strong class="email-text-dark" style="color:${TEXT_DARK};font-weight:600;">We'll retry automatically</strong> on ${nextAttempt}.</p>`
          : ''
      }
    `)}

    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: billingUrl, label: 'Update payment method' })}
    </div>

    ${paragraph(`If the retry also fails, your account will move to the free tier — your reflections and archive stay either way.`, { align: 'center', fontSize: '14px', color: TEXT_MUTED })}

    ${paragraph(`Questions? Just reply to this email. A real person reads every message.`, { align: 'center', fontSize: '13px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: `We couldn't charge ${amountLabel} — update your card`,
    title: "We couldn't process your payment",
    bodyHTML,
  })
}

/**
 * Generate monthly reflection email HTML (Premium-only).
 *
 * Same visual vocabulary as welcome / getting_started / weekly_digest —
 * `buildBaseEmail({ bodyHTML: contentSection(...) })`. Copy tone is Headspace
 * / Calm: pattern observation, no gamification, no numeric comparisons
 * month-over-month. Zero-reflection months should never reach this generator
 * (the cron skips them up-front), so we don't render an empty-state branch.
 */
function generateMonthlyReflectionEmailHTML(name: string, reflection: MonthlyReflection): string {
  const summaryUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/archive?view=monthly`

  // Observations render as a calm bulleted list — we own the spacing/colour
  // directly so the email client can't reflow it into something loud.
  const observationsHTML = (reflection.observations ?? [])
    .filter((line) => line && line.trim().length > 0)
    .map(
      (line) => `
      <li class="email-text-gray" style="margin:0 0 10px 0;padding:0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        ${line.replace(/^[-•]\s*/, '')}
      </li>`,
    )
    .join('')

  const bodyHTML = contentSection(`
    ${h1(`Your ${reflection.monthLabel} reflection`)}

    ${paragraph(reflection.monthLabel, { align: 'center', fontSize: '13px', color: TEXT_MUTED })}

    ${paragraph(`Hi ${name},`)}

    ${reflection.overviewText ? paragraph(reflection.overviewText) : ''}

    ${
      observationsHTML
        ? `
    <div style="margin:32px 0;">
      ${h3('A few things we noticed')}
      <ul style="margin:0;padding:0 0 0 20px;">
        ${observationsHTML}
      </ul>
    </div>`
        : ''
    }

    ${
      reflection.themeReflection
        ? infoBox(`
      <p class="email-text-gray" style="margin:0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-style:italic;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        ${reflection.themeReflection}
      </p>
    `)
        : ''
    }

    ${
      reflection.closingQuestion
        ? paragraph(
            `<strong class="email-text-dark" style="color:${TEXT_DARK};font-weight:600;">Something to sit with:</strong> ${reflection.closingQuestion}`,
            { fontSize: '15px' },
          )
        : ''
    }

    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: summaryUrl, label: 'Open your monthly summary' })}
    </div>

    ${paragraph(`A reflection practice doesn't have a "right" shape — showing up some of the time is the whole thing.`, { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: `${reflection.monthLabel} — a quiet look back`,
    title: `Your ${reflection.monthLabel} reflection`,
    bodyHTML,
  })
}

/**
 * Generate daily prompt email HTML using professional template system
 */
function generateDailyPromptEmailHTML(name: string, prompt: string): string {
  const today = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const promptContent = `
    <!-- Date Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <span class="email-text-primary email-section-bg" style="display: inline-block; font-size: 11px; color: ${PRIMARY_ACCENT}; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; background: ${BG_LIGHT}; padding: 8px 18px; border-radius: 999px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${today}
          </span>
        </td>
      </tr>
    </table>
    
    ${h1('Your Daily Reflection Prompt')}
    
    ${paragraph(`Good day, ${name}`, { align: 'center' })}
    
    ${paragraph('Take a moment to pause and reflect on today\'s question:', { align: 'center', fontSize: '15px' })}
    
    <!-- Prompt Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 32px 0;">
      <tr>
        <td class="email-prompt-card" style="background-color: ${BG_LIGHT}; padding: 28px 24px; border-radius: 16px; border: 1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tr>
              <td align="center" style="padding-bottom: 12px;">
                <p class="email-prompt-label" style="font-size: 11px; color: ${PRIMARY_ACCENT}; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Today's Prompt</p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p class="email-prompt-text" style="font-size: 20px; color: ${TEXT_DARK}; line-height: 1.5; margin: 0; font-weight: 500; font-style: italic; font-family: Georgia, 'Times New Roman', serif;">
                  "${prompt}"
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${paragraph('Set aside a few minutes today to explore this question. There are no right or wrong answers - just your authentic thoughts and feelings.', { align: 'center', fontSize: '14px' })}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Start Reflecting' })}
    </div>
    
    ${infoBox(`
      <p class="email-text-gray" style="margin: 0; color: ${TEXT_GRAY}; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong class="email-text-dark" style="color: ${TEXT_DARK}; font-weight: 600;">Tip:</strong> Try writing for at least 3-5 minutes without overthinking. Let your thoughts flow naturally.
      </p>
    `)}
  `

  // Wrap through buildBaseEmail so daily prompts ship with the same document
  // wrapper (dark-mode CSS, header, footer, preheader) that welcome /
  // getting-started / weekly-digest use. Visual + tonal parity across the
  // entire lifecycle.
  return buildBaseEmail({
    preheader: "Today's reflection prompt is ready",
    title: "Today's Reflection Prompt",
    bodyHTML: contentSection(promptContent),
  })
}

/**
 * Generate weekly digest email HTML.
 *
 * Rebuilt to match the welcome / getting-started layout exactly:
 *   - bodyHTML wrapped in `contentSection(...)` so the outer card, padding and
 *     background match every other lifecycle email.
 *   - Date range rendered through `paragraph(...)` (same muted-centered pattern
 *     every other email uses) instead of a hand-rolled <p>.
 *   - Themes heading rendered through `h3(...)` for the same type scale as the
 *     rest of the system.
 *   - CTA/copy tone aligned with the getting-started email so the whole
 *     lifecycle reads as a single voice.
 */
function generateWeeklyDigestEmailHTML(name: string, digest: WeeklyDigest): string {
  const archiveUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/archive`
  const dateRange = `${new Date(digest.weekStart).toLocaleDateString('en-GB')} – ${new Date(digest.weekEnd).toLocaleDateString('en-GB')}`

  const topTagsHTML = digest.topTags
    .map(
      ({ tag, count }) =>
        `<span class="email-text-primary email-section-bg" style="display: inline-block; background: ${BG_LIGHT}; color: ${PRIMARY_ACCENT}; padding: 6px 14px; border-radius: 999px; margin: 4px; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${tag} (${count})</span>`,
    )
    .join('')

  const bodyHTML = contentSection(`
    ${h1('Your weekly recap')}

    ${paragraph(dateRange, { align: 'center', fontSize: '13px', color: TEXT_MUTED })}

    ${paragraph(`Hi ${name},`)}

    ${paragraph('A small recap from your reflections this week — nothing to act on, just something to notice.')}

    ${infoBox(`
      <p class="email-text-gray" style="margin: 0; color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong class="email-text-dark" style="color: ${TEXT_DARK}; font-weight: 600;">Reflections this week:</strong> ${digest.totalReflections}
      </p>
    `)}

    ${
      digest.topTags.length > 0
        ? `
    <div style="margin: 32px 0;">
      ${h3('Themes you touched on')}
      <div style="text-align: center;">${topTagsHTML}</div>
    </div>`
        : ''
    }

    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: archiveUrl, label: 'Open your archive' })}
    </div>

    ${paragraph('Revisit anything you wrote this week, or just let it sit. Either is fine.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: `Your weekly recap — ${digest.totalReflections} reflections`,
    title: 'Your weekly recap',
    bodyHTML,
  })
}

/**
 * Generate subscription confirmation email HTML
 * Supports both purchased and gifted premium subscriptions
 * Includes proper dark mode CSS classes for email client compatibility
 */
function generateSubscriptionConfirmationHTML(name: string, planName: string): string {
  const bodyHTML = `
    ${h1('Welcome to Premium')}
    
    ${paragraph(`Hi ${name},`, { align: 'center' })}
    
    ${paragraph(`Your ${planName} subscription is now active. Thank you for joining us on this journey of mindful reflection.`, { align: 'center' })}
    
    <!-- Premium Features Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 28px 0;">
      <tr>
        <td class="email-premium-card" style="background-color: ${BG_LIGHT}; padding: 24px; border-radius: 12px; border: 1px solid ${BORDER_COLOR};">
          <h3 class="email-premium-title" style="color: ${PRIMARY_ACCENT}; font-size: 15px; margin: 0 0 12px 0; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">What's Included</h3>
          <ul class="email-premium-list" style="color: ${TEXT_DARK}; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <li class="email-premium-item" style="margin-bottom: 8px;"><strong>Daily prompts</strong> — 7 days a week</li>
            <li class="email-premium-item" style="margin-bottom: 8px;"><strong>Weekly & monthly reflections</strong> — AI-powered insights</li>
            <li class="email-premium-item" style="margin-bottom: 8px;"><strong>From Your Past</strong> — Meaningful resurfacing</li>
            <li class="email-premium-item" style="margin-bottom: 8px;"><strong>Unlimited archive</strong> — All your reflections, always</li>
            <li class="email-premium-item" style="margin-bottom: 8px;"><strong>Export reflections</strong> — PDF & TXT formats</li>
            <li class="email-premium-item"><strong>Email + Slack delivery</strong> — Your choice</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Start Reflecting' })}
    </div>
    
    ${paragraph(`Manage your subscription anytime in <a href="https://promptandpause.com/dashboard/settings" target="_blank" rel="noopener noreferrer" class="email-text-primary" style="color: ${PRIMARY_ACCENT}; text-decoration: none; font-weight: 600;">Settings</a>.`, { align: 'center', fontSize: '14px' })}
  `

  return buildBaseEmail({
    preheader: `Welcome to ${planName}! Your premium features are now active`,
    title: 'Welcome to Premium',
    bodyHTML
  })
}

/**
 * Generate trial expired email HTML
 */
function generateTrialExpiredEmailHTML(name: string): string {
  const bodyHTML = `
    ${h1('Your trial has ended')}
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph('Your trial has come to an end.')}
    
    ${infoBox(`
      ${h3('What happens now?', { align: 'left', color: TEXT_DARK })}
      ${paragraph(
        'You\'ve been moved to our <strong>Free tier</strong>, which still gives you access to core features:',
        { align: 'left', color: TEXT_GRAY }
      )}
      <ul class="email-text-gray" style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <li class="email-text-gray" style="margin-bottom: 8px;">3 personalized prompts per week</li>
        <li class="email-text-gray" style="margin-bottom: 8px;">Optional check-in</li>
        <li class="email-text-gray" style="margin-bottom: 8px;">Access to last 50 reflections</li>
        <li class="email-text-gray">Email delivery at your chosen time</li>
      </ul>
    `)}
    
    ${paragraph('If you want to continue with Premium features, you can upgrade at any time.', { align: 'center' })}
    
    <div style="text-align: center; margin: 40px 0;">
      ${ctaButton('View pricing', `${APP_URL}/pricing`)}
    </div>
    
    <!-- Premium Features Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 28px 0;">
      <tr>
        <td class="email-premium-card" style="background-color: ${BG_LIGHT}; padding: 24px; border-radius: 12px; border: 1px solid ${BORDER_COLOR};">
          <h3 class="email-premium-title" style="color: ${PRIMARY_ACCENT}; font-size: 15px; margin: 0 0 12px 0; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Premium includes</h3>
          <ul style="color: ${TEXT_DARK}; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <li style="margin-bottom: 8px;"><strong>Daily personalized prompts</strong> (7 days/week)</li>
            <li style="margin-bottom: 8px;"><strong>Unlimited reflection archive</strong></li>
            <li style="margin-bottom: 8px;"><strong>Weekly reflection</strong></li>
            <li style="margin-bottom: 8px;"><strong>Monthly reflection</strong></li>
            <li style="margin-bottom: 8px;"><strong>Export reflections</strong> (PDF/TXT)</li>
            <li style="margin-bottom: 8px;"><strong>Custom focus areas</strong> (unlimited)</li>
            <li style="margin-bottom: 8px;"><strong>Priority email support</strong> (24hr response)</li>
          </ul>
        </td>
      </tr>
    </table>
    
    ${paragraph('You can continue using Prompt & Pause with the free tier, or upgrade anytime from your dashboard settings.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
    
    ${paragraph('You can keep using Prompt & Pause on the free tier, or return to Premium later.', { align: 'center' })}
  `

  // Wrap through buildBaseEmail for the same document shell every other
  // lifecycle email ships with (dark-mode CSS, header, footer, preheader).
  return buildBaseEmail({
    preheader: 'Your Prompt & Pause trial has ended',
    title: 'Your trial has ended',
    bodyHTML: contentSection(bodyHTML),
  })
}

/**
 * Generate subscription cancellation email HTML
 */
function generateSubscriptionCancellationHTML(name: string, planName: string): string {
  const bodyHTML = `
    ${h1('Subscription Cancelled', { color: TEXT_DARK })}
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph(`We've received your request to cancel your ${planName} subscription. We're sorry to see you go.`)}
    
    ${infoBox(`
      <p class="email-text-gray" style="margin: 0; color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong class="email-text-dark" style="color: ${TEXT_DARK}; font-weight: 600;">Your premium access will continue until the end of your current billing period.</strong> After that, you'll be switched to our free tier, but all your reflections and data will remain safe.
      </p>
    `)}
    
    ${paragraph('If you change your mind, you can resubscribe anytime from your settings page. We\'d love to have you back.')}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard/settings', label: 'View Account Settings' })}
    </div>
    
    ${paragraph('We\'d love to hear your feedback. Reply to this email to let us know how we can improve.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `

  return buildBaseEmail({
    preheader: `Your ${planName} subscription has been cancelled`,
    title: 'Subscription Cancelled',
    bodyHTML
  })
}
/**
 * Generate data export email HTML
 */
function generateDataExportEmailHTML(name: string): string {
  const bodyHTML = contentSection(`
    ${h1('Your Data Export is Ready')}
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph(`We've compiled all your data from ${APP_NAME} into a comprehensive PDF document. You'll find it attached to this email.`)}
    
    ${infoBox(`
      ${h3('Your export includes:', { align: 'left' })}
      <ul style="margin: 16px 0; padding-left: 20px; color: ${TEXT_GRAY};">
        <li style="margin-bottom: 8px;">All your reflections and journal entries</li>
        <li style="margin-bottom: 8px;">Account preferences and settings</li>
      </ul>
    `)}
    
    ${alertBox('<strong>Important:</strong> This file contains sensitive personal information. Please store it securely and don\'t share it with anyone.', 'warning')}
    
    ${paragraph('If you have any questions about your data or need assistance, please don\'t hesitate to reply to this email.')}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Go to Dashboard' })}
    </div>
  `)

  return buildBaseEmail({
    preheader: 'Your data export PDF is attached to this email',
    title: 'Your Data Export',
    bodyHTML
  })
}

/**
 * Generate account deletion confirmation email HTML
 */
function generateAccountDeletionEmailHTML(name: string): string {
  const bodyHTML = contentSection(`
    ${h1('Account Deleted')}
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph(`This email confirms that your ${APP_NAME} account and all associated data have been permanently deleted.`)}
    
    ${infoBox(`
      ${h3('What was removed:', { align: 'left' })}
      <ul style="margin: 16px 0; padding-left: 20px; color: ${TEXT_GRAY};">
        <li style="margin-bottom: 8px;">Your profile and account credentials</li>
        <li style="margin-bottom: 8px;">All reflections and journal entries</li>
        <li style="margin-bottom: 8px;">Prompt history and preferences</li>
        <li style="margin-bottom: 8px;">Any connected integrations</li>
      </ul>
    `)}
    
    ${paragraph('This action is irreversible. If you ever wish to use Prompt & Pause again, you\'re welcome to create a new account at any time.')}
    
    ${paragraph('We appreciate the time you spent reflecting with us. We hope it brought you some moments of calm and clarity.')}
    
    ${paragraph(`Wishing you well on your journey,<br/>The ${APP_NAME} Team`)}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com', label: 'Visit Prompt & Pause' })}
    </div>
  `)

  return buildBaseEmail({
    preheader: 'Your account and all data have been permanently deleted',
    title: 'Account Deleted',
    bodyHTML
  })
}

/**
 * Send support ticket confirmation email to user
 * 
 * @param email - User's email address
 * @param userName - User's name
 * @param subject - Support request subject
 * @param requestId - Support request ID
 * @returns Promise with email send result
 */
// =============================================================================
// MAINTENANCE EMAIL FUNCTIONS
// =============================================================================

/**
 * Send maintenance start notification email
 * 
 * @param email - Recipient email address
 * @param userName - User's name for personalization
 * @param details - Maintenance window details
 * @returns Promise with email send result
 */
export async function sendMaintenanceStartEmail(
  email: string,
  userName: string | null,
  details: {
    scheduledDate: string
    startTime: string
    endTime: string
    affectedServices: string[]
    description?: string
  }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('maintenance_start', () => 
      generateMaintenanceStartEmailHTML(displayName, details)
    )

    const subject = await getSubjectForTemplate('maintenance_start', { maintenanceDate: details.scheduledDate, userName: displayName })

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_maintenance_start_send_error', { error, email })
      await logEmailSend({
        userId: 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'maintenance_start',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
        metadata: { scheduledDate: details.scheduledDate },
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'maintenance_start',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
      metadata: { scheduledDate: details.scheduledDate },
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_maintenance_start_unexpected_error', { error, email })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send maintenance complete notification email
 * 
 * @param email - Recipient email address
 * @param userName - User's name for personalization
 * @param details - Maintenance completion details
 * @returns Promise with email send result
 */
export async function sendMaintenanceCompleteEmail(
  email: string,
  userName: string | null,
  details: {
    completedAt: string
    improvements?: string
    notes?: string
  }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('maintenance_complete', () => 
      generateMaintenanceCompleteEmailHTML(displayName, details)
    )

    const subject = await getSubjectForTemplate('maintenance_complete', { userName: displayName })

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_maintenance_complete_send_error', { error, email })
      await logEmailSend({
        userId: 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'maintenance_complete',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
        metadata: { completedAt: details.completedAt },
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'maintenance_complete',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
      metadata: { completedAt: details.completedAt },
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_maintenance_complete_unexpected_error', { error, email })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate maintenance start email HTML
 */
function generateMaintenanceStartEmailHTML(
  name: string,
  details: {
    scheduledDate: string
    startTime: string
    endTime: string
    affectedServices: string[]
    description?: string
  }
): string {
  const { scheduledDate, startTime, endTime, affectedServices, description } = details
  
  const servicesHTML = affectedServices
    .map(service => `<li style="margin-bottom: 8px;">${service}</li>`)
    .join('')

  const bodyHTML = `
    ${h1('Scheduled Maintenance Notice')}
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph(`We're writing to let you know about planned maintenance on ${APP_NAME}.`)}
    
      ${alertBox(`
        <strong>Maintenance Window</strong><br/>
        Date: ${scheduledDate}<br/>
        Time: ${startTime} - ${endTime} UTC
      `, 'warning')}
      
      ${affectedServices.length > 0 ? `
      <div class="email-premium-card" style="background-color: ${BG_LIGHT}; padding: 20px 24px; border-radius: 12px; border: 1px solid ${BORDER_COLOR}; margin: 20px 0;">
        <h3 class="email-premium-title" style="color: ${PRIMARY_ACCENT}; font-size: 15px; margin: 0 0 12px 0; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Affected Services</h3>
        <ul style="color: ${TEXT_DARK}; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 14px;">
          ${servicesHTML}
        </ul>
      </div>
      ` : ''}
      
      ${description ? paragraph(description) : ''}
      
      ${infoBox('<strong>Your data:</strong> Your reflections and personal information remain secure during maintenance.')}
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0;">
      We apologize for any inconvenience this may cause and appreciate your patience as we work to improve ${APP_NAME}.
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; margin: 32px 0 0 0; text-align: center;">
      Questions? Contact us at <a href="mailto:support@promptandpause.com" class="email-text-primary" style="color: ${PRIMARY_ACCENT}; text-decoration: none; font-weight: 600;">support@promptandpause.com</a>
    </p>
  `

  return buildBaseEmail({
    preheader: `Scheduled maintenance on ${scheduledDate} from ${startTime} to ${endTime} UTC`,
    title: 'Scheduled Maintenance Notice',
    bodyHTML
  })
}

/**
 * Generate maintenance complete email HTML
 */
function generateMaintenanceCompleteEmailHTML(
  name: string,
  details: {
    completedAt: string
    improvements?: string
    notes?: string
  }
): string {
  const { completedAt, improvements, notes } = details

  const bodyHTML = `
    ${h1('Maintenance complete')}
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph(`Maintenance has been completed. ${APP_NAME} is available again.`)}
    
    ${alertBox(`
      <strong>All Systems Operational</strong><br/>
      Completed at ${completedAt}
    `, 'success')}
    
    ${improvements ? `
    <div class="email-premium-card" style="background-color: ${BG_LIGHT}; padding: 20px 24px; border-radius: 12px; border: 1px solid ${BORDER_COLOR}; margin: 20px 0;">
      <h3 class="email-premium-title" style="color: ${PRIMARY_ACCENT}; font-size: 15px; margin: 0 0 12px 0; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">What's Improved</h3>
      <p style="color: ${TEXT_DARK}; font-size: 15px; line-height: 1.6; margin: 0;">${improvements}</p>
    </div>
    ` : ''}
    
    ${notes ? paragraph(notes) : ''}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Open dashboard' })}
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0 0 0; text-align: center;">
      Thank you for your patience.
    </p>
  `

  return buildBaseEmail({
    preheader: `Maintenance complete - All ${APP_NAME} services are now operational`,
    title: 'Maintenance Complete',
    bodyHTML
  })
}

/**
 * Get template variables for a given template key
 * Used by admin UI to show dynamic sample data inputs
 */
export async function getTemplateVariables(templateKey: string): Promise<string[]> {
  try {
    const result = await getTemplateByKey(templateKey)
    if (result.success && result.data) {
      return result.data.variables
    }
    return []
  } catch (error) {
    logger.error('email_template_variables_fetch_error', { error, templateKey })
    return []
  }
}

/**
 * Send admin user credentials email
 * Sends generated password to newly created admin user
 * 
 * @param email - Admin user email
 * @param fullName - Admin user's full name
 * @param password - Generated password
 * @param role - Admin role (super_admin, admin, employee)
 * @returns Promise with email send result
 */
export async function sendAdminCredentialsEmail(
  email: string,
  name: string,
  password: string,
  role: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const roleDisplay = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Employee'
    const loginUrl = `${APP_URL}/admin-login`

    const html = emailWrapper(`
      ${h1('Admin account created')}
      
      ${paragraph(`Hi ${name},`)}
      
      ${paragraph(`Your admin account has been created for ${APP_NAME}. You now have ${roleDisplay} access to the admin panel.`)}
      
      ${infoBox(`
        <div style="margin-bottom: 12px;">
          <strong style="color: ${TEXT_DARK}; display: block; margin-bottom: 4px; font-size: 15px;">Your Login Credentials</strong>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: ${TEXT_GRAY}; font-size: 14px;">Email:</span><br>
          <strong style="color: ${TEXT_DARK}; font-size: 15px;">${email}</strong>
        </div>
        <div>
          <span style="color: ${TEXT_GRAY}; font-size: 14px;">Temporary Password:</span><br>
          <strong style="color: ${TEXT_DARK}; font-size: 15px; font-family: 'Courier New', monospace; background: ${BG_WHITE}; padding: 4px 10px; border: 1px solid ${BORDER_COLOR}; border-radius: 6px; display: inline-block; margin-top: 4px;">${password}</strong>
        </div>
      `)}
      
      ${paragraph('⚠️ <strong>Important Security Steps:</strong>')}
      ${paragraph(`
        <ol style="margin: 0; padding-left: 20px; color: ${TEXT_GRAY};">
          <li style="margin-bottom: 8px;">Sign in using the credentials above</li>
          <li style="margin-bottom: 8px;">Change your password immediately in your profile settings</li>
          <li style="margin-bottom: 8px;">Do not share your credentials with anyone</li>
          <li>Enable two-factor authentication if available</li>
        </ol>
      `)}
      
      ${paragraph(`Your role as <strong>${roleDisplay}</strong> gives you access to:`)}
      ${paragraph(`
        <ul style="margin: 0; padding-left: 20px; color: ${TEXT_GRAY};">
          ${role === 'super_admin' ? `
            <li style="margin-bottom: 8px;">Full system administration</li>
            <li style="margin-bottom: 8px;">API and backend management</li>
            <li style="margin-bottom: 8px;">Create and manage all admin users</li>
            <li>Access to all admin panel features</li>
          ` : role === 'admin' ? `
            <li style="margin-bottom: 8px;">Create and manage admin users</li>
            <li style="margin-bottom: 8px;">Access to admin panel features</li>
            <li>User support and management</li>
          ` : `
            <li style="margin-bottom: 8px;">Access to assigned admin panel features</li>
            <li>User support tools</li>
          `}
        </ul>
      `)}
      
      ${ctaButton('Sign In to Admin Panel', loginUrl)}
      
      ${paragraph(`If you have any questions or need assistance, please contact your administrator.`)}
      
    `)

    const subject = `Your ${APP_NAME} admin account` 

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Admin <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_admin_credentials_send_error', { error, email })
      await logEmailSend({
        userId: 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'admin_credentials',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
        metadata: { role },
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'admin_credentials',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
      metadata: { role },
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_admin_credentials_unexpected_error', { error, email })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send trial expiration email
 * 
 * @param email - User's email address
 * @param userName - User's name
 * @returns Promise with email send result
 */
export async function sendTrialExpirationEmail(
  email: string,
  userName: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const upgradeUrl = `${APP_URL}/pricing`

    const subject = await getSubjectForTemplate('trial_expired', { userName: displayName })

    const html = emailWrapper(`
      ${h1('Your trial has ended')}
      
      ${paragraph('Hi ' + displayName + ',')}
      
      ${paragraph('Your trial has come to an end.')}
      
      ${infoBox('<strong>What happens now?</strong><br/>• Your account has moved to the Free tier<br/>• You can keep using the core features<br/>• You can upgrade at any time if you want the Premium features')}
      
      ${ctaButton('View pricing', upgradeUrl)}
      
      ${paragraph('If you choose to return to Premium later, you can do that from your account settings.')}
      
      ${paragraph('If you have any questions, just reply to this email.')}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_trial_expiration_send_error', { error, email })
      await logEmailSend({
        userId: 'unknown',
        recipientEmail: email,
        subject,
        templateName: 'trial_expired',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: 'unknown',
      recipientEmail: email,
      subject,
      templateName: 'trial_expired',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_trial_expiration_unexpected_error', { error, email })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send discount invitation email (student/NHS)
 */
export async function sendDiscountInvitationEmail(
  email: string,
  name: string,
  discountType: 'student' | 'nhs',
  billingCycle: 'monthly' | 'yearly',
  checkoutUrl: string,
  expiresAt: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const discountLabel = discountType === 'student' ? 'Student' : 'NHS'
    const pricing = billingCycle === 'monthly' ? '£7.20/month' : '£59/year'
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })

    const html = emailWrapper(`
      ${h1(`Your ${discountLabel} discount is ready`)}
      
      ${paragraph(`Hi ${name},`)}
      
      ${paragraph(`Good news! You've been approved for ${discountLabel} discount pricing on Prompt & Pause Premium.`)}
      
      ${infoBox(`
        <strong>Your discount:</strong><br/>
        • 40% off Premium<br/>
        • ${pricing} (${billingCycle})<br/>
        • Full Premium features<br/>
        • Valid until ${expiryDate}
      `)}
      
      ${paragraph('To activate your discount, click the button below and complete payment. This link is unique to you and expires in 7 days.')}
      
      <div style="text-align: center; margin: 40px 0;">
        ${ctaButton('Activate my discount', checkoutUrl)}
      </div>
      
      ${paragraph('Once activated, you\'ll have full access to Premium features including weekly insights, monthly summaries, and unlimited reflections.')}
      
      ${paragraph('If you have any questions, just reply to this email.')}
      
      ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject: `Your ${discountLabel} discount is ready`,
      html,
    })

    if (error) {
      logger.error('email_discount_invitation_send_error', { error, email, discountType })
      await logEmailDelivery('unknown', 'discount_invitation', email, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    await logEmailDelivery('unknown', 'discount_invitation', email, 'sent', data?.id || null)

    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_discount_invitation_unexpected_error', { error, email })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery('unknown', 'discount_invitation', email, 'failed', null, errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send gift activation confirmation email
 */
export async function sendGiftActivatedEmail(
  email: string,
  name: string,
  durationMonths: number,
  endDate: Date
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const endDateStr = endDate.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })

    const html = emailWrapper(`
      ${h1('Gift subscription activated!')}
      
      ${paragraph(`Hi ${name},`)}
      
      ${paragraph(`Great news! Your gift subscription has been activated successfully.`)}
      
      ${infoBox(`
        <strong>Your gift subscription:</strong><br/>
        • ${durationMonths} month${durationMonths > 1 ? 's' : ''} of Premium<br/>
        • Active until ${endDateStr}<br/>
        • Full access to all Premium features<br/>
        • No billing until gift expires
      `)}
      
      ${paragraph('You now have access to:')}
      
      ${paragraph(`
        <ul style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Unlimited daily reflections</li>
          <li>Weekly insights and digests</li>
          <li>Monthly reflection summaries</li>
          <li>Advanced analytics and patterns</li>
          <li>"From your past" resurfacing</li>
        </ul>
      `)}
      
      <div style="text-align: center; margin: 40px 0;">
        ${ctaButton('Start reflecting', `${APP_URL}/dashboard`)}
      </div>
      
      ${paragraph(`Your subscription will automatically downgrade to the Free tier on ${endDateStr}. If you'd like to continue with Premium features after that, you can subscribe from your account settings.`)}
      
      ${paragraph('Enjoy your gift subscription!')}
      
      ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject: 'Gift subscription activated',
      html,
    })

    if (error) {
      logger.error('email_gift_activated_send_error', { error, email })
      await logEmailDelivery('unknown', 'gift_activated', email, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    await logEmailDelivery('unknown', 'gift_activated', email, 'sent', data?.id || null)

    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_gift_activated_unexpected_error', { error, email })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery('unknown', 'gift_activated', email, 'failed', null, errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send gift email to recipient (purchase flow)
 */
export async function sendGiftRecipientEmail(params: {
  recipientEmail: string
  recipientName?: string | null
  durationMonths: number
  redemptionToken: string
  expiresAt: string
  giftMessage?: string | null
  purchaserName?: string | null
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const {
    recipientEmail,
    recipientName,
    durationMonths,
    redemptionToken,
    expiresAt,
    giftMessage,
    purchaserName,
  } = params

  try {
    const displayName = recipientName || recipientEmail.split('@')[0]
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const redeemUrl = `${APP_URL.replace(/\/$/, '')}/gifts/redeem`
    const fromLine = purchaserName ? `from ${purchaserName}` : 'from someone who cares about you'

    const html = emailWrapper(`
      ${h1('You’ve received a gift subscription')}

      ${paragraph(`Hi ${displayName},`)}

      ${paragraph(`You’ve received a ${durationMonths}-month Premium gift subscription ${fromLine}.`)}

      ${giftMessage ? paragraph(`Message: “${giftMessage}”`) : ''}

      ${infoBox(`
        <strong>Gift details</strong><br/>
        • Duration: ${durationMonths} month${durationMonths > 1 ? 's' : ''}<br/>
        • Gift code: <strong>${redemptionToken}</strong><br/>
        • Expires: ${expiryDate}
      `)}

      ${paragraph('To redeem: sign in (or create an account), then enter your gift code on the redemption page.')}

      <div style="text-align: center; margin: 40px 0;">
        ${ctaButton('Redeem gift', redeemUrl)}
      </div>

      ${paragraph('If you have any trouble redeeming, reply to this email and we’ll help.')}

      ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: recipientEmail,
      subject: 'You’ve received a gift subscription',
      html,
    })

    if (error) {
      logger.error('email_gift_recipient_send_error', { error, recipientEmail })
      await logEmailDelivery('unknown', 'gift_recipient', recipientEmail, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    await logEmailDelivery('unknown', 'gift_recipient', recipientEmail, 'sent', data?.id || null)
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_gift_recipient_unexpected_error', { error, recipientEmail })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery('unknown', 'gift_recipient', recipientEmail, 'failed', null, errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send purchase confirmation email to buyer
 */
export async function sendGiftBuyerConfirmationEmail(params: {
  buyerEmail: string
  buyerName?: string | null
  durationMonths: number
  redemptionToken: string
  expiresAt: string
  recipientEmail?: string | null
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const { buyerEmail, buyerName, durationMonths, redemptionToken, expiresAt, recipientEmail } = params

  try {
    const displayName = buyerName || buyerEmail.split('@')[0]
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const html = emailWrapper(`
      ${h1('Gift subscription purchased')}

      ${paragraph(`Hi ${displayName},`)}

      ${paragraph(`Thanks — your ${durationMonths}-month gift subscription purchase is confirmed.`)}

      ${infoBox(`
        <strong>Gift details</strong><br/>
        • Duration: ${durationMonths} month${durationMonths > 1 ? 's' : ''}<br/>
        • Gift code: <strong>${redemptionToken}</strong><br/>
        • Expires: ${expiryDate}
        ${recipientEmail ? `<br/>• Recipient: ${recipientEmail}` : ''}
      `)}

      ${paragraph('If your recipient can’t find the gift email, you can forward them the gift code above. They’ll need an account to redeem.')}

      ${paragraph('If you have any questions, reply to this email.')}

      ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: buyerEmail,
      subject: 'Gift subscription purchased',
      html,
    })

    if (error) {
      logger.error('email_gift_buyer_confirm_send_error', { error, buyerEmail })
      await logEmailDelivery('unknown', 'gift_buyer_confirm', buyerEmail, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    await logEmailDelivery('unknown', 'gift_buyer_confirm', buyerEmail, 'sent', data?.id || null)
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_gift_buyer_confirm_unexpected_error', { error, buyerEmail })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery('unknown', 'gift_buyer_confirm', buyerEmail, 'failed', null, errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Optional: notify buyer when gift is redeemed
 */
export async function sendGiftRedeemedBuyerEmail(params: {
  buyerEmail: string
  buyerName?: string | null
  durationMonths: number
  redeemedAt: string
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const { buyerEmail, buyerName, durationMonths, redeemedAt } = params

  try {
    const displayName = buyerName || buyerEmail.split('@')[0]
    const redeemedDate = new Date(redeemedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const html = emailWrapper(`
      ${h1('Your gift was redeemed')}

      ${paragraph(`Hi ${displayName},`)}

      ${paragraph(`Just a quick note — your ${durationMonths}-month gift subscription was redeemed on ${redeemedDate}.`)}

      ${paragraph('Thanks for giving a little space for reflection.')}

      ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: buyerEmail,
      subject: 'Your gift was redeemed',
      html,
    })

    if (error) {
      logger.error('email_gift_redeemed_buyer_send_error', { error, buyerEmail })
      await logEmailDelivery('unknown', 'gift_redeemed_buyer', buyerEmail, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    await logEmailDelivery('unknown', 'gift_redeemed_buyer', buyerEmail, 'sent', data?.id || null)
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_gift_redeemed_buyer_unexpected_error', { error, buyerEmail })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery('unknown', 'gift_redeemed_buyer', buyerEmail, 'failed', null, errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Optional: expiring soon reminder (7 days)
 */
export async function sendGiftExpiringSoonEmail(params: {
  email: string
  name?: string | null
  endDate: string
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const { email, name, endDate } = params

  try {
    const displayName = name || email.split('@')[0]
    const endDateStr = new Date(endDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const settingsUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/settings`

    const html = emailWrapper(`
      ${h1('Your gift subscription ends soon')}

      ${paragraph(`Hi ${displayName},`)}

      ${paragraph(`A quick reminder: your gift subscription is set to end on ${endDateStr}.`)}

      ${paragraph('Nothing is required from you. When it ends, your account will move back to the Free tier.')}

      <div style="text-align: center; margin: 40px 0;">
        ${ctaButton('View your settings', settingsUrl)}
      </div>

      ${paragraph('If you’d like to continue with Premium features after that, you can choose a plan in Settings.')}

      ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Billing <${BILLING_EMAIL}>`,
      to: email,
      subject: 'Your gift subscription ends soon',
      html,
    })

    if (error) {
      logger.error('email_gift_expiring_soon_send_error', { error, email })
      await logEmailDelivery('unknown', 'gift_expiring_soon', email, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    await logEmailDelivery('unknown', 'gift_expiring_soon', email, 'sent', data?.id || null)
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_gift_expiring_soon_unexpected_error', { error, email })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery('unknown', 'gift_expiring_soon', email, 'failed', null, errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send a ticket confirmation email to the user who submitted a support ticket
 */
export async function sendTicketConfirmation(params: {
  email: string
  name: string
  ticketNo: string
  ticketTitle: string
  priority: string
}): Promise<{ success: boolean; error?: string }> {
  const { email, name, ticketNo, ticketTitle, priority } = params

  const html = emailWrapper(
    [
      h1(`Ticket #${ticketNo} — Received`),
      paragraph(`Hi ${name},`),
      paragraph(`We've received your support ticket and will get back to you within 24–48 hours.`),
      contentSection(
        [
          h3('Ticket Details'),
          `<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:${TEXT_GRAY};font-size:14px;border-bottom:1px solid ${BORDER_COLOR};">Ticket No</td><td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid ${BORDER_COLOR};">#${ticketNo}</td></tr>
<tr><td style="padding:8px 0;color:${TEXT_GRAY};font-size:14px;border-bottom:1px solid ${BORDER_COLOR};">Subject</td><td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid ${BORDER_COLOR};">${ticketTitle}</td></tr>
<tr><td style="padding:8px 0;color:${TEXT_GRAY};font-size:14px;border-bottom:1px solid ${BORDER_COLOR};">Priority</td><td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid ${BORDER_COLOR};">${priority.charAt(0).toUpperCase() + priority.slice(1)}</td></tr>
<tr><td style="padding:8px 0;color:${TEXT_GRAY};font-size:14px;">Status</td><td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;"><span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${PRIMARY_ACCENT};color:#ffffff;font-size:12px;">New</span></td></tr>
</table>`,
        ],
        true,
      ),
      paragraph(`You can track the status of your ticket by replying to this email. Our team will notify you when there's an update.`),
      ctaButton(`${APP_URL}/dashboard/support`, 'View Your Tickets'),
      paragraph(`If you have any additional information to add, simply reply to this email.`),
    ].join(''),
    {
      previewText: `Your ticket #${ticketNo} has been received`,
    },
  )

  try {
    const { data, error } = await resend.emails.send({
      from: `Prompt & Pause <${NOREPLY_EMAIL}>`,
      to: email,
      subject: `[Ticket #${ticketNo}] We've received your request`,
      html,
    })

    if (error) {
      logger.error('email_ticket_confirmation_send_failed', { error, email, ticketNo })
      return { success: false, error: error.message }
    }

    logger.info('email_ticket_confirmation_sent', { email, ticketNo, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_ticket_confirmation_unexpected_error', { error, email, ticketNo })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send a reply notification email when an agent responds to a ticket
 */
export async function sendTicketReplyNotification(params: {
  email: string
  name: string
  ticketNo: string
  ticketTitle: string
  replyText: string
}): Promise<{ success: boolean; error?: string }> {
  const { email, name, ticketNo, ticketTitle, replyText } = params

  const html = emailWrapper(
    [
      h1(`New reply on ticket #${ticketNo}`),
      paragraph(`Hi ${name},`),
      paragraph(`Your support ticket has received a new reply.`),
      contentSection(
        [
          h3('Ticket'),
          `<p style="color:${TEXT_GRAY};font-size:14px;margin:0;">#${ticketNo} — ${ticketTitle}</p>`,
        ],
        true,
      ),
      contentSection(
        [
          h3('Reply'),
          `<p style="color:${TEXT_DARK};font-size:15px;line-height:1.6;white-space:pre-wrap;">${replyText}</p>`,
        ],
        true,
      ),
      ctaButton(`${APP_URL}/dashboard/support`, 'View Reply'),
      paragraph(`Reply to this email to add a comment to your ticket.`),
    ].join(''),
    {
      previewText: `New reply on ticket #${ticketNo}`,
    },
  )

  try {
    const { data, error } = await resend.emails.send({
      from: `Prompt & Pause Support <${SUPPORT_EMAIL}>`,
      replyTo: SUPPORT_EMAIL,
      to: email,
      subject: `[Ticket #${ticketNo}] New reply — ${ticketTitle}`,
      html,
    })

    if (error) {
      logger.error('email_ticket_reply_notification_send_failed', { error, email, ticketNo })
      return { success: false, error: error.message }
    }

    logger.info('email_ticket_reply_notification_sent', { email, ticketNo, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_ticket_reply_notification_unexpected_error', { error, email, ticketNo })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Validate email service configuration
 * 
 * @returns Object with configuration status
 */
export function validateEmailConfig(): {
  configured: boolean
  hasApiKey: boolean
  hasFromEmail: boolean
} {
  return {
    configured: !!(process.env.RESEND_API_KEY && process.env.NOREPLY_EMAIL),
    hasApiKey: !!process.env.RESEND_API_KEY,
    hasFromEmail: !!process.env.NOREPLY_EMAIL,
  }
}

