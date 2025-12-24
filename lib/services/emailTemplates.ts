/**
 * Professional Email Template System
 * Sophisticated, responsive email templates based on the massage therapy design
 * Adapted for Prompt & Pause branding with premium styling
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promptandpause.com'
const APP_NAME = 'Prompt & Pause'

// Professional Brand Colors (adapted from massage template)
export const BRAND_COLORS = {
  // Primary gold accent (from massage template d39d35)
  primary: '#d39d35',
  primaryLight: '#e6b84d',
  primaryDark: '#b8821c',
  
  // Background colors (adapted from template)
  backgroundDark: '#302f2f', // Outer background
  backgroundAccent: '#181818', // Dark sections
  backgroundLight: '#ffffff', // Light cream sections  
  backgroundPure: '#ffffff', // Pure white content
  backgroundSection: '#fff7f3', // Section backgrounds
  
  // Text colors
  textDark: '#000000',
  textGray: '#545454',
  textLight: '#ffffff',
  textMuted: '#cfcfcf',
  
  // Borders
  border: '#dfdfdf',
  borderLight: '#e5e7eb',
}

// Professional Logo URL
export const LOGO_URL = 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg'

/**
 * Professional Email Header with Logo (table-based for email client compatibility)
 */
export function emailHeader(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="center" style="padding: 24px 20px 16px 20px; background: ${BRAND_COLORS.backgroundPure};">
          <img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 50px; width: auto; display: block;" />
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Email Footer (table-based with social links)
 */
export function emailFooter(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="center" style="background: ${BRAND_COLORS.backgroundDark}; padding: 40px 20px;">
          <!-- Social Icons Row -->
          <div style="margin-bottom: 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="https://promptandpause.com/dashboard" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLORS.textMuted}; text-decoration: none; font-size: 14px;">Dashboard</a>
                </td>
                <td style="padding: 0 8px; color: ${BRAND_COLORS.textMuted};">|</td>
                <td style="padding: 0 8px;">
                  <a href="https://promptandpause.com/homepage/privacy" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLORS.textMuted}; text-decoration: none; font-size: 14px;">Privacy</a>
                </td>
                <td style="padding: 0 8px; color: ${BRAND_COLORS.textMuted};">|</td>
                <td style="padding: 0 8px;">
                  <a href="https://promptandpause.com/homepage/contact" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLORS.textMuted}; text-decoration: none; font-size: 14px;">Contact</a>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Company Info -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tr>
              <td align="center" style="color: ${BRAND_COLORS.textMuted}; font-family: 'trebuchet ms', geneva; font-size: 16px; line-height: 24px; padding: 5px 0;">
                ${APP_NAME} • Pause. Reflect. Grow.
              </td>
            </tr>
            <tr>
              <td align="center" style="color: ${BRAND_COLORS.textMuted}; font-family: 'trebuchet ms', geneva; font-size: 16px; line-height: 24px; padding: 5px 0;">
                © 2026 ${APP_NAME}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional CTA Button (table-based for email client compatibility)
 */
export function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 30px auto;">
      <tr>
        <td style="border-radius: 8px; background: ${BRAND_COLORS.primary};">
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 16px 40px; color: ${BRAND_COLORS.textLight}; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.03em; border-radius: 8px; font-family: Rubik, sans-serif;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Info Box (table-based with left accent border)
 */
export function infoBox(content: string, bgColor: string = BRAND_COLORS.backgroundSection): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 25px 0;">
      <tr>
        <td style="background: ${bgColor}; padding: 24px; border-left: 4px solid ${BRAND_COLORS.primary}; border-radius: 8px;">
          ${content}
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Email Template Wrapper (based on massage template structure)
 */
