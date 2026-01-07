import { Resend } from 'resend'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { WeeklyDigest } from '@/lib/types/reflection'
import { logger } from '@/lib/utils/logger'
import { getTemplateByKey } from '@/lib/services/emailTemplateService'
import { EmailTemplateCustomization, DEFAULT_EMAIL_CUSTOMIZATION } from '@/lib/types/emailTemplate'
// Import professional email template system
import { BRAND_COLORS, emailWrapper, contentSection, h1, h2, h3, paragraph, ctaButton, infoBox } from '@/lib/services/emailTemplates'

/**
 * Email Service for Prompt & Pause
 * 
 * Handles all transactional email delivery using Resend API.
 * All emails are logged to the email_delivery_log table for tracking.
 * 
 * Environment Variables Required:
 * - RESEND_API_KEY: API key from Resend
 * - RESEND_FROM_EMAIL: Verified sender email address
 */

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'prompts@promptandpause.com'
const APP_NAME = 'Prompt & Pause'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promptandpause.com'


// Brand colors from professional template system - Dashboard matching theme
const BG_CREAM = BRAND_COLORS.backgroundLight   // #f4f0eb - Warm cream
const BG_WHITE = BRAND_COLORS.backgroundPure    // #ffffff - Pure white
const BG_LIGHT = BRAND_COLORS.backgroundSection // #f8f6f3 - Soft cream sections
const BORDER_COLOR = BRAND_COLORS.border        // #e2e8f0 - Slate border
const TEXT_DARK = BRAND_COLORS.textDark         // #1e293b - Slate dark
const TEXT_GRAY = BRAND_COLORS.textGray         // #475569 - Slate gray
const TEXT_MUTED = BRAND_COLORS.textMuted       // #94a3b8 - Slate muted
const PRIMARY_ACCENT = BRAND_COLORS.primary     // #384c37 - Forest green
const SECONDARY_ACCENT = BRAND_COLORS.primaryLight // #4a6349 - Light forest
const GOLD_ACCENT = '#c9a227'                   // Warm gold for special CTAs

// Brand CDN Logo URL - Links to homepage
const LOGO_URL = 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg'

function renderTemplateString(template: string, variables: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key]
    if (value === null || value === undefined) return _match
    return String(value)
  })
}

async function getSubjectForTemplate(
  templateKey: string,
  variables: Record<string, string | number | null | undefined> = {}
): Promise<string> {
  try {
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
  return `<img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 50px; width: auto; ${filterStyle}" />`
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
  name: string | null
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
        userId: 'unknown',
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
      userId: 'unknown',
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

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    })

    if (error) {
      logger.error('email_prompt_send_error', { error, email, userId })
      await logEmailDelivery(userId, 'daily_prompt', email, 'failed', null, error.message)
      await logEmailSend({
        userId,
        recipientEmail: email,
        subject,
        templateName: 'daily_prompt',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }
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
      from: `${APP_NAME} <${FROM_EMAIL}>`,
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
      from: `${APP_NAME} <${FROM_EMAIL}>`,
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
      from: `${APP_NAME} <${FROM_EMAIL}>`,
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
  emailType: 'daily_prompt' | 'weekly_digest' | 'welcome' | 'subscription_confirm' | 'subscription_cancelled' | 'data_export' | 'trial_expired',
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
      <ul style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <li style="margin-bottom: 10px;">Each day, you\'ll see one thoughtful question. You can write a little or a lot — there\'s no right length.</li>
        <li style="margin-bottom: 10px;">Over time, you may receive gentle weekly or monthly reflections that offer perspective on your entries. These are optional.</li>
        <li>Occasionally, something you wrote in the past may resurface — only when it feels relevant.</li>
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
          <span style="display: inline-block; font-size: 11px; color: ${PRIMARY_ACCENT}; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; background: rgba(56, 76, 55, 0.08); padding: 8px 18px; border-radius: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${today}
          </span>
        </td>
      </tr>
    </table>
    
    ${h1('Your Daily Reflection Prompt')}
    
    ${paragraph(`Good day, ${name}`, { align: 'center' })}
    
    ${paragraph('Take a moment to pause and reflect on today\'s question:', { align: 'center', fontSize: '15px' })}
    
    <!-- Prompt Card with soft reflection styling -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, ${BG_LIGHT} 0%, ${BG_WHITE} 100%); padding: 32px 28px; border-radius: 16px; border: 1px solid ${BORDER_COLOR}; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <p style="font-size: 11px; color: ${PRIMARY_ACCENT}; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Today's Prompt</p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="font-size: 19px; color: ${TEXT_DARK}; line-height: 1.6; margin: 0; font-weight: 400; font-style: italic; font-family: Georgia, 'Times New Roman', serif;">
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
      <p style="margin: 0; color: ${TEXT_GRAY}; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong style="color: ${TEXT_DARK}; font-weight: 600;">Tip:</strong> Try writing for at least 3-5 minutes without overthinking. Let your thoughts flow naturally.
      </p>
    `)}
  `

  return contentSection(promptContent)
}

