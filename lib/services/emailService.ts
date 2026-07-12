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
const INBOUND_EMAIL = process.env.INBOUND_EMAIL || 'support@inbound.promptandpause.com'
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
  emailType: string,
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
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🎉 Welcome</span>
    </div>
    
    ${h1(`Welcome to ${APP_NAME}`)}
    
    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
    
    ${paragraph(`Welcome to ${APP_NAME} — a private space designed to help you pause and reflect, at your own pace. There's no rush, no right way, and no pressure.`)}
    
    ${paragraph(`Here's what to expect:`, { fontSize: '15px' })}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:12px 12px 0 0;border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:top;width:28px;font-size:18px;line-height:1.6;">💭</td>
              <td style="padding-left:12px;">
                <p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;line-height:1.5;">Daily prompts</p>
                <p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;line-height:1.5;">One thoughtful question each day. Write a little or a lot — there's no right length.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:top;width:28px;font-size:18px;line-height:1.6;">📊</td>
              <td style="padding-left:12px;">
                <p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;line-height:1.5;">Gentle reflections</p>
                <p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;line-height:1.5;">Weekly and monthly summaries that offer quiet perspective on your entries.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:0 0 12px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:top;width:28px;font-size:18px;line-height:1.6;">🕰️</td>
              <td style="padding-left:12px;">
                <p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;line-height:1.5;">From Your Past</p>
                <p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;line-height:1.5;">Occasionally, something you wrote before may resurface — only when it feels relevant.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${paragraph(`You can adjust your delivery time, focus areas, or reminders anytime in your dashboard settings.`)}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: dashboardUrl, label: 'Open your dashboard' })}
    </div>
    
    ${paragraph('If you ever have questions, just reply to this email — a real person reads every message.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: 'Welcome to Prompt & Pause',
    title: 'Welcome to Prompt & Pause',
    bodyHTML,
  })
}

/**
 * Generate "getting started" email HTML — sent once onboarding completes.
 */
