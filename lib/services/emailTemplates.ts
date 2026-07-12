const APP_URL = 'https://promptandpause.com'
const APP_NAME = 'Prompt & Pause'

export const BRAND_COLORS = {
  primary: '#1d9bf0',
  primaryLight: '#4ab3f4',
  primaryDark: '#1a8cd8',
  accent: '#1d9bf0',
  accentLight: '#4ab3f4',
  backgroundDark: '#0f1419',
  backgroundAccent: '#1a1f25',
  backgroundLight: '#f7f8fa',
  backgroundPure: '#ffffff',
  backgroundSection: '#f0f1f3',
  backgroundMuted: '#e0e4e8',
  textDark: '#0f1419',
  textGray: '#536471',
  textLight: '#ffffff',
  textMuted: '#8b98a5',
  border: '#eff3f4',
  borderLight: '#f0f1f3',
  borderAccent: '#1d9bf0',
}

export const DARK_MODE_COLORS = {
  primary: '#1d9bf0',
  primaryLight: '#4ab3f4',
  primaryDark: '#1a8cd8',
  accent: '#1d9bf0',
  accentLight: '#4ab3f4',
  backgroundDark: '#000000',
  backgroundAccent: '#0f1114',
  backgroundLight: '#15202b',
  backgroundPure: '#1e2732',
  backgroundSection: '#26323f',
  backgroundMuted: '#38444d',
  textDark: '#e7e9ea',
  textGray: '#8b98a5',
  textLight: '#ffffff',
  textMuted: '#6b7885',
  border: '#2f3336',
  borderLight: '#38444d',
  borderAccent: '#1d9bf0',
}

export const LOGO_URL = 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg'

export function emailHeader(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td class="email-header-bg" align="center" style="padding: 32px 20px 24px 20px; background-color: ${BRAND_COLORS.backgroundPure};">
          <a href="${APP_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
            <img class="email-logo" src="${LOGO_URL}" alt="${APP_NAME}" style="height: 44px; width: auto; display: block; border: 0; outline: none;" />
          </a>
        </td>
      </tr>
    </table>
  `
}

export function emailFooter(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="center" style="border-top: 1px solid ${BRAND_COLORS.border}; padding: 28px 20px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 16px;">
            <tr>
              <td style="padding: 0 12px;">
                <a href="${APP_URL}" target="_blank" rel="noopener noreferrer" class="email-text-gray" style="color: ${BRAND_COLORS.textGray}; text-decoration: none; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Home</a>
              </td>
              <td class="email-text-muted" style="color: ${BRAND_COLORS.textMuted}; font-size: 12px;">·</td>
              <td style="padding: 0 12px;">
                <a href="${APP_URL}/dashboard" target="_blank" rel="noopener noreferrer" class="email-text-gray" style="color: ${BRAND_COLORS.textGray}; text-decoration: none; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Dashboard</a>
              </td>
              <td class="email-text-muted" style="color: ${BRAND_COLORS.textMuted}; font-size: 12px;">·</td>
              <td style="padding: 0 12px;">
                <a href="${APP_URL}/privacy" target="_blank" rel="noopener noreferrer" class="email-text-gray" style="color: ${BRAND_COLORS.textGray}; text-decoration: none; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Privacy</a>
              </td>
              <td class="email-text-muted" style="color: ${BRAND_COLORS.textMuted}; font-size: 12px;">·</td>
              <td style="padding: 0 12px;">
                <a href="${APP_URL}/contact" target="_blank" rel="noopener noreferrer" class="email-text-gray" style="color: ${BRAND_COLORS.textGray}; text-decoration: none; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Contact</a>
              </td>
            </tr>
          </table>
          <p class="email-text-muted" style="color: ${BRAND_COLORS.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; margin: 0 0 4px;">
            Pause. Reflect. Grow.
          </p>
          <p class="email-text-muted" style="color: ${BRAND_COLORS.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; margin: 0;">
            © 2026 ${APP_NAME} from DC REGENT GROUP
          </p>
          <p class="email-text-muted" style="color: ${BRAND_COLORS.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; margin: 12px 0 0 0;">
            <a href="${APP_URL}/dashboard/settings" target="_blank" rel="noopener noreferrer" class="email-text-muted" style="color: ${BRAND_COLORS.textMuted}; text-decoration: underline;">Manage email preferences</a>
          </p>
        </td>
      </tr>
    </table>
  `
}

