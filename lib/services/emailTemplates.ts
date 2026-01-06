/**
 * Professional Email Template System
 * Modern, sophisticated email templates matching the Prompt & Pause dashboard
 * Features soft reflection tones with calming sage/forest green palette
 */

const APP_URL = 'https://promptandpause.com'
const APP_NAME = 'Prompt & Pause'

// Brand Colors - Matching Dashboard Theme
// Light mode gradient: #f4f0eb (cream) → #a1a79e (sage) → #384c37 (forest)
export const BRAND_COLORS = {
  // Primary accent - Sage/Forest green tones
  primary: '#384c37',        // Forest green (main accent)
  primaryLight: '#4a6349',   // Lighter forest
  primaryDark: '#2a3a29',    // Darker forest
  
  // Secondary accent - Warm gold for CTAs
  accent: '#c9a227',         // Warm gold
  accentLight: '#d4b44a',    // Light gold
  
  // Background colors - Soft, calming tones
  backgroundDark: '#1e293b', // Slate dark (footer)
  backgroundAccent: '#0f172a', // Deep slate
  backgroundLight: '#f4f0eb', // Warm cream (main bg)
  backgroundPure: '#ffffff',  // Pure white (cards)
  backgroundSection: '#f8f6f3', // Soft cream (sections)
  backgroundMuted: '#a1a79e', // Sage muted
  
  // Text colors
  textDark: '#1e293b',       // Slate dark
  textGray: '#475569',       // Slate gray
  textLight: '#ffffff',      // White
  textMuted: '#94a3b8',      // Slate muted
  
  // Borders - Soft, subtle
  border: '#e2e8f0',         // Slate border
  borderLight: '#f1f5f9',    // Light slate
  borderAccent: '#384c37',   // Forest accent border
}

// Brand CDN Logo URL - Links to homepage
export const LOGO_URL = 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg'

/**
 * Professional Email Header with Logo - Links to homepage
 * Features soft gradient reflection effect
 */
export function emailHeader(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="center" style="padding: 32px 20px 24px 20px; background: linear-gradient(180deg, ${BRAND_COLORS.backgroundPure} 0%, ${BRAND_COLORS.backgroundLight} 100%);">
          <a href="${APP_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
            <img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 48px; width: auto; display: block;" />
          </a>
          <!-- Subtle reflection line -->
          <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, ${BRAND_COLORS.primary}, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Email Footer with soft reflection styling
 * All links point to promptandpause.com
 */
export function emailFooter(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <!-- Soft gradient transition -->
      <tr>
        <td style="height: 4px; background: linear-gradient(180deg, ${BRAND_COLORS.backgroundLight} 0%, ${BRAND_COLORS.backgroundDark} 100%);"></td>
      </tr>
      <tr>
        <td align="center" style="background: ${BRAND_COLORS.backgroundDark}; padding: 40px 20px;">
          <!-- Logo in footer -->
          <a href="${APP_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
            <img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 32px; width: auto; display: block; margin: 0 auto 20px; filter: brightness(0) invert(1); opacity: 0.9;" />
          </a>
          
          <!-- Navigation Links -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px;">
            <tr>
              <td style="padding: 0 12px;">
                <a href="${APP_URL}/dashboard" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLORS.textMuted}; text-decoration: none; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Dashboard</a>
              </td>
              <td style="color: ${BRAND_COLORS.textMuted}; opacity: 0.4;">•</td>
              <td style="padding: 0 12px;">
                <a href="${APP_URL}/pricing" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLORS.textMuted}; text-decoration: none; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Pricing</a>
              </td>
              <td style="color: ${BRAND_COLORS.textMuted}; opacity: 0.4;">•</td>
              <td style="padding: 0 12px;">
                <a href="${APP_URL}/privacy" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLORS.textMuted}; text-decoration: none; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Privacy</a>
              </td>
              <td style="color: ${BRAND_COLORS.textMuted}; opacity: 0.4;">•</td>
              <td style="padding: 0 12px;">
                <a href="${APP_URL}/contact" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLORS.textMuted}; text-decoration: none; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Contact</a>
              </td>
            </tr>
          </table>
          
          <!-- Tagline -->
          <p style="color: ${BRAND_COLORS.textLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0 0 8px 0; opacity: 0.9;">
            Pause. Reflect. Grow.
          </p>
          
          <!-- Copyright -->
          <p style="color: ${BRAND_COLORS.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; margin: 0; opacity: 0.7;">
            © 2026 ${APP_NAME}. All rights reserved.
          </p>
          
          <!-- Unsubscribe hint -->
          <p style="color: ${BRAND_COLORS.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; margin: 16px 0 0 0; opacity: 0.5;">
            Manage your email preferences in your <a href="${APP_URL}/dashboard/settings" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLORS.textMuted}; text-decoration: underline;">account settings</a>
          </p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional CTA Button with soft shadow and hover-ready styling
 * Uses warm gold accent for high visibility
 */
export function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 10px; background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 100%); box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 16px 44px; color: ${BRAND_COLORS.textLight}; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Info Box with soft reflection styling
 * Features subtle gradient and forest green accent border
 */
export function infoBox(content: string, bgColor: string = BRAND_COLORS.backgroundSection): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, ${bgColor} 0%, ${BRAND_COLORS.backgroundPure} 100%); padding: 24px 28px; border-left: 3px solid ${BRAND_COLORS.primary}; border-radius: 0 12px 12px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
          ${content}
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Email Template Wrapper
 * Modern, clean design with soft reflection tones
 */