/**
 * Generate weekly digest email HTML
 */
function generateWeeklyDigestEmailHTML(name: string, digest: WeeklyDigest): string {
  const topTagsHTML = digest.topTags
    .map(({ tag, count }) => `<span style="display: inline-block; background: rgba(56, 76, 55, 0.08); color: ${PRIMARY_ACCENT}; padding: 6px 14px; border-radius: 20px; margin: 4px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${tag} (${count})</span>`)
    .join('')

  const bodyHTML = `
    ${h1('A Gentle Weekly Recap')}
    <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 0 0 32px 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${new Date(digest.weekStart).toLocaleDateString('en-GB')} - ${new Date(digest.weekEnd).toLocaleDateString('en-GB')}
    </p>
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph('Here is a small recap from your reflections this week:')}
    
    ${infoBox(`
      <p style="margin: 0; color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong style="color: ${TEXT_DARK}; font-weight: 600;">Reflections this week:</strong> ${digest.totalReflections}
      </p>
    `)}
    
    ${digest.topTags.length > 0 ? `
    <div style="margin: 32px 0;">
      <h3 style="color: ${TEXT_DARK}; font-size: 14px; margin: 0 0 16px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Themes You Touched On</h3>
      <div style="text-align: center;">${topTagsHTML}</div>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard/archive', label: 'View Full Archive' })}
    </div>
    
    ${paragraph('If you want, you can revisit anything you wrote this week.', { align: 'center' })}
  `

  return buildBaseEmail({
    preheader: `Your weekly reflection summary (${digest.totalReflections} reflections)`,
    title: 'Your Weekly Reflection Summary',
    bodyHTML
  })
}

/**
 * Generate subscription confirmation email HTML
 */
function generateSubscriptionConfirmationHTML(name: string, planName: string): string {
  const bodyHTML = `
    ${h1('Welcome to Premium')}
    
    ${paragraph(`Hi ${name},`, { align: 'center' })}
    
    ${paragraph(`Your ${planName} subscription is active.`)}
    
    ${infoBox(`
      ${h3('Included with Premium', { align: 'left' })}
      <ul style="color: ${TEXT_GRAY}; line-height: 1.9; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <li style="margin-bottom: 8px;">Daily prompts</li>
        <li style="margin-bottom: 8px;">Weekly and monthly reflections</li>
        <li style="margin-bottom: 8px;">From Your Past resurfacing</li>
        <li style="margin-bottom: 8px;">Export reflections</li>
        <li>Email + Slack delivery</li>
      </ul>
    `)}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Open your dashboard' })}
    </div>
    
    ${paragraph(`You can manage your subscription anytime from your <a href="https://promptandpause.com/dashboard/settings" target="_blank" rel="noopener noreferrer" style="color: ${PRIMARY_ACCENT}; text-decoration: none; font-weight: 500;">settings page</a>.`, { align: 'center', fontSize: '14px' })}
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
      <ul style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <li style="margin-bottom: 8px;">3 personalized prompts per week</li>
        <li style="margin-bottom: 8px;">Optional check-in</li>
        <li style="margin-bottom: 8px;">Access to last 50 reflections</li>
        <li>Email delivery at your chosen time</li>
      </ul>
    `)}
    
    ${paragraph('If you want to continue with Premium features, you can upgrade at any time.', { align: 'center' })}
    
    <div style="text-align: center; margin: 40px 0;">
      ${ctaButton('View pricing', `${APP_URL}/pricing`)}
    </div>
    
    <!-- Premium Features Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, ${BG_LIGHT} 0%, ${BG_WHITE} 100%); padding: 28px; border-radius: 16px; border-left: 3px solid ${PRIMARY_ACCENT}; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);">
          ${h3('Premium includes', { align: 'left' })}
          <ul style="color: ${TEXT_GRAY}; line-height: 1.9; margin: 16px 0 0 0; padding-left: 20px; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <li style="margin-bottom: 8px;"><strong>Daily personalized prompts</strong> (7 days/week)</li>
            <li style="margin-bottom: 8px;"><strong>Unlimited reflection archive</strong></li>
            <li style="margin-bottom: 8px;"><strong>Weekly reflection</strong></li>
            <li style="margin-bottom: 8px;"><strong>Monthly reflection</strong></li>
            <li style="margin-bottom: 8px;"><strong>Export reflections</strong> (PDF/TXT)</li>
            <li style="margin-bottom: 8px;"><strong>Custom focus areas</strong> (unlimited)</li>
            <li><strong>Priority email support</strong> (24hr response)</li>
          </ul>
          
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin-top: 24px;">
            <tr>
              <td style="text-align: center; padding: 16px 0; border-top: 1px solid ${BORDER_COLOR};">
                <p style="margin: 0; color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  View pricing for current plans.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${paragraph('You can continue using Prompt & Pause with the free tier, or upgrade anytime from your dashboard settings.', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
    
    ${paragraph('You can keep using Prompt & Pause on the free tier, or return to Premium later.', { align: 'center' })}
  `

  return contentSection(bodyHTML)
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
      <p style="margin: 0; color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong style="color: ${TEXT_DARK}; font-weight: 600;">Your premium access will continue until the end of your current billing period.</strong> After that, you'll be switched to our free tier, but all your reflections and data will remain safe.
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
    
    <!-- Warning box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <strong style="font-weight: 600;">Important:</strong> This file contains sensitive personal information. Please store it securely and don't share it with anyone.
          </p>
        </td>
      </tr>
    </table>
    
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
 * Send support ticket confirmation email to user
 * 
 * @param email - User's email address
 * @param userName - User's name
 * @param subject - Support request subject
 * @param requestId - Support request ID
 * @returns Promise with email send result
 */
export async function sendSupportConfirmationEmail(
  email: string,
  userName: string,
  subject: string,
  requestId: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const html = await generateWithCustomization('support_confirmation', () => 
      generateSupportConfirmationEmailHTML(userName, subject, requestId)
    )

    const resolvedSubject = await getSubjectForTemplate('support_confirmation', { userName, subject, requestId })

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Support <${FROM_EMAIL}>`,
      to: email,
      subject: resolvedSubject,
      html,
    })

    if (error) {
      logger.error('email_support_confirmation_send_error', { error, email })
      await logEmailSend({
        userId: 'unknown',
        recipientEmail: email,
        subject: resolvedSubject,
        templateName: 'support_confirmation',
        provider: 'resend',
        status: 'failed',
        providerMessageId: null,
        errorMessage: error.message,
        metadata: { requestId },
      })
      return { success: false, error: error.message }
    }

    await logEmailSend({
      userId: 'unknown',
      recipientEmail: email,
      subject: resolvedSubject,
      templateName: 'support_confirmation',
      provider: 'resend',
      status: 'sent',
      providerMessageId: data?.id || null,
      metadata: { requestId },
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_support_confirmation_unexpected_error', { error, email })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send support request email to admin
 * 
 * @param params - Support request parameters
 * @returns Promise with email send result
 */
export async function sendSupportEmail(params: {
  category: string
  subject: string
  message: string
  priority: string
  userEmail: string
  userName: string
  tier: string
  requestId: string
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const supportAdminEmail = process.env.SUPPORT_ADMIN_EMAIL || 'support@promptandpause.com'
    const { category, subject, message, priority, userEmail, userName, tier, requestId } = params

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Support <${FROM_EMAIL}>`,
      to: supportAdminEmail,
      replyTo: userEmail,
      subject: `[Support - ${priority.toUpperCase()}] ${subject}`,
      html: generateSupportEmailHTML(params),
    })

    if (error) {
      logger.error('email_support_send_error', { error, userEmail })
      return { success: false, error: error.message }
    }
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_support_unexpected_error', { error })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Generate support email HTML for admin notification
 * Note: This template uses custom priority-colored header, so it doesn't use buildBaseEmail
 */