export function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px auto;">
      <tr>
        <td class="email-btn-primary" style="border-radius: 999px; background-color: ${BRAND_COLORS.primary};">
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; color: ${BRAND_COLORS.textLight}; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 999px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

export function textButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 20px auto;">
      <tr>
        <td align="center">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="email-text-primary" style="color: ${BRAND_COLORS.primary}; text-decoration: none; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${text} →
          </a>
        </td>
      </tr>
    </table>
  `
}

export function infoBox(content: string, _bgColor?: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 20px 0;">
      <tr>
        <td class="email-info-box" style="background-color: ${BRAND_COLORS.backgroundSection}; padding: 20px 24px; border-radius: 12px;">
          ${content}
        </td>
      </tr>
    </table>
  `
}

export function emailWrapper(content: string, options: {
  preheader?: string
  title?: string
} = {}): string {
  const { preheader, title = APP_NAME } = options

  const darkModeCss = `
    @media (prefers-color-scheme: dark) {
      .email-body-bg { background-color: ${DARK_MODE_COLORS.backgroundLight} !important; }
      .email-card-bg { background-color: ${DARK_MODE_COLORS.backgroundPure} !important; }
      .email-section-bg { background-color: ${DARK_MODE_COLORS.backgroundSection} !important; }
      .email-header-bg { background-color: ${BRAND_COLORS.backgroundPure} !important; }
      .email-text-dark { color: ${DARK_MODE_COLORS.textDark} !important; }
      .email-text-gray { color: ${DARK_MODE_COLORS.textGray} !important; }
      .email-text-muted { color: ${DARK_MODE_COLORS.textMuted} !important; }
      .email-text-primary { color: ${DARK_MODE_COLORS.primary} !important; }
      .email-btn-primary { background-color: ${DARK_MODE_COLORS.primary} !important; }
      .email-info-box { background-color: ${DARK_MODE_COLORS.backgroundSection} !important; }
      .email-logo { filter: none !important; }
      .email-border-bottom { border-bottom-color: ${DARK_MODE_COLORS.border} !important; }
      .email-badge { background-color: ${DARK_MODE_COLORS.backgroundMuted} !important; }
      .email-alert-info { background-color: #0a2a3f !important; }
      .email-alert-warning { background-color: #2a2010 !important; }
      .email-alert-success { background-color: #0a281a !important; }
      .email-premium-card { background-color: #0a2a3f !important; }
      .email-premium-title { color: ${DARK_MODE_COLORS.primary} !important; }
      .email-premium-item { color: ${DARK_MODE_COLORS.textDark} !important; }
      .email-prompt-card { background-color: ${DARK_MODE_COLORS.backgroundSection} !important; border-color: ${DARK_MODE_COLORS.border} !important; }
      .email-prompt-label { color: ${DARK_MODE_COLORS.primary} !important; }
      .email-prompt-text { color: ${DARK_MODE_COLORS.textDark} !important; }
    }
    [data-ogsc] .email-body-bg { background-color: ${DARK_MODE_COLORS.backgroundLight} !important; }
    [data-ogsc] .email-card-bg { background-color: ${DARK_MODE_COLORS.backgroundPure} !important; }
    [data-ogsc] .email-text-dark { color: ${DARK_MODE_COLORS.textDark} !important; }
    [data-ogsc] .email-text-gray { color: ${DARK_MODE_COLORS.textGray} !important; }
    [data-ogsc] .email-text-primary { color: ${DARK_MODE_COLORS.primary} !important; }
    [data-ogsc] .email-logo { filter: none !important; }
    [data-ogsc] .email-header-bg { background-color: ${BRAND_COLORS.backgroundPure} !important; }
  `

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>${title}</title>
      <style type="text/css">
        body, table, td, tr { border-collapse: collapse; }
        a[x-apple-data-detectors=true] { color: inherit !important; text-decoration: none !important; }
        @media only screen and (min-width: 620px) { .u-row { width: 600px !important; } }
        @media only screen and (max-width: 620px) {
          .u-row { width: 100% !important; }
          img { max-width: 100% !important; height: auto !important; }
        }
        @media (max-width: 480px) {
          .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
        }
        ${darkModeCss}
      </style>
    </head>
    <body class="email-body-bg" style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: ${BRAND_COLORS.backgroundLight}; color: ${BRAND_COLORS.textDark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>` : ''}
      <table role="presentation" class="email-body-bg" style="border-collapse: collapse; table-layout: fixed; min-width: 320px; margin: 0 auto; background-color: ${BRAND_COLORS.backgroundLight}; width: 100%;" cellpadding="0" cellspacing="0">
        <tbody>
          <tr>
            <td class="email-body-bg" style="word-break: break-word; padding: 20px 0; background-color: ${BRAND_COLORS.backgroundLight};">
              <table role="presentation" class="email-card-bg" align="center" style="max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.backgroundPure}; border-radius: 12px; overflow: hidden;" cellpadding="0" cellspacing="0" width="100%">
                <tbody>
                  <tr>
                    <td>
                      ${emailHeader()}
                      ${content}
                      ${emailFooter()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `
}

export function h1(text: string, options: { color?: string; align?: string } = {}): string {
  const { color = BRAND_COLORS.textDark, align = 'center' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 8px 0;">
          <h1 class="email-text-dark" style="color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; line-height: 1.3; margin: 0; font-weight: 700; letter-spacing: -0.02em;">${text}</h1>
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
        <td align="${align}" style="padding: 6px 0;">
          <h2 class="email-text-dark" style="color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; line-height: 1.35; margin: 0; font-weight: 700;">${text}</h2>
        </td>
      </tr>
    </table>
  `
}

export function h3(text: string, options: { color?: string; align?: string } = {}): string {
  const { color = BRAND_COLORS.textDark, align = 'left' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 4px 0;">
          <h3 class="email-text-dark" style="color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.4; margin: 0; font-weight: 700;">${text}</h3>
        </td>
      </tr>
    </table>
  `
}

export function paragraph(text: string, options: { color?: string; align?: string; fontSize?: string } = {}): string {
  const { color = BRAND_COLORS.textGray, align = 'left', fontSize = '15px' } = options
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td align="${align}" style="padding: 4px 0;">
          <p class="${color === BRAND_COLORS.textMuted ? 'email-text-muted' : 'email-text-gray'}" style="color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: ${fontSize}; line-height: 1.6; margin: 0;">${text}</p>
        </td>
      </tr>
    </table>
  `
}

export function contentSection(content: string, _backgroundColor?: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tr>
        <td class="email-card-bg mobile-padding" style="padding: 28px 28px;">
          ${content}
        </td>
      </tr>
    </table>
  `
}

export function list(items: string[]): string {
  const listItems = items.map(item => `
    <li style="color: ${BRAND_COLORS.textGray}; margin-bottom: 8px; font-size: 15px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${item}</li>
  `).join('')
  return `
    <ul style="line-height: 1.6; padding-left: 20px; margin: 12px 0;">
      ${listItems}
    </ul>
  `
}

export function alertBox(content: string, type: 'info' | 'warning' | 'success' = 'info'): string {
  const colors = {
    info: { bg: '#e8f4fd', border: '#1d9bf0', text: '#0f1419', darkClass: 'email-alert-info' },
    warning: { bg: '#fef3cd', border: '#ffad1f', text: '#0f1419', darkClass: 'email-alert-warning' },
    success: { bg: '#e6f7e6', border: '#00ba7c', text: '#0f1419', darkClass: 'email-alert-success' }
  }
  const c = colors[type]
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 16px 0;">
      <tr>
        <td class="${c.darkClass}" style="background: ${c.bg}; border-left: 3px solid ${c.border}; padding: 14px 18px; border-radius: 8px;">
          <p style="margin: 0; color: ${c.text}; font-size: 14px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${content}</p>
        </td>
      </tr>
    </table>
  `
}