export function emailWrapper(content: string, options: {
  preheader?: string
  title?: string
} = {}): string {
  const { preheader, title = APP_NAME } = options
  
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
      <![endif]-->
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
      <title>${title}</title>
      
      <!-- System Fonts Stack -->
      <style type="text/css">
        /* Reset and base styles */
        body, table, td, tr { border-collapse: collapse; vertical-align: top; }
        * { line-height: inherit; }
        a[x-apple-data-detectors=true] { color: inherit !important; text-decoration: none !important; }
        table, td { color: ${BRAND_COLORS.textDark}; }
        
        /* Responsive styles */
        @media only screen and (min-width: 620px) {
          .u-row { width: 600px !important; }
          .u-row .u-col { vertical-align: top; }
          .u-row .u-col-100 { width: 600px !important; }
        }
        @media only screen and (max-width: 620px) {
          .u-row-container { max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
          .u-row { width: 100% !important; }
          .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
          .u-row .u-col > div { margin: 0 auto; }
          .u-row .u-col img { max-width: 100% !important; }
        }
        @media (max-width: 480px) {
          .hide-mobile { max-height: 0; overflow: hidden; display: none !important; }
          .mobile-center { text-align: center !important; }
          .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
        }
      </style>
    </head>
    
    <body style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: ${BRAND_COLORS.backgroundLight}; color: ${BRAND_COLORS.textDark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      ${preheader ? `
        <!-- Preheader text (hidden) -->
        <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
        <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
      ` : ''}
      
      <!--[if IE]><div class="ie-container"><![endif]-->
      <!--[if mso]><div class="mso-container"><![endif]-->
      
      <!-- Outer wrapper with soft cream background -->
      <table role="presentation" style="border-collapse: collapse; table-layout: fixed; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; vertical-align: top; min-width: 320px; margin: 0 auto; background-color: ${BRAND_COLORS.backgroundLight}; width: 100%;" cellpadding="0" cellspacing="0">
        <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word; border-collapse: collapse !important; vertical-align: top; padding: 20px 0;">
              <!--[if (mso)|(IE)]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: ${BRAND_COLORS.backgroundLight};"><![endif]-->
              
              <!-- Email container with max-width -->
              <table role="presentation" align="center" style="max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.backgroundPure}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);" cellpadding="0" cellspacing="0" width="100%">
                <tbody>
                  <tr>
                    <td>
                      <!-- Header -->
                      ${emailHeader()}
                      
                      <!-- Main Content -->
                      ${content}
                      
                      <!-- Footer -->
                      ${emailFooter()}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
      
      <!--[if mso]></div><![endif]-->
      <!--[if IE]></div><![endif]-->
    </body>
    </html>
  `
}

/**
 * Professional Typography - Clean, modern system fonts
 */
export function h1(text: string, options: { color?: string; align?: string } = {}): string {
  const { color = BRAND_COLORS.primary, align = 'center' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 12px 0;">
          <h1 style="color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 26px; line-height: 1.3; margin: 0; font-weight: 700; letter-spacing: -0.02em;">${text}</h1>
        </td>
      </tr>
    </table>
  `
}

export function h2(text: string, options: { color?: string; align?: string } = {}): string {
  const { color = BRAND_COLORS.textDark, align = 'center' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 10px 0;">
          <h2 style="color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; line-height: 1.35; margin: 0; font-weight: 600;">${text}</h2>
        </td>
      </tr>
    </table>
  `
}

export function h3(text: string, options: { color?: string; align?: string } = {}): string {
  const { color = BRAND_COLORS.primary, align = 'left' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 8px 0;">
          <h3 style="color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 17px; line-height: 1.4; margin: 0; font-weight: 600;">${text}</h3>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Paragraph - Clean, readable text
 */
export function paragraph(text: string, options: { color?: string; align?: string; fontSize?: string } = {}): string {
  const { color = BRAND_COLORS.textGray, align = 'left', fontSize = '15px' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 6px 0;">
          <p style="color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: ${fontSize}; line-height: 1.65; margin: 0;">${text}</p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Content Section - Clean card-style layout
 */
export function contentSection(content: string, backgroundColor: string = BRAND_COLORS.backgroundPure): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td style="background-color: ${backgroundColor}; padding: 32px 28px;" class="mobile-padding">
          ${content}
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional List - Clean, readable bullet points
 */
export function list(items: string[]): string {
  const listItems = items.map(item => `<li style="color: ${BRAND_COLORS.textGray}; margin-bottom: 10px; font-size: 15px; line-height: 1.5;">${item}</li>`).join('')
  return `<ul style="color: ${BRAND_COLORS.textGray}; line-height: 1.6; padding-left: 20px; margin: 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${listItems}</ul>`
}

/**
 * Alert Box - Soft, modern styling for notices
 */
export function alertBox(content: string, type: 'info' | 'warning' | 'success' = 'info'): string {
  const colors = {
    info: { bg: '#f0f9ff', border: BRAND_COLORS.primary, text: BRAND_COLORS.textDark },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' }
  }
  const color = colors[type]
  
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 20px 0;">
      <tr>
        <td style="background: ${color.bg}; border-left: 3px solid ${color.border}; padding: 16px 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: ${color.text}; font-size: 14px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${content}</p>
        </td>
      </tr>
    </table>
  `
}