function generateSupportEmailHTML(params: {
  category: string
  subject: string
  message: string
  priority: string
  userEmail: string
  userName: string
  tier: string
  requestId: string
}): string {
  const { category, subject, message, priority, userEmail, userName, tier, requestId } = params
  
  const priorityColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981'
  const categoryEmoji = {
    general: '💬',
    bug: '🐛',
    billing: '💳',
    feature: '💡',
    account: '👤',
    other: '📋'
  }[category] || '📋'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>Support Request</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: ${BG_CREAM};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background: ${BG_CREAM}; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="700" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 700px; background: ${BG_WHITE}; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Priority Header (colored based on urgency) -->
              <tr>
                <td style="background: ${priorityColor}; padding: 24px; text-align: center;">
                  ${getLogoImgTag(true)}
                  <h2 style="color: white; margin: 16px 0 0 0; font-size: 20px; font-weight: 600;">
                    ${categoryEmoji} New Support Request
                  </h2>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">
                    Priority: ${priority.toUpperCase()} | Category: ${category}
                  </p>
                </td>
              </tr>
              
              <!-- Request Details -->
              <tr>
                <td style="padding: 40px;">
                  <h3 style="color: ${TEXT_DARK}; margin: 0 0 24px 0; font-size: 24px;">${subject}</h3>
                  
                  <!-- User Info Card -->
                  <div style="background: ${BG_LIGHT}; padding: 20px; margin: 24px 0; border-left: 4px solid ${priorityColor}; border-radius: 8px;">
                    <h4 style="color: ${TEXT_DARK}; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">User Information</h4>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 6px 0;">Name:</td>
                        <td style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; padding: 6px 0;">${userName}</td>
                      </tr>
                      <tr>
                        <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 6px 0;">Email:</td>
                        <td style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; padding: 6px 0;">
                          <a href="mailto:${userEmail}" style="color: ${PRIMARY_ACCENT}; text-decoration: none;">${userEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 6px 0;">Tier:</td>
                        <td style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; padding: 6px 0;">
                          <span style="background: ${tier === 'premium' ? '#fbbf24' : '#e5e7eb'}; color: ${tier === 'premium' ? '#78350f' : '#374151'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                            ${tier === 'premium' ? '👑 PREMIUM' : 'FREE'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 6px 0;">Request ID:</td>
                        <td style="color: ${TEXT_DARK}; font-size: 13px; font-family: monospace; padding: 6px 0;">${requestId}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Message -->
                  <div style="background: ${BG_LIGHT}; padding: 24px; margin: 24px 0; border-left: 4px solid ${PRIMARY_ACCENT}; border-radius: 8px;">
                    <h4 style="color: ${TEXT_DARK}; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Message</h4>
                    <p style="color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; margin: 0; white-space: pre-wrap;">${message}</p>
                  </div>
                  
                  <!-- Quick Actions -->
                  <div style="text-align: center; margin: 32px 0;">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 8px;">
                          ${standardButton({ href: `mailto:${userEmail}`, label: 'Reply to User' })}
                        </td>
                        <td style="padding: 0 8px;">
                          <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                            <tr>
                              <td style="border-radius: 8px; background: ${BG_LIGHT}; border: 1px solid ${PRIMARY_ACCENT};">
                                <a href="https://promptandpause.com/admin-panel" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 16px 32px; color: ${PRIMARY_ACCENT}; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.03em; border-radius: 8px;">
                                  View Admin Panel
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="background: ${BG_LIGHT}; padding: 24px 20px; border-top: 1px solid ${BORDER_COLOR};">
                  <p style="color: ${TEXT_MUTED}; font-size: 12px; margin: 0;">
                    ${APP_NAME} Support System • Respond within 24-48 hours
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Generate support ticket confirmation email for user
 */
function generateSupportConfirmationEmailHTML(
  name: string,
  subject: string,
  requestId: string
): string {
  const bodyHTML = `
    <h1 style="color: ${PRIMARY_ACCENT}; font-size: 28px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">We Got Your Support Request! 📬</h1>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
      Hi ${name},
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      Thank you for reaching out! We've received your support request and our team is looking into it. We'll get back to you within 24-48 hours with a solution or next steps.
    </p>
    
    <!-- Request Details Card -->
    <div style="background: ${BG_LIGHT}; padding: 24px; margin: 32px 0; border-left: 4px solid ${PRIMARY_ACCENT}; border-radius: 8px;">
      <h3 style="margin-top: 0; color: ${TEXT_DARK}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Request Details:</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 8px 0;">Request ID:</td>
          <td style="color: ${TEXT_DARK}; font-size: 14px; font-family: monospace; font-weight: 500; padding: 8px 0;">#${requestId}</td>
        </tr>
        <tr>
          <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 8px 0;">Subject:</td>
          <td style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; padding: 8px 0;">${subject}</td>
        </tr>
        <tr>
          <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 8px 0;">Status:</td>
          <td style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; padding: 8px 0;">🟡 Received</td>
        </tr>
      </table>
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0;">
      Keep this email safe—you can reference your Request ID #${requestId} if you need to follow up on this issue.
    </p>
    
    <div style="background: #e6f0ff; border-left: 4px solid ${PRIMARY_ACCENT}; padding: 16px 20px; margin: 32px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
        <strong style="color: ${PRIMARY_ACCENT}; font-weight: 600;">💡 Tip:</strong> If your issue is urgent, you can also reply to this email or reach out to our support team directly at <a href="mailto:support@promptandpause.com" style="color: ${PRIMARY_ACCENT}; text-decoration: none;">support@promptandpause.com</a>.
      </p>
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; margin: 32px 0 0 0; text-align: center;">
      Thanks for being part of the ${APP_NAME} community!
    </p>
  `

  return buildBaseEmail({
    preheader: `Support request #${requestId} received - We'll respond within 24-48 hours`,
    title: 'Support Request Received',
    bodyHTML
  })
}

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
    <h1 style="color: ${PRIMARY_ACCENT}; font-size: 28px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">Scheduled Maintenance Notice</h1>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
      Hi ${name},
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      We're writing to let you know about planned maintenance on ${APP_NAME}.
    </p>
    
    <!-- Maintenance Window Card -->
    <div style="background: #FEF3C7; padding: 24px; margin: 32px 0; border-left: 4px solid #F59E0B; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #78350F; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Maintenance Window</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td style="color: #92400E; font-size: 14px; padding: 8px 0;"><strong>Date:</strong></td>
          <td style="color: #78350F; font-size: 15px; font-weight: 500; padding: 8px 0;">${scheduledDate}</td>
        </tr>
        <tr>
          <td style="color: #92400E; font-size: 14px; padding: 8px 0;"><strong>Time:</strong></td>
          <td style="color: #78350F; font-size: 15px; font-weight: 500; padding: 8px 0;">${startTime} - ${endTime} UTC</td>
        </tr>
      </table>
    </div>
    
    ${affectedServices.length > 0 ? `
    <div style="background: ${BG_LIGHT}; padding: 24px; margin: 32px 0; border-left: 4px solid ${PRIMARY_ACCENT}; border-radius: 8px;">
      <h3 style="margin-top: 0; color: ${TEXT_DARK}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Affected Services</h3>
      <ul style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px;">
        ${servicesHTML}
      </ul>
    </div>
    ` : ''}
    
    ${description ? `
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0;">
      ${description}
    </p>
    ` : ''}
    
    <div style="background: #E0E7FF; border-left: 4px solid ${PRIMARY_ACCENT}; padding: 16px 20px; margin: 32px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #3730A3; font-size: 14px; line-height: 1.6;">
        <strong style="color: ${PRIMARY_ACCENT}; font-weight: 600;">Your data:</strong> Your reflections and personal information remain secure during maintenance.
      </p>
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0;">
      We apologize for any inconvenience this may cause and appreciate your patience as we work to improve ${APP_NAME}.
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; margin: 32px 0 0 0; text-align: center;">
      Questions? Contact us at <a href="mailto:support@promptandpause.com" style="color: ${PRIMARY_ACCENT}; text-decoration: none;">support@promptandpause.com</a>
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
    <h1 style="color: ${SECONDARY_ACCENT}; font-size: 28px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">Maintenance complete</h1>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
      Hi ${name},
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      Maintenance has been completed. ${APP_NAME} is available again.
    </p>
    
    <!-- Status Card -->
    <div style="background: #DCFCE7; padding: 24px; margin: 32px 0; border-left: 4px solid #22C55E; border-radius: 8px; text-align: center;">
      <p style="color: #14532D; font-size: 18px; font-weight: 600; margin: 0;">
        All Systems Operational
      </p>
      <p style="color: #15803D; font-size: 14px; margin: 8px 0 0 0;">
        Completed at ${completedAt}
      </p>
    </div>
    
    ${improvements ? `
    <div style="background: ${BG_LIGHT}; padding: 24px; margin: 32px 0; border-left: 4px solid ${PRIMARY_ACCENT}; border-radius: 8px;">
      <h3 style="margin-top: 0; color: ${TEXT_DARK}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">What's Improved</h3>
      <p style="color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; margin: 16px 0 0 0;">
        ${improvements}
      </p>
    </div>
    ` : ''}
    
    ${notes ? `
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0;">
      ${notes}
    </p>
    ` : ''}
    
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
    const loginUrl = `${APP_URL}/login`

    const html = emailWrapper(`
      ${h1('Admin account created')}
      
      ${paragraph(`Hi ${name},`)}
      
      ${paragraph(`Your admin account has been created for ${APP_NAME}. You now have ${roleDisplay} access to the admin panel.`)}
      
      ${infoBox(`
        <div style="margin-bottom: 12px;">
          <strong style="color: ${TEXT_DARK}; display: block; margin-bottom: 4px;">Your Login Credentials</strong>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: ${TEXT_GRAY}; font-size: 14px;">Email:</span><br>
          <strong style="color: ${TEXT_DARK}; font-size: 16px;">${email}</strong>
        </div>
        <div>
          <span style="color: ${TEXT_GRAY}; font-size: 14px;">Temporary Password:</span><br>
          <strong style="color: ${TEXT_DARK}; font-size: 16px; font-family: 'Courier New', monospace; background: ${BG_LIGHT}; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">${password}</strong>
        </div>
      `, 'info')}
      
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
      from: `${APP_NAME} <${FROM_EMAIL}>`,
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
    configured: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    hasApiKey: !!process.env.RESEND_API_KEY,
    hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
  }
}

