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


// Brand colors from new professional template system
const BG_CREAM = BRAND_COLORS.backgroundLight // Primary background
const BG_WHITE = BRAND_COLORS.backgroundPure // Card/content background 
const BG_LIGHT = BRAND_COLORS.backgroundSection // Secondary background
const BORDER_COLOR = BRAND_COLORS.borderLight // Light borders
const TEXT_DARK = BRAND_COLORS.textDark // Primary text
const TEXT_GRAY = BRAND_COLORS.textGray // Secondary text
const TEXT_MUTED = BRAND_COLORS.textMuted // Muted text
const PRIMARY_ACCENT = BRAND_COLORS.primary // Gold accent (primary)
const SECONDARY_ACCENT = BRAND_COLORS.primaryLight // Light gold accent

// Logo URL (hosted on Vercel Blob Storage)
const LOGO_URL = 'https://yhrnbdl0wz3eilae.public.blob.vercel-storage.com/prompt%26pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw.svg'

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
      /(<!-- Header with Logo -->.*?<\/td>)/s,
      `$1\n<tr><td style="padding: 16px 20px; text-align: center;">${customization.custom_header_text}</td></tr>`
    )
  }
  
  // Replace footer text if provided
  if (customization.custom_footer_text) {
    customized = customized.replace(
      /(<!-- Footer -->.*?)<p style="color: [^"]+; font-size: 13px[^>]+>[^<]+<\/p>/s,
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
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = name || email.split('@')[0]
    const html = await generateWithCustomization('welcome', () => 
      generateWelcomeEmailHTML(displayName)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Welcome to ${APP_NAME}! 🌟`,
      html,
    })

    if (error) {
      logger.error('email_welcome_send_error', { error, email })
      return { success: false, error: error.message }
    }

    console.log('Welcome email sent successfully:', data?.id)
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
      console.error('RESEND_API_KEY not configured')
      await logEmailDelivery(userId, 'daily_prompt', email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('daily_prompt', () => 
      generateDailyPromptEmailHTML(displayName, prompt)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Your Daily Reflection Prompt ✨`,
      html,
    })

    if (error) {
      logger.error('email_prompt_send_error', { error, email, userId })
      await logEmailDelivery(userId, 'daily_prompt', email, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    console.log('Daily prompt email sent successfully:', data?.id)
    await logEmailDelivery(userId, 'daily_prompt', email, 'sent', data?.id || null)
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_prompt_unexpected_error', { error, email, userId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery(userId, 'daily_prompt', email, 'failed', null, errorMessage)
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
      console.error('RESEND_API_KEY not configured')
      await logEmailDelivery(userId, 'weekly_digest', email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('weekly_digest', () => 
      generateWeeklyDigestEmailHTML(displayName, digestData)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Your Weekly Reflection Summary 📊`,
      html,
    })

    if (error) {
      logger.error('email_digest_send_error', { error, email, userId })
      await logEmailDelivery(userId, 'weekly_digest', email, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    console.log('Weekly digest email sent successfully:', data?.id)
    await logEmailDelivery(userId, 'weekly_digest', email, 'sent', data?.id || null)
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_digest_unexpected_error', { error, email, userId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery(userId, 'weekly_digest', email, 'failed', null, errorMessage)
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
      console.error('RESEND_API_KEY not configured')
      await logEmailDelivery(userId, 'trial_expired', email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]

    const html = await generateWithCustomization('trial_expired', () => 
      generateTrialExpiredEmailHTML(displayName)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Your 7-Day Premium Trial Has Ended`,
      html,
    })

    if (error) {
      logger.error('email_trial_expired_send_error', { error, email, userId })
      await logEmailDelivery(userId, 'trial_expired', email, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    console.log('Trial expired email sent successfully:', data?.id)
    await logEmailDelivery(userId, 'trial_expired', email, 'sent', data?.id || null)
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_trial_expired_unexpected_error', { error, email, userId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery(userId, 'trial_expired', email, 'failed', null, errorMessage)
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
      console.error('RESEND_API_KEY not configured')
      const emailType = type === 'confirmation' ? 'subscription_confirm' : 'subscription_cancelled'
      await logEmailDelivery(userId, emailType, email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const emailType = type === 'confirmation' ? 'subscription_confirm' : 'subscription_cancelled'

    const subject = type === 'confirmation'
      ? `Welcome to Premium! 🎉`
      : `Subscription Cancelled`

    const html = await generateWithCustomization(
      emailType === 'subscription_confirm' ? 'subscription_confirm' : 'subscription_cancelled',
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
      return { success: false, error: error.message }
    }

    console.log(`${type} email sent successfully:`, data?.id)
    await logEmailDelivery(userId, emailType, email, 'sent', data?.id || null)
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_subscription_unexpected_error', { error, email, userId, type, planName })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const emailType = type === 'confirmation' ? 'subscription_confirm' : 'subscription_cancelled'
    await logEmailDelivery(userId, emailType, email, 'failed', null, errorMessage)
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
      console.error('RESEND_API_KEY not configured')
      await logEmailDelivery(userId, 'data_export', email, 'failed', null, 'API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('data_export', () => 
      generateDataExportEmailHTML(displayName)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Your Data Export from ${APP_NAME} 📦`,
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
      return { success: false, error: error.message }
    }

    console.log('Data export email sent successfully:', data?.id)
    await logEmailDelivery(userId, 'data_export', email, 'sent', data?.id || null)
    
    return { success: true, emailId: data?.id }
  } catch (error) {
    logger.error('email_data_export_unexpected_error', { error, email, userId })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logEmailDelivery(userId, 'data_export', email, 'failed', null, errorMessage)
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
  const welcomeContent = `
    ${h1(`Welcome to ${APP_NAME}! 🌟`)}
    
    ${paragraph(`Hi ${name},`)}
    
    ${paragraph('Welcome to your daily reflection journey! We\'re so glad you\'re here.')}
    
    ${paragraph(`${APP_NAME} is designed to help you pause, reflect, and connect with yourself through guided daily prompts. Each day, you\'ll receive a thoughtful question to inspire meaningful self-reflection.`)}
    
    ${infoBox(`
      ${h3('Getting Started:', { align: 'left' })}
      <ul style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px; font-family: 'trebuchet ms', geneva;">
        <li style="margin-bottom: 8px;">Complete your onboarding to personalize your experience</li>
        <li style="margin-bottom: 8px;">Receive your first daily prompt</li>
        <li style="margin-bottom: 8px;">Reflect, write, and track your emotional journey</li>
        <li>Review your progress in your dashboard</li>
      </ul>
    `)}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Go to Dashboard' })}
    </div>
    
    ${paragraph('If you have any questions, just reply to this email. We\'re here to help!', { align: 'center', fontSize: '14px', color: TEXT_MUTED })}
  `

  return contentSection(welcomeContent)
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
          <span style="display: inline-block; font-size: 12px; color: ${PRIMARY_ACCENT}; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; background: rgba(211, 157, 53, 0.1); padding: 8px 16px; border-radius: 20px; font-family: Rubik, sans-serif;">
            ${today}
          </span>
        </td>
      </tr>
    </table>
    
    ${h1('✨ Your Daily Reflection Prompt')}
    
    ${paragraph(`Good day, ${name}! 👋`, { align: 'center' })}
    
    ${paragraph('Take a moment to pause and reflect on today\'s question:', { align: 'center', fontSize: '15px' })}
    
    <!-- Professional Prompt Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background: ${BG_LIGHT}; padding: 32px 24px; border-radius: 12px; border: 1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <p style="font-size: 11px; color: ${PRIMARY_ACCENT}; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; font-weight: 600; font-family: Rubik, sans-serif;">Today's Prompt</p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="font-size: 20px; color: ${TEXT_DARK}; line-height: 1.6; margin: 0; font-weight: 400; font-style: italic; font-family: 'trebuchet ms', geneva;">
                  "${prompt}"
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${paragraph('Set aside a few minutes today to explore this question. There are no right or wrong answers—just your authentic thoughts and feelings.', { align: 'center', fontSize: '14px' })}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Start Reflecting ✍️' })}
    </div>
    
    ${infoBox(`
      <p style="margin: 0; color: ${TEXT_GRAY}; font-size: 14px; line-height: 1.6; font-family: 'trebuchet ms', geneva;">
        <strong style="color: ${TEXT_DARK}; font-weight: 600;">💡 Tip:</strong> Try writing for at least 3-5 minutes without overthinking. Let your thoughts flow naturally.
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
    .map(({ tag, count }) => `<span style="display: inline-block; background: #e6f0ff; color: ${PRIMARY_ACCENT}; padding: 6px 12px; border-radius: 20px; margin: 4px; font-size: 14px;">${tag} (${count})</span>`)
    .join('')

  const moodEmojis = digest.moodDistribution
    .map(({ mood, count }) => `${mood} (${count})`)
    .join(' • ')

  const bodyHTML = `
    <h1 style="color: ${PRIMARY_ACCENT}; font-size: 28px; margin: 0 0 16px 0; font-weight: 600; text-align: center;">Your Week in Review 📊</h1>
    <p style="color: ${TEXT_MUTED}; font-size: 14px; margin: 0 0 32px 0; text-align: center;">
      ${new Date(digest.weekStart).toLocaleDateString('en-GB')} - ${new Date(digest.weekEnd).toLocaleDateString('en-GB')}
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">Hi ${name},</p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      Here's a summary of your reflection journey this week:
    </p>
    
    <div style="background: ${BG_LIGHT}; padding: 32px; border-radius: 12px; margin: 32px 0; border: 1px solid ${BORDER_COLOR};">
      <div style="text-align: center;">
        <div style="margin-bottom: 24px;">
          <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Reflections Completed</p>
          <p style="color: ${PRIMARY_ACCENT}; font-size: 36px; font-weight: 700; margin: 0;">${digest.totalReflections}</p>
        </div>
        <div style="margin-bottom: 24px;">
          <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Current Streak</p>
          <p style="color: ${PRIMARY_ACCENT}; font-size: 36px; font-weight: 700; margin: 0;">${digest.currentStreak} days 🔥</p>
        </div>
        <div>
          <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Average Words per Reflection</p>
          <p style="color: ${PRIMARY_ACCENT}; font-size: 36px; font-weight: 700; margin: 0;">${digest.averageWordCount}</p>
        </div>
      </div>
    </div>
    
    ${digest.topTags.length > 0 ? `
    <div style="margin: 32px 0;">
      <h3 style="color: ${TEXT_DARK}; font-size: 16px; margin: 0 0 16px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Top Themes</h3>
      <div style="text-align: center;">${topTagsHTML}</div>
    </div>
    ` : ''}
    
    ${digest.moodDistribution.length > 0 ? `
    <div style="margin: 32px 0;">
      <h3 style="color: ${TEXT_DARK}; font-size: 16px; margin: 0 0 16px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Moods This Week</h3>
      <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; text-align: center;">${moodEmojis}</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard/archive', label: 'View Full Archive' })}
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; margin: 32px 0 0 0; text-align: center;">
      Keep up the great work! 🌟
    </p>
  `

  return buildBaseEmail({
    preheader: `Your weekly summary: ${digest.totalReflections} reflections, ${digest.currentStreak} day streak`,
    title: 'Your Weekly Reflection Summary',
    bodyHTML
  })
}

/**
 * Generate subscription confirmation email HTML
 */
function generateSubscriptionConfirmationHTML(name: string, planName: string): string {
  const bodyHTML = `
    <h1 style="color: ${PRIMARY_ACCENT}; font-size: 32px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">🎉 Welcome to Premium!</h1>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0; text-align: center;">Hi ${name},</p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      Thank you for upgrading to ${planName}! Your subscription is now active, and you have full access to all premium features.
    </p>
    
    <div style="background: ${BG_LIGHT}; padding: 24px; margin: 32px 0; border-radius: 12px; border-left: 4px solid ${PRIMARY_ACCENT};">
      <h3 style="margin-top: 0; color: ${TEXT_DARK}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Premium Features Unlocked:</h3>
      <ul style="color: ${TEXT_GRAY}; line-height: 2; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px;">
        <li>Unlimited AI-generated personalized prompts</li>
        <li>Advanced mood tracking and insights</li>
        <li>Export your reflections</li>
        <li>Priority email support</li>
        <li>Weekly digest reports</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Explore Premium Features' })}
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; margin: 32px 0 0 0; text-align: center;">
      You can manage your subscription anytime from your <a href="https://promptandpause.com/dashboard/settings" target="_blank" rel="noopener noreferrer" style="color: ${PRIMARY_ACCENT}; text-decoration: none;">settings page</a>.
    </p>
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
    ${h1('Your 7-Day Premium Trial Has Ended', { align: 'center' })}
    
    ${paragraph(`Hi ${name},`, { align: 'left' })}
    
    ${paragraph(
      'Your 7-day premium trial of Prompt & Pause has come to an end. We hope you enjoyed exploring all the premium features!',
      { align: 'left' }
    )}
    
    ${infoBox(`
      ${h3('What happens now?', { align: 'left', color: TEXT_DARK })}
      ${paragraph(
        'You\'ve been moved to our <strong>Free tier</strong>, which still gives you access to core features:',
        { align: 'left', color: TEXT_GRAY }
      )}
      <ul style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px; font-family: 'trebuchet ms', geneva;">
        <li style="margin-bottom: 8px;">3 personalized prompts per week</li>
        <li style="margin-bottom: 8px;">Basic mood tracking</li>
        <li style="margin-bottom: 8px;">Access to last 50 reflections</li>
        <li>Email delivery at your chosen time</li>
      </ul>
    `)}
    
    ${paragraph(
      'Want to continue enjoying daily prompts, unlimited archive access, weekly insights, and more?',
      { align: 'center', fontSize: '16px' }
    )}
    
    <div style="text-align: center; margin: 40px 0;">
      ${ctaButton('Upgrade to Premium', `${APP_URL}/homepage/pricing`)}
    </div>
    
    <!-- Premium Features Reminder -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background: ${BG_LIGHT}; padding: 24px; border-radius: 12px; border-left: 4px solid ${PRIMARY_ACCENT};">
          ${h3('Premium Features You\'ll Unlock:', { align: 'left', color: PRIMARY_ACCENT })}
          <ul style="color: ${TEXT_GRAY}; line-height: 2; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px; font-family: 'trebuchet ms', geneva;">
            <li style="margin-bottom: 8px;"><strong>Daily personalized prompts</strong> (7 days/week)</li>
            <li style="margin-bottom: 8px;"><strong>Unlimited reflection archive</strong></li>
            <li style="margin-bottom: 8px;"><strong>Weekly AI-generated insights</strong></li>
            <li style="margin-bottom: 8px;"><strong>Advanced mood analytics & trends</strong></li>
            <li style="margin-bottom: 8px;"><strong>Export reflections</strong> (PDF/TXT)</li>
            <li style="margin-bottom: 8px;"><strong>Custom focus areas</strong> (unlimited)</li>
            <li><strong>Priority email support</strong> (24hr response)</li>
          </ul>
          
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin-top: 24px;">
            <tr>
              <td style="text-align: center; padding: 16px 0; border-top: 1px solid ${BORDER_COLOR};">
                <p style="margin: 0; color: ${TEXT_DARK}; font-size: 18px; font-weight: 600; font-family: Rubik, sans-serif;">
                  Only £12/month or £99/year
                </p>
                <p style="margin: 4px 0 0 0; color: ${PRIMARY_ACCENT}; font-size: 14px; font-family: 'trebuchet ms', geneva;">
                  Save £45 with annual plan
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${paragraph(
      'You can continue using Prompt & Pause with the free tier, or upgrade anytime from your dashboard settings.',
      { align: 'center', fontSize: '14px', color: TEXT_MUTED }
    )}
    
    ${paragraph(
      'Thank you for trying Prompt & Pause Premium. We hope to see you back soon! 🌟',
      { align: 'center', fontSize: '15px' }
    )}
  `

  return contentSection(bodyHTML)
}

/**
 * Generate subscription cancellation email HTML
 */
function generateSubscriptionCancellationHTML(name: string, planName: string): string {
  const bodyHTML = `
    <h1 style="color: ${TEXT_DARK}; font-size: 28px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">Subscription Cancelled</h1>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">Hi ${name},</p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      We've received your request to cancel your ${planName} subscription. We're sorry to see you go!
    </p>
    
    <div style="background: ${BG_LIGHT}; padding: 24px; margin: 32px 0; border-left: 4px solid ${PRIMARY_ACCENT}; border-radius: 8px;">
      <p style="margin: 0; color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8;">
        <strong style="color: ${TEXT_DARK}; font-weight: 600;">Your premium access will continue until the end of your current billing period.</strong> After that, you'll be switched to our free tier, but all your reflections and data will remain safe.
      </p>
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0;">
      If you change your mind, you can resubscribe anytime from your settings page. We'd love to have you back!
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard/settings', label: 'View Account Settings' })}
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; margin: 32px 0 0 0; text-align: center;">
      We'd love to hear your feedback. Reply to this email to let us know how we can improve.
    </p>
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
  const bodyHTML = `
    <h1 style="color: ${PRIMARY_ACCENT}; font-size: 32px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">Your Data Export is Ready 📦</h1>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
      Hi ${name},
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      We've compiled all your data from ${APP_NAME} into a comprehensive PDF document. You'll find it attached to this email.
    </p>
    
    <div style="background: ${BG_LIGHT}; padding: 24px; margin: 32px 0; border-left: 4px solid ${PRIMARY_ACCENT}; border-radius: 8px;">
      <h3 style="margin-top: 0; color: ${TEXT_DARK}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">What's Included:</h3>
      <ul style="color: ${TEXT_GRAY}; line-height: 1.8; margin: 16px 0 0 0; padding-left: 20px; font-size: 15px;">
        <li style="margin-bottom: 8px;">Your profile information</li>
        <li style="margin-bottom: 8px;">All your reflections and journal entries</li>
        <li style="margin-bottom: 8px;">Mood tracking data</li>
        <li style="margin-bottom: 8px;">Account preferences and settings</li>
        <li>Usage statistics</li>
      </ul>
    </div>
    
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px 20px; margin: 32px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">
        <strong style="font-weight: 600;">⚠️ Important:</strong> This file contains sensitive personal information. Please store it securely and don't share it with anyone.
      </p>
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0;">
      If you have any questions about your data or need assistance, please don't hesitate to reply to this email.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      ${standardButton({ href: 'https://promptandpause.com/dashboard/settings', label: 'Go to Dashboard' })}
    </div>
  `

  const customFooter = `
    <p style="color: ${TEXT_GRAY}; font-size: 13px; margin: 0 0 8px 0;">
      ${APP_NAME} • Your data, your privacy
    </p>
    <p style="color: ${TEXT_MUTED}; font-size: 12px; margin: 0;">
      © 2025 ${APP_NAME}. All rights reserved.
    </p>
    <p style="color: ${TEXT_MUTED}; font-size: 12px; margin: 8px 0 0 0;">
      Questions? Contact us at <a href="mailto:support@promptandpause.com" style="color: ${PRIMARY_ACCENT}; text-decoration: none;">support@promptandpause.com</a>
    </p>
  `

  return buildBaseEmail({
    preheader: 'Your data export PDF is attached to this email',
    title: 'Your Data Export',
    bodyHTML,
    footerHTML: customFooter
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
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const html = await generateWithCustomization('support_confirmation', () => 
      generateSupportConfirmationEmailHTML(userName, subject, requestId)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Support <${FROM_EMAIL}>`,
      to: email,
      subject: `We received your support request #${requestId}`,
      html,
    })

    if (error) {
      logger.error('email_support_confirmation_send_error', { error, email })
      return { success: false, error: error.message }
    }

    console.log('Support confirmation email sent successfully:', data?.id)
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
      console.error('RESEND_API_KEY not configured')
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

    console.log('Support email sent successfully:', data?.id)
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
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('maintenance_start', () => 
      generateMaintenanceStartEmailHTML(displayName, details)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Scheduled Maintenance: ${details.scheduledDate}`,
      html,
    })

    if (error) {
      logger.error('email_maintenance_start_send_error', { error, email })
      return { success: false, error: error.message }
    }

    console.log('Maintenance start email sent successfully:', data?.id)
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
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const html = await generateWithCustomization('maintenance_complete', () => 
      generateMaintenanceCompleteEmailHTML(displayName, details)
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Maintenance Complete - All Systems Operational`,
      html,
    })

    if (error) {
      logger.error('email_maintenance_complete_send_error', { error, email })
      return { success: false, error: error.message }
    }

    console.log('Maintenance complete email sent successfully:', data?.id)
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
    <h1 style="color: ${PRIMARY_ACCENT}; font-size: 28px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">🛠️ Scheduled Maintenance Notice</h1>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
      Hi ${name},
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      We're writing to inform you about planned maintenance on ${APP_NAME}. We'll be making improvements to ensure you continue to have the best experience possible.
    </p>
    
    <!-- Maintenance Window Card -->
    <div style="background: #FEF3C7; padding: 24px; margin: 32px 0; border-left: 4px solid #F59E0B; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #78350F; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">⏰ Maintenance Window</h3>
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
        <strong style="color: ${PRIMARY_ACCENT}; font-weight: 600;">🔒 Your Data is Safe:</strong> All your reflections and personal information remain secure during maintenance. No data will be lost.
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
    <h1 style="color: ${SECONDARY_ACCENT}; font-size: 28px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">✅ Maintenance Complete!</h1>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
      Hi ${name},
    </p>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 0 0 32px 0;">
      Great news! Our scheduled maintenance has been completed successfully. All ${APP_NAME} services are now fully operational and running smoothly.
    </p>
    
    <!-- Success Card -->
    <div style="background: #DCFCE7; padding: 24px; margin: 32px 0; border-left: 4px solid #22C55E; border-radius: 8px; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 16px 0;">🎉</p>
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
      ${standardButton({ href: 'https://promptandpause.com/dashboard', label: 'Continue Your Journey' })}
    </div>
    
    <p style="color: ${TEXT_GRAY}; font-size: 16px; line-height: 1.8; margin: 32px 0 0 0; text-align: center;">
      Thank you for your patience and understanding! 🙏
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
  fullName: string,
  password: string,
  role: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const roleDisplay = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Employee'
    const loginUrl = `${APP_URL}/auth/signin`

    const html = emailWrapper(`
      ${h1('Welcome to the Team! 🎉')}
      
      ${paragraph(`Hi ${fullName},`)}
      
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
      
      ${paragraph('Welcome aboard! 🚀')}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} Admin <${FROM_EMAIL}>`,
      to: email,
      subject: `Your ${APP_NAME} Admin Account - Action Required`,
      html,
    })

    if (error) {
      logger.error('email_admin_credentials_send_error', { error, email })
      return { success: false, error: error.message }
    }

    console.log('Admin credentials email sent successfully:', data?.id)
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
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const displayName = userName || email.split('@')[0]
    const upgradeUrl = `${APP_URL}/dashboard/subscription`

    const html = emailWrapper(`
      ${h1('Your 7-Day Premium Trial Has Ended')}
      
      ${paragraph('Hi ' + displayName + ',')}
      
      ${paragraph('Your 7-day premium trial has come to an end. We hope you enjoyed exploring all the premium features!')}
      
      ${infoBox('<strong>What happens now?</strong><br/>• Your account has been switched to our Free tier<br/>• You can still use all core features<br/>• Upgrade anytime to regain premium access')}
      
      ${h2('Premium Features You Will Miss:')}
      
      ${paragraph('• <strong>Custom Focus Areas:</strong> Create personalized reflection topics<br/>• <strong>Weekly AI Insights:</strong> Get deep analysis of your reflections<br/>• <strong>Advanced Analytics:</strong> Track patterns and growth over time<br/>• <strong>Priority Support:</strong> Get help when you need it')}
      
      ${ctaButton('Upgrade to Premium', upgradeUrl)}
      
      ${paragraph('Thank you for trying Prompt & Pause Premium. We would love to have you back!')}
      
      ${paragraph('If you have any questions, just reply to this email.')}
    `)

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Your Premium Trial Has Ended - Upgrade to Continue`,
      html,
    })

    if (error) {
      logger.error('email_trial_expiration_send_error', { error, email })
      return { success: false, error: error.message }
    }

    console.log('Trial expiration email sent successfully:', data?.id)
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