export function emailWrapper(content: string, options: {
  preheader?: string
  title?: string
} = {}): string {
  const { preheader, title = APP_NAME } = options
  
  return `
    <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
      
      <!-- Google Fonts -->
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css?family=Rubik:400,700&display=swap" rel="stylesheet" type="text/css">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css">
      <!--<![endif]-->
      
      <style type="text/css">
        @media only screen and (min-width: 620px) {
          .u-row { width: 600px !important; }
          .u-row .u-col { vertical-align: top; }
          .u-row .u-col-50 { width: 300px !important; }
          .u-row .u-col-100 { width: 600px !important; }
        }
        @media only screen and (max-width: 620px) {
          .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
          .u-row { width: 100% !important; }
          .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
          .u-row .u-col > div { margin: 0 auto; }
          .u-row .u-col img { max-width: 100% !important; }
        }
        @media (max-width: 480px) {
          .hide-mobile { max-height: 0px; overflow: hidden; display: none !important; }
          .mobile-center { text-align: center !important; }
        }
        body,table,td,tr{border-collapse:collapse;vertical-align:top}*{line-height:inherit}a[x-apple-data-detectors=true]{color:inherit!important;text-decoration:none!important}
        table, td { color: ${BRAND_COLORS.textDark}; }
      </style>
    </head>
    
    <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: ${BRAND_COLORS.backgroundDark};color: ${BRAND_COLORS.textDark}">
      ${preheader ? `
        <!-- Preheader text (hidden from view) -->
        <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
      ` : ''}
      
      <!--[if IE]><div class="ie-container"><![endif]-->
      <!--[if mso]><div class="mso-container"><![endif]-->
      
      <table role="presentation" id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: ${BRAND_COLORS.backgroundDark};width:100%" cellpadding="0" cellspacing="0">
        <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
              <!--[if (mso)|(IE)]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: ${BRAND_COLORS.backgroundDark};"><![endif]-->
              
              <!-- Header -->
              ${emailHeader()}
              
              <!-- Main Content -->
              ${content}
              
              <!-- Footer -->
              ${emailFooter()}
              
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
 * Professional Typography (based on massage template styles)
 */
export function h1(text: string, options: { color?: string; align?: string } = {}): string {
  const { color = BRAND_COLORS.primary, align = 'center' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 10px 0;">
          <h1 style="color: ${color}; font-family: Rubik, sans-serif; font-size: 28px; line-height: 39.2px; margin: 0; font-weight: 700;">${text}</h1>
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
        <td align="${align}" style="padding: 8px 0;">
          <h2 style="color: ${color}; font-family: Rubik, sans-serif; font-size: 22px; line-height: 30.8px; margin: 0; font-weight: 600;">${text}</h2>
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
        <td align="${align}" style="padding: 6px 0;">
          <h3 style="color: ${color}; font-family: Rubik, sans-serif; font-size: 18px; line-height: 25.2px; margin: 0; font-weight: 600;">${text}</h3>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Paragraph
 */
export function paragraph(text: string, options: { color?: string; align?: string; fontSize?: string } = {}): string {
  const { color = BRAND_COLORS.textGray, align = 'left', fontSize = '16px' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 5px 0;">
          <p style="color: ${color}; font-family: 'trebuchet ms', geneva; font-size: ${fontSize}; line-height: 1.6; margin: 0;">${text}</p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Professional Content Section (with background)
 */
export function contentSection(content: string, backgroundColor: string = BRAND_COLORS.backgroundLight): string {
  return `
    <div class="u-row-container" style="padding: 0px;background-color: transparent">
      <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: ${backgroundColor};">
        <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
          <!--[if (mso)|(IE)]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: ${backgroundColor};"><![endif]-->
          
          <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
            <div style="height: 100%;width: 100% !important;">
              <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
              
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tbody>
                  <tr>
                    <td style="overflow-wrap:break-word;word-break:break-word;padding:24px;font-family:arial,helvetica,sans-serif;" align="left">
                      ${content}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          
          <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
        </div>
      </div>
    </div>
  `
}

/**
 * Professional List
 */
export function list(items: string[]): string {
  const listItems = items.map(item => `<li style="color: ${BRAND_COLORS.textLight}; margin-bottom: 8px;">${item}</li>`).join('')
  return `<ul style="color: ${BRAND_COLORS.textLight}; line-height: 2; padding-left: 20px;">${listItems}</ul>`
}

/**
 * Alert Box (for warnings or important notices)
 */
export function alertBox(content: string, type: 'info' | 'warning' | 'success' = 'info'): string {
  const colors = {
    info: { bg: '#e6f0ff', border: BRAND_COLORS.primary },
    warning: { bg: '#fff3cd', border: '#ffc107' },
    success: { bg: '#d4edda', border: '#28a745' }
  }
  const color = colors[type]
  
  return `
    <div style="background: ${color.bg}; border-left: 4px solid ${color.border}; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px;">${content}</p>
    </div>
  `
}