function generateGettingStartedEmailHTML(name: string): string {
  const dashboardUrl = `${APP_URL.replace(/\/$/, '')}/dashboard`
  const settingsUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/settings`

  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🚀 All set</span>
    </div>
    
    ${h1("You're all set")}

    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}

    ${paragraph(`Your reflection space is ready. ${APP_NAME} is designed to be quiet — one prompt a day, nothing that nags. Here are three steps to make it yours:`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px 16px 16px 0;vertical-align:top;width:32px;font-size:20px;font-weight:700;color:${PRIMARY_ACCENT};line-height:1.5;">1</td>
        <td style="padding:16px 0;border-bottom:1px solid ${BORDER_COLOR};">
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;line-height:1.5;">Answer today's prompt</p>
          <p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;line-height:1.5;">Two sentences is plenty. You're building a habit, not a résumé.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 16px 16px 0;vertical-align:top;width:32px;font-size:20px;font-weight:700;color:${PRIMARY_ACCENT};line-height:1.5;">2</td>
        <td style="padding:16px 0;border-bottom:1px solid ${BORDER_COLOR};">
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;line-height:1.5;">Pick a time that's yours</p>
          <p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;line-height:1.5;">Most people choose early morning or the end of the workday. You can change this anytime in Settings.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 16px 16px 0;vertical-align:top;width:32px;font-size:20px;font-weight:700;color:${PRIMARY_ACCENT};line-height:1.5;">3</td>
        <td style="padding:16px 0;">
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;line-height:1.5;">Come back tomorrow</p>
          <p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;line-height:1.5;">That's the whole practice. We'll surface gentle patterns over time — never before they're useful.</p>
        </td>
      </tr>
    </table>

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
 */
function generateTrialStartedEmailHTML(name: string, trialEndDate: string): string {
  const dashboardUrl = `${APP_URL.replace(/\/$/, '')}/dashboard`
  const settingsUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/settings`
  const prettyEnd = formatTrialDate(trialEndDate)

  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${BG_LIGHT};color:#00ba7c;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">✨ Premium trial</span>
    </div>
    
    ${h1('Your trial is on')}

    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}

    ${paragraph(`You're on <strong>Premium until ${prettyEnd}</strong>. Nothing to do — all features are active. Here's what's included:`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-radius:12px 12px 0 0;border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📅</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Daily personalised prompts</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">Seven days a week</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📚</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Unlimited archive</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">Everything you write, always accessible</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📊</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Weekly &amp; monthly reflections</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">Gentle pattern summaries of your entries</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-radius:0 0 12px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">🎯</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Custom focus areas &amp; export</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">PDF and TXT export</p></td></tr>
          </table>
        </td>
      </tr>
    </table>

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
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:#fef3cd;color:#9a7b1f;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">⏳ Trial ending soon</span>
    </div>
    
    ${h1('Your trial ends in two days')}

    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}

    ${paragraph(`Just a heads-up: your Premium trial ends on <strong>${prettyEnd}</strong>. No action needed — we'll move you to the free tier automatically when the trial finishes.`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:24px 0;">
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:12px 12px 0 0;border-bottom:1px solid ${BORDER_COLOR};">
          <p style="margin:0 0 4px 0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What stays on Free</p>
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;">Three prompts a week, optional check-ins, your last 50 reflections.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:0 0 12px 12px;">
          <p style="margin:0 0 4px 0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What Premium keeps</p>
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;">Daily prompts, unlimited archive, weekly &amp; monthly reflections, export.</p>
        </td>
      </tr>
    </table>

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
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:#fef3cd;color:#9a7b1f;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🔐 New sign-in</span>
    </div>
    
    ${h1('New sign-in to your account')}

    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}

    ${paragraph(`We noticed a sign-in to your ${APP_NAME} account from a device or location we haven't seen before.`)}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:12px 12px 0 0;border-bottom:1px solid ${BORDER_COLOR};">
          <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">When</p>
          <p style="margin:4px 0 0 0;color:${TEXT_DARK};font-size:15px;">${when}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Where</p>
          <p style="margin:4px 0 0 0;color:${TEXT_DARK};font-size:15px;">${locationLabel}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:0 0 12px 12px;">
          <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Device</p>
          <p style="margin:4px 0 0 0;color:${TEXT_DARK};font-size:15px;">${uaLabel}</p>
        </td>
      </tr>
    </table>

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
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:#fef3cd;color:#9a7b1f;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">⚠️ Payment failed</span>
    </div>
    
    ${h1("We couldn't process your payment")}

    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}

    ${paragraph(`Your card was declined when we tried to charge <strong>${amountLabel}</strong> for ${APP_NAME} Premium. Your account stays on Premium for now — this is just a heads-up so nothing lapses unexpectedly.`)}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px;background:#fef3cd;border-left:3px solid #ffad1f;border-radius:8px;">
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;line-height:1.6;">
            <strong>Most common fix:</strong> update your card details — expired cards are the usual cause.
          </p>
          ${
            nextAttempt
              ? `<p style="margin:8px 0 0 0;color:${TEXT_DARK};font-size:15px;line-height:1.6;"><strong>We'll retry automatically</strong> on ${nextAttempt}.</p>`
              : ''
          }
        </td>
      </tr>
    </table>

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

  const observationsHTML = (reflection.observations ?? [])
    .filter((line) => line && line.trim().length > 0)
    .map(
      (line) => `
      <li style="margin:0 0 10px 0;padding:0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        ${line.replace(/^[-•]\s*/, '')}
      </li>`,
    )
    .join('')

  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">📊 Monthly reflection</span>
    </div>
    
    ${h1(`Your ${reflection.monthLabel} reflection`)}

    ${paragraph(reflection.monthLabel, { align: 'center', fontSize: '13px', color: TEXT_MUTED })}

    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}

    ${reflection.overviewText ? paragraph(reflection.overviewText) : ''}

    ${
      observationsHTML
        ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:32px 0;">
      <tr>
        <td style="padding:20px 24px;background:${BG_LIGHT};border-radius:12px;">
          ${h3('A few things we noticed')}
          <ul style="margin:12px 0 0 0;padding:0 0 0 20px;">
            ${observationsHTML}
          </ul>
        </td>
      </tr>
    </table>`
        : ''
    }

    ${
      reflection.themeReflection
        ? infoBox(`
      <p style="margin:0;color:${TEXT_GRAY};font-size:15px;line-height:1.7;font-style:italic;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        ${reflection.themeReflection}
      </p>
    `)
        : ''
    }

    ${
      reflection.closingQuestion
        ? paragraph(
            `<strong>Something to sit with:</strong> ${reflection.closingQuestion}`,
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
    day: 'numeric',
  })

  const promptContent = `
    <div style="text-align:center;padding: 20px 0 8px;">
      <span style="display:inline-block;font-size:11px;color:${PRIMARY_ACCENT};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;background:${BG_LIGHT};padding:8px 18px;border-radius:999px;">${today}</span>
    </div>
    
    ${h1('Your Daily Reflection Prompt')}
    
    ${paragraph(`Good day, ${name}`, { align: 'center' })}
    
    ${paragraph('Take a moment to pause and reflect on today\'s question:', { align: 'center', fontSize: '15px' })}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background-color: ${BG_LIGHT}; padding: 32px 28px; border-radius: 16px; border: 1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:5px 14px;border-radius:999px;">Today's Prompt</span>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="font-size: 22px; color: ${TEXT_DARK}; line-height: 1.5; margin: 0; font-weight: 500; font-style: italic; font-family: Georgia, 'Times New Roman', serif;">
                  "${prompt}"
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${paragraph('Set aside a few minutes today to explore this question. There are no right or wrong answers — just your authentic thoughts and feelings.', { align: 'center', fontSize: '14px' })}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Start Reflecting' })}
    </div>
    
    ${infoBox(`
      💡 <strong>Tip:</strong> Try writing for at least 3-5 minutes without overthinking. Let your thoughts flow naturally.
    `)}
  `

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
        `<span style="display: inline-block; background: ${BG_LIGHT}; color: ${PRIMARY_ACCENT}; padding: 6px 14px; border-radius: 999px; margin: 4px; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${tag} (${count})</span>`,
    )
    .join('')

  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${BG_LIGHT};color:${PRIMARY_ACCENT};font-size:12px;font-weight:600;padding:4px 14px;border-radius:999px;">📋 Weekly recap</span>
    </div>
    
    ${h1('Your weekly recap')}

    ${paragraph(dateRange, { align: 'center', fontSize: '13px', color: TEXT_MUTED })}

    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}

    ${paragraph('A small recap from your reflections this week — nothing to act on, just something to notice.')}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:20px;background:${BG_LIGHT};border-radius:12px;text-align:center;">
          <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reflections this week</p>
          <p style="margin:4px 0 0 0;color:${PRIMARY_ACCENT};font-size:36px;font-weight:700;line-height:1;">${digest.totalReflections}</p>
        </td>
      </tr>
    </table>

    ${
      digest.topTags.length > 0
        ? `
    <div style="margin: 32px 0;">
      ${h3('Themes you touched on')}
      <div style="text-align: center;margin-top:12px;">${topTagsHTML}</div>
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
  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:#e6f7e6;color:#007a4d;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">✅ Premium active</span>
    </div>
    
    ${h1('Welcome to Premium')}
    
    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
    
    ${paragraph(`Your <strong>${planName}</strong> subscription is now active. Thank you for joining us on this journey of mindful reflection.`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-radius:12px 12px 0 0;border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📅</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Daily prompts</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">7 days a week</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📊</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Weekly &amp; monthly reflections</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">AI-powered insights</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">🕰️</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">From Your Past</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">Meaningful resurfacing</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📚</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Unlimited archive &amp; export</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">PDF &amp; TXT formats</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-radius:0 0 12px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📬</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Email delivery</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">At your chosen time</p></td></tr>
          </table>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Start Reflecting' })}
    </div>
    
    ${paragraph(`Manage your subscription anytime in <a href="https://promptandpause.com/dashboard/settings" target="_blank" rel="noopener noreferrer" class="email-text-primary" style="color: ${PRIMARY_ACCENT}; text-decoration: none; font-weight: 600;">Settings</a>.`, { align: 'center', fontSize: '14px' })}
  `)

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
  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${BG_LIGHT};color:${TEXT_GRAY};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">📋 Trial ended</span>
    </div>
    
    ${h1('Your trial has ended')}
    
    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
    
    ${paragraph('Your Premium trial has ended, and you\'ve been moved to our <strong>Free tier</strong>. Your reflections and data are all still here — nothing has been lost.')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:12px;border-bottom:1px solid ${BORDER_COLOR};">
          <p style="margin:0 0 4px 0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Free tier includes</p>
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;">3 personalised prompts per week, optional check-in, access to last 50 reflections, email delivery at your chosen time.</p>
        </td>
      </tr>
    </table>

    ${paragraph('If you\'d like to continue with Premium features, you can upgrade at any time:')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-radius:12px 12px 0 0;border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📅</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Daily prompts</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">7 days a week</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📚</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Unlimited archive</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">All your reflections, always</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">📊</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Weekly &amp; monthly reflections</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">Gentle pattern summaries</p></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px;background:${BG_LIGHT};border-radius:0 0 12px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="vertical-align:top;width:24px;font-size:16px;">🎯</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Export &amp; focus areas</p><p style="margin:2px 0 0 0;color:${TEXT_GRAY};font-size:14px;">PDF/TXT export, unlimited focus areas</p></td></tr>
          </table>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center; margin: 40px 0;">
      ${ctaButton('View pricing', `${APP_URL}/pricing`)}
    </div>
    
    ${paragraph('Your reflections stay either way. Upgrade anytime from your dashboard settings.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

  return buildBaseEmail({
    preheader: 'Your Prompt & Pause trial has ended',
    title: 'Your trial has ended',
    bodyHTML,
  })
}

/**
 * Generate subscription cancellation email HTML
 */
function generateSubscriptionCancellationHTML(name: string, planName: string): string {
  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${BG_LIGHT};color:${TEXT_GRAY};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">↩️ Cancelled</span>
    </div>
    
    ${h1('Subscription Cancelled', { color: TEXT_DARK })}
    
    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
    
    ${paragraph(`We've received your request to cancel your <strong>${planName}</strong> subscription. We're sorry to see you go.`)}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:12px;">
          <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What happens next</p>
          <p style="margin:8px 0 0 0;color:${TEXT_DARK};font-size:15px;line-height:1.6;">Your premium access will continue until the end of your current billing period. After that, you'll be switched to our free tier. All your reflections and data will remain safe.</p>
        </td>
      </tr>
    </table>
    
    ${paragraph('If you change your mind, you can resubscribe anytime from your settings page. We\'d love to have you back.')}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard/settings', label: 'View Account Settings' })}
    </div>
    
    ${paragraph('We\'d love to hear your feedback. Reply to this email to let us know how we can improve.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

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
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">📄 Export ready</span>
    </div>
    
    ${h1('Your Data Export is Ready')}
    
    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
    
    ${paragraph(`We've compiled all your data from ${APP_NAME} into a comprehensive PDF document. You'll find it attached to this email.`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:12px;">
          <p style="margin:0 0 8px 0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your export includes</p>
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;line-height:1.6;">All your reflections and journal entries, account preferences and settings.</p>
        </td>
      </tr>
    </table>
    
    ${alertBox('🔒 <strong>Keep this file safe.</strong> It contains sensitive personal information. Please store it securely and don\'t share it with anyone.', 'warning')}
    
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
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:${BG_LIGHT};color:${TEXT_GRAY};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🗑️ Account deleted</span>
    </div>
    
    ${h1('Account Deleted')}
    
    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
    
    ${paragraph(`This email confirms that your ${APP_NAME} account and all associated data have been permanently deleted.`)}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:12px;">
          <p style="margin:0 0 8px 0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What was removed</p>
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;line-height:1.6;">Your profile and account credentials, all reflections and journal entries, prompt history and preferences, and any connected integrations.</p>
        </td>
      </tr>
    </table>
    
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
    .map(service => `<li style="margin-bottom:8px;color:${TEXT_DARK};font-size:14px;line-height:1.6;">${service}</li>`)
    .join('')

  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:#fef3cd;color:#9a7b1f;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🔧 Scheduled maintenance</span>
    </div>
    
    ${h1('Scheduled Maintenance')}
    
    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
    
    ${paragraph(`We're writing to let you know about planned maintenance on ${APP_NAME}.`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:12px 12px 0 0;border-bottom:1px solid ${BORDER_COLOR};">
          <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Date</p>
          <p style="margin:4px 0 0 0;color:${TEXT_DARK};font-size:15px;">${scheduledDate}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:0 0 12px 12px;${affectedServices.length > 0 ? `border-bottom:1px solid ${BORDER_COLOR};` : ''}">
          <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Time</p>
          <p style="margin:4px 0 0 0;color:${TEXT_DARK};font-size:15px;">${startTime} – ${endTime} UTC</p>
        </td>
      </tr>
      ${affectedServices.length > 0 ? `
      <tr>
        <td style="padding:16px;background:${BG_LIGHT};border-radius:0 0 12px 12px;">
          <p style="margin:0 0 8px 0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Affected Services</p>
          <ul style="margin:0;padding-left:20px;">${servicesHTML}</ul>
        </td>
      </tr>` : ''}
    </table>
    
    ${description ? paragraph(description) : ''}
    
    ${infoBox('🔒 <strong>Your data:</strong> Your reflections and personal information remain secure during maintenance.')}
    
    ${paragraph('We apologise for any inconvenience and appreciate your patience as we work to improve Prompt & Pause.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
    
    ${paragraph(`Questions? <a href="mailto:support@promptandpause.com" style="color:${PRIMARY_ACCENT};text-decoration:underline;">Contact us</a>.`, { align: 'center', fontSize: '14px' })}
  `)

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

  const bodyHTML = contentSection(`
    <div style="text-align:center;margin-bottom:8px;">
      <span style="display:inline-block;background:#e6f7e6;color:#007a4d;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">✅ Maintenance complete</span>
    </div>
    
    ${h1('Maintenance complete')}
    
    ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
    
    ${paragraph(`${APP_NAME} is fully available again after maintenance.`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:24px 0;">
      <tr>
        <td style="padding:16px;background:#e6f7e6;border-left:3px solid #00ba7c;border-radius:8px;">
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">All Systems Operational</p>
          <p style="margin:4px 0 0 0;color:${TEXT_GRAY};font-size:14px;">Completed at ${completedAt}</p>
        </td>
      </tr>
    </table>
    
    ${improvements ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:24px 0;">
      <tr>
        <td style="padding:20px 24px;background:${BG_LIGHT};border-radius:12px;">
          <p style="margin:0 0 8px 0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What's Improved</p>
          <p style="margin:0;color:${TEXT_DARK};font-size:15px;line-height:1.6;">${improvements}</p>
        </td>
      </tr>
    </table>` : ''}
    
    ${notes ? paragraph(notes) : ''}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Open dashboard' })}
    </div>
    
    ${paragraph('Thank you for your patience.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `)

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

    const html = buildBaseEmail({
      preheader: `Your ${APP_NAME} admin account has been created`,
      title: 'Admin account created',
      bodyHTML: contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🔑 Admin account</span>
        </div>
        
        ${h1('Admin account created')}
        
        ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
        
        ${paragraph(`Your admin account has been created for ${APP_NAME}. You now have <strong>${roleDisplay}</strong> access to the admin panel.`)}
        
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
          <tr>
            <td style="padding:20px 24px;background:${BG_LIGHT};border-radius:12px;">
              <p style="margin:0 0 12px 0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Your Login Credentials</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="margin:0;color:${TEXT_GRAY};font-size:13px;">Email</p>
                    <p style="margin:2px 0 0 0;color:${TEXT_DARK};font-size:15px;font-weight:600;">${email}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0;color:${TEXT_GRAY};font-size:13px;">Temporary Password</p>
                    <code style="display:inline-block;margin-top:4px;padding:6px 12px;background:${BG_WHITE};border:1px solid ${BORDER_COLOR};border-radius:6px;color:${TEXT_DARK};font-size:14px;font-family:'Courier New',monospace;font-weight:600;">${password}</code>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        ${paragraph('<strong>Important Security Steps:</strong>')}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:16px 0;">
          <tr>
            <td style="padding:12px 16px;background:#fef3cd;border-left:3px solid #ffad1f;border-radius:8px;">
              <ol style="margin:0;padding-left:18px;color:${TEXT_DARK};font-size:14px;line-height:1.8;">
                <li>Sign in using the credentials above</li>
                <li>Change your password immediately in your profile settings</li>
                <li>Do not share your credentials with anyone</li>
                <li>Enable two-factor authentication if available</li>
              </ol>
            </td>
          </tr>
        </table>
        
        ${paragraph(`Your role as <strong>${roleDisplay}</strong> gives you access to:`)}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:12px 0 24px;">
          <tr>
            <td style="padding:16px;background:${BG_LIGHT};border-radius:12px;">
              <ul style="margin:0;padding-left:18px;color:${TEXT_DARK};font-size:14px;line-height:1.8;">
                ${role === 'super_admin' ? `
                  <li>Full system administration</li>
                  <li>API and backend management</li>
                  <li>Create and manage all admin users</li>
                  <li>Access to all admin panel features</li>
                ` : role === 'admin' ? `
                  <li>Create and manage admin users</li>
                  <li>Access to admin panel features</li>
                  <li>User support and management</li>
                ` : `
                  <li>Access to assigned admin panel features</li>
                  <li>User support tools</li>
                `}
              </ul>
            </td>
          </tr>
        </table>
        
        ${ctaButton('Sign In to Admin Panel', loginUrl)}
        
        ${paragraph(`If you have any questions or need assistance, please contact your administrator.`)}
      `),
    })

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

    const html = buildBaseEmail({
      preheader: 'Your Prompt & Pause trial has ended',
      title: 'Your trial has ended',
      bodyHTML: contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:${BG_LIGHT};color:${TEXT_GRAY};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">📋 Trial ended</span>
        </div>
        
        ${h1('Your trial has ended')}
        
        ${paragraph(`Hi ${displayName},`, { fontSize: '16px' })}
        
        ${paragraph('Your trial has come to an end. Your account has been moved to the Free tier — you can keep using the core features, and your reflections remain safe.')}
        
        ${paragraph('If you\'d like to continue with Premium features, you can upgrade at any time from your account settings.')}
        
        <div style="text-align: center; margin: 40px 0;">
          ${ctaButton('View pricing', upgradeUrl)}
        </div>
        
        ${paragraph('If you have any questions, just reply to this email.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
      `),
    })

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

    const html = buildBaseEmail({
      preheader: `Your ${discountLabel} discount is ready`,
      title: `Your ${discountLabel} discount is ready`,
      bodyHTML: contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🎉 Discount approved</span>
        </div>
        
        ${h1(`Your ${discountLabel} discount is ready`)}
        
        ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
        
        ${paragraph(`Good news! You've been approved for <strong>${discountLabel} discount</strong> pricing on Prompt & Pause Premium.`)}
        
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:24px 0;">
          <tr>
            <td style="padding:20px 24px;background:${BG_LIGHT};border-radius:12px;">
              <p style="margin:0 0 12px 0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Your discount</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">40% off Premium</span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_DARK};font-weight:600;">${pricing}</span> <span style="color:${TEXT_GRAY};">(${billingCycle})</span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Full Premium features included</span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Valid until <strong>${expiryDate}</strong></span></td></tr>
              </table>
            </td>
          </tr>
        </table>
        
        ${paragraph('To activate your discount, click the button below and complete payment. This link is unique to you and expires in 7 days.')}
        
        <div style="text-align: center; margin: 40px 0;">
          ${ctaButton('Activate my discount', checkoutUrl)}
        </div>
        
        ${paragraph('Once activated, you\'ll have full access to Premium features including weekly insights, monthly summaries, and unlimited reflections.')}
        
        ${paragraph('If you have any questions, just reply to this email.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
        
        ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
      `),
    })

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

    const html = buildBaseEmail({
      preheader: 'Gift subscription activated',
      title: 'Gift subscription activated',
      bodyHTML: contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:#e6f7e6;color:#007a4d;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🎁 Gift activated</span>
        </div>
        
        ${h1('Gift subscription activated')}
        
        ${paragraph(`Hi ${name},`, { fontSize: '16px' })}
        
        ${paragraph('Great news! Your gift subscription has been activated successfully.')}
        
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:24px 0;">
          <tr>
            <td style="padding:20px 24px;background:${BG_LIGHT};border-radius:12px;">
              <p style="margin:0 0 12px 0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Your gift subscription</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Duration: <strong>${durationMonths} month${durationMonths > 1 ? 's' : ''}</strong> of Premium</span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Active until <strong>${endDateStr}</strong></span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Full access to all Premium features</span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">No billing until gift expires</span></td></tr>
              </table>
            </td>
          </tr>
        </table>
        
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:24px 0;">
          <tr>
            <td style="padding:14px;background:${BG_LIGHT};border-radius:12px 12px 0 0;border-bottom:1px solid ${BORDER_COLOR};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="vertical-align:top;width:24px;font-size:16px;">📝</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Unlimited daily reflections</p></td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="vertical-align:top;width:24px;font-size:16px;">📊</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Weekly insights &amp; digests</p></td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px;background:${BG_LIGHT};border-bottom:1px solid ${BORDER_COLOR};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="vertical-align:top;width:24px;font-size:16px;">📅</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Monthly reflection summaries</p></td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px;background:${BG_LIGHT};border-radius:0 0 12px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="vertical-align:top;width:24px;font-size:16px;">🕰️</td><td style="padding-left:10px;"><p style="margin:0;color:${TEXT_DARK};font-size:15px;font-weight:600;">"From your past" resurfacing</p></td></tr>
              </table>
            </td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 40px 0;">
          ${ctaButton('Start reflecting', `${APP_URL}/dashboard`)}
        </div>
        
        ${paragraph(`Your subscription will automatically downgrade to the Free tier on ${endDateStr}. If you'd like to continue with Premium features after that, you can subscribe from your account settings.`)}
        
        ${paragraph('Enjoy your gift subscription!')}
        
        ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
      `),
    })

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

    const html = buildBaseEmail({
      preheader: 'You\'ve received a gift subscription',
      title: 'You\'ve received a gift subscription',
      bodyHTML: contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🎁 Gift for you</span>
        </div>
        
        ${h1('You\'ve received a gift')}

        ${paragraph(`Hi ${displayName},`, { fontSize: '16px' })}

        ${paragraph(`You've received a <strong>${durationMonths}-month Premium</strong> gift subscription ${fromLine}.`)}

        ${giftMessage ? paragraph(`💬 "${giftMessage}"`) : ''}

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:24px 0;">
          <tr>
            <td style="padding:20px 24px;background:${BG_LIGHT};border-radius:12px;">
              <p style="margin:0 0 12px 0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Gift details</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Duration: <strong>${durationMonths} month${durationMonths > 1 ? 's' : ''}</strong></span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Gift code: <code style="background:${BG_WHITE};padding:2px 8px;border:1px solid ${BORDER_COLOR};border-radius:4px;font-weight:600;">${redemptionToken}</code></span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Expires: <strong>${expiryDate}</strong></span></td></tr>
              </table>
            </td>
          </tr>
        </table>

        ${paragraph('To redeem: sign in (or create an account), then enter your gift code on the redemption page.')}

        <div style="text-align: center; margin: 40px 0;">
          ${ctaButton('Redeem gift', redeemUrl)}
        </div>

        ${paragraph('If you have any trouble redeeming, reply to this email and we\'ll help.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}

        ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
      `),
    })

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

    const html = buildBaseEmail({
      preheader: 'Gift subscription purchased',
      title: 'Gift subscription purchased',
      bodyHTML: contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:#e6f7e6;color:#007a4d;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">✅ Purchase confirmed</span>
        </div>
        
        ${h1('Gift subscription purchased')}

        ${paragraph(`Hi ${displayName},`, { fontSize: '16px' })}

        ${paragraph(`Thanks — your <strong>${durationMonths}-month gift subscription</strong> purchase is confirmed.`)}
        
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:24px 0;">
          <tr>
            <td style="padding:20px 24px;background:${BG_LIGHT};border-radius:12px;">
              <p style="margin:0 0 12px 0;color:${TEXT_DARK};font-size:15px;font-weight:600;">Gift details</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Duration: <strong>${durationMonths} month${durationMonths > 1 ? 's' : ''}</strong></span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Gift code: <code style="background:${BG_WHITE};padding:2px 8px;border:1px solid ${BORDER_COLOR};border-radius:4px;font-weight:600;">${redemptionToken}</code></span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Expires: <strong>${expiryDate}</strong></span></td></tr>
                ${recipientEmail ? `<tr><td style="padding:4px 0;"><span style="color:${TEXT_GRAY};">Recipient: <strong>${recipientEmail}</strong></span></td></tr>` : ''}
              </table>
            </td>
          </tr>
        </table>

        ${paragraph('If your recipient can\'t find the gift email, you can forward them the gift code above. They\'ll need an account to redeem.')}

        ${paragraph('If you have any questions, reply to this email.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}

        ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
      `),
    })

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

    const html = buildBaseEmail({
      preheader: 'Your gift was redeemed',
      title: 'Your gift was redeemed',
      bodyHTML: contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">🎉 Gift redeemed</span>
        </div>
        
        ${h1('Your gift was redeemed')}

        ${paragraph(`Hi ${displayName},`, { fontSize: '16px' })}

        ${paragraph(`Just a quick note — your <strong>${durationMonths}-month gift subscription</strong> was redeemed on ${redeemedDate}.`)}
        
        ${infoBox('💛 Thanks for giving a little space for reflection.')}

        ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
      `),
    })

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

    const html = buildBaseEmail({
      preheader: 'Your gift subscription ends soon',
      title: 'Your gift subscription ends soon',
      bodyHTML: contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:#fef3cd;color:#9a7b1f;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">⏳ Gift ending soon</span>
        </div>
        
        ${h1('Your gift subscription ends soon')}

        ${paragraph(`Hi ${displayName},`, { fontSize: '16px' })}

        ${paragraph(`A quick reminder: your gift subscription is set to end on <strong>${endDateStr}</strong>.`)}

        ${paragraph('Nothing is required from you. When it ends, your account will move back to the Free tier.')}

        <div style="text-align: center; margin: 40px 0;">
          ${ctaButton('View your settings', settingsUrl)}
        </div>

        ${paragraph('If you\'d like to continue with Premium features after that, you can choose a plan in Settings.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}

        ${paragraph('– The Prompt & Pause team', { fontSize: '14px', color: TEXT_MUTED })}
      `),
    })

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
}): Promise<{ success: boolean; error?: string; emailId?: string }> {
  const { email, name, ticketNo, ticketTitle, priority } = params

  const priorityBadge = priority === 'high' ? '🔴' : priority === 'urgent' ? '⚠️' : '🟢'
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1)

  const html = emailWrapper(
    [
      h1(`✅ Ticket Received`),
      paragraph(`Hi ${name},`, { fontSize: '16px' }),
      paragraph(`We've received your support ticket and will get back to you within 24–48 hours.`),
      contentSection(`
        <div style="text-align:center;margin-bottom:16px;">
          <span style="display:inline-block;background:${PRIMARY_ACCENT}15;color:${PRIMARY_ACCENT};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">#${ticketNo}</span>
        </div>
        ${h2(ticketTitle, { align: 'center', color: TEXT_DARK })}
        <table style="width:100%;border-collapse:separate;border-spacing:0;margin-top:16px;">
          <tr>
            <td style="padding:12px 16px;background:${BG_LIGHT};border-radius:8px 0 0 8px;width:50%;">
              <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Priority</p>
              <p style="margin:2px 0 0 0;color:${TEXT_DARK};font-size:15px;font-weight:600;">${priorityBadge} ${priorityLabel}</p>
            </td>
            <td style="padding:12px 16px;background:${BG_LIGHT};border-radius:0 8px 8px 0;width:50%;">
              <p style="margin:0;color:${TEXT_GRAY};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Status</p>
              <p style="margin:2px 0 0 0;"><span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${PRIMARY_ACCENT};color:#ffffff;font-size:13px;font-weight:600;">New</span></p>
            </td>
          </tr>
        </table>
      `),
      infoBox(`📌 You can track your ticket and add more information by replying directly to this email — your replies will be linked automatically.`),
      ctaButton(`${APP_URL}/dashboard/support`, 'View Your Ticket'),
    ].join(''),
    {
      preheader: `Your ticket #${ticketNo} has been received`,
    },
  )

  try {
    const { data, error } = await resend.emails.send({
      from: `Prompt & Pause Support <${SUPPORT_EMAIL}>`,
      replyTo: INBOUND_EMAIL,
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
}): Promise<{ success: boolean; error?: string; emailId?: string }> {
  const { email, name, ticketNo, ticketTitle, replyText } = params

  const html = emailWrapper(
    [
      h1(`💬 New Reply`),
      paragraph(`Hi ${name},`, { fontSize: '16px' }),
      paragraph(`Your support ticket has received a new reply from our team.`),
      contentSection(`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="display:inline-block;background:${BG_LIGHT};color:${TEXT_GRAY};font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">#${ticketNo} — ${ticketTitle}</span>
        </div>
      `),
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:0;">
        <tr>
          <td style="padding:0 28px;">
            <div style="background:${BG_LIGHT};border-radius:12px;padding:20px;border-left:3px solid ${PRIMARY_ACCENT};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin-bottom:8px;">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="display:inline-block;width:32px;height:32px;border-radius:999px;background:${PRIMARY_ACCENT};color:#ffffff;font-size:14px;font-weight:700;text-align:center;line-height:32px;margin-right:8px;">S</span>
                    <span style="color:${TEXT_DARK};font-size:14px;font-weight:600;">Support Team</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:${TEXT_DARK};font-size:15px;line-height:1.7;white-space:pre-wrap;">${replyText}</p>
            </div>
          </td>
        </tr>
      </table>`,
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin:0;">
        <tr>
          <td style="padding:16px 28px 0;">
            <p style="margin:0;color:${TEXT_MUTED};font-size:12px;text-align:center;font-style:italic;">💡 Reply to this email to continue the conversation</p>
          </td>
        </tr>
      </table>`,
      ctaButton(`${APP_URL}/dashboard/support`, 'View Reply'),
    ].join(''),
    {
      preheader: `New reply on ticket #${ticketNo}`,
    },
  )

  try {
    const { data, error } = await resend.emails.send({
      from: `Prompt & Pause Support <${SUPPORT_EMAIL}>`,
      replyTo: INBOUND_EMAIL,
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

export async function sendAnnouncementEmail(params: {
  templateKey: string
  subject: string
  contentHtml: string
  recipients: { email: string; userId?: string; name?: string }[]
  senderEmail?: string
}): Promise<{ sent: number; failed: number; errors: { email: string; error: string }[] }> {
  const { templateKey, subject, contentHtml, recipients, senderEmail } = params
  const sender = senderEmail || NOREPLY_EMAIL
  const errors: { email: string; error: string }[] = []
  let sent = 0

  for (const recipient of recipients) {
    try {
      const displayName = recipient.name || recipient.email.split('@')[0]
      const html = await generateWithCustomization(templateKey, () =>
        emailWrapper(contentHtml, {
          preheader: subject,
          title: `Prompt & Pause - ${subject}`,
        })
      )

      const { error } = await resend.emails.send({
        from: `${APP_NAME} <${sender}>`,
        to: recipient.email,
        subject,
        html,
      })

      if (error) {
        errors.push({ email: recipient.email, error: error.message })
        continue
      }

      sent++

      if (recipient.userId) {
        await logEmailDelivery(recipient.userId, templateKey, recipient.email, 'sent', null)
      }
    } catch (err: any) {
      errors.push({ email: recipient.email, error: err.message || 'Unknown error' })
    }
  }

  return { sent, failed: errors.length, errors }
}

