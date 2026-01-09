import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { withRateLimit } from '@/lib/security/rateLimit'

const HomepageContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.enum(['general', 'support', 'billing', 'feature', 'press', 'partnership', 'other']),
  message: z.string().min(10).max(3000),
  isPremium: z.boolean().optional()
})

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 contact form submissions per hour per IP
    const rateLimitResult = await withRateLimit(request, 'auth')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const body = await request.json()
    const parsed = HomepageContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, subject, message, isPremium } = parsed.data
    const contactEmail = 'contact@promptandpause.com'

    // Send email directly to contact inbox
    try {
      const { data, error } = await resend.emails.send({
        from: `Prompt & Pause <noreply@promptandpause.com>`,
        to: contactEmail,
        replyTo: email,
        subject: `[Website] ${subject.charAt(0).toUpperCase() + subject.slice(1)} - From ${name}`,
        html: generateContactEmailHTML({
          name,
          email,
          subject,
          message,
          isPremium
        })
      })

      if (error) {
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    } catch (emailError) {
      return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate email HTML for homepage contact submission
 */
function generateContactEmailHTML(data: {
  name: string
  email: string
  subject: string
  message: string
  isPremium: boolean | undefined
}): string {
  // Brand colors matching dashboard light theme
  const BG_CREAM = '#F5F5DC'
  const BG_WHITE = '#FFFFFF'
  const BG_LIGHT = '#F9FAFB'
  const BORDER_COLOR = '#E5E7EB'
  const TEXT_DARK = '#111827'
  const TEXT_GRAY = '#6B7280'
  const TEXT_MUTED = '#9CA3AF'
  const PRIMARY_ACCENT = '#667eea'
  const LOGO_URL = 'https://yhrnbdl0wz3eilae.public.blob.vercel-storage.com/prompt%26pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw.svg'
  
  const { name, email, subject, message, isPremium } = data
  const subjectLabel = subject.charAt(0).toUpperCase() + subject.slice(1)
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>Website Contact Form Submission</title>
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
            <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; background: ${BG_WHITE}; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding: 40px 20px; background: ${BG_WHITE}; border-bottom: 1px solid ${BORDER_COLOR};">
                  <img src="${LOGO_URL}" alt="Prompt & Pause" style="height: 50px; width: auto;" />
                  <h2 style="color: ${PRIMARY_ACCENT}; margin: 16px 0 0 0; font-size: 20px; font-weight: 600;">
                    New Contact Form Submission
                  </h2>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h3 style="color: ${TEXT_DARK}; margin: 0 0 24px 0; font-size: 18px;">From: ${name}</h3>
                  
                  <!-- Sender Info -->
                  <div style="background: ${BG_LIGHT}; padding: 20px; margin: 24px 0; border-left: 4px solid ${PRIMARY_ACCENT}; border-radius: 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 8px 0;"><strong>Email:</strong></td>
                        <td style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; padding: 8px 0;">
                          <a href="mailto:${email}" style="color: ${PRIMARY_ACCENT}; text-decoration: none;">${email}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 8px 0;"><strong>Subject:</strong></td>
                        <td style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; padding: 8px 0;">${subjectLabel}</td>
                      </tr>
                      <tr>
                        <td style="color: ${TEXT_MUTED}; font-size: 13px; padding: 8px 0;"><strong>Premium User:</strong></td>
                        <td style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 500; padding: 8px 0;">
                          ${isPremium ? '👑 Yes' : 'No'}
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Message -->
                  <h4 style="color: ${TEXT_DARK}; margin: 32px 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Message:</h4>
                  <div style="background: ${BG_LIGHT}; padding: 20px; border-radius: 8px; color: ${TEXT_GRAY}; font-size: 15px; line-height: 1.8; white-space: pre-wrap; word-break: break-word;">${message}</div>
                  
                  <!-- Action -->
                  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${BORDER_COLOR};">
                    <p style="margin: 0; color: ${TEXT_GRAY}; font-size: 14px;">
                      <strong>To reply:</strong> Click the Reply button in your email client to respond directly to <a href="mailto:${email}" style="color: ${PRIMARY_ACCENT}; text-decoration: none;">${email}</a>
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="background: ${BG_LIGHT}; padding: 24px 20px; border-top: 1px solid ${BORDER_COLOR};">
                  <p style="color: ${TEXT_MUTED}; font-size: 12px; margin: 0;">
                    This is an automated email from Prompt & Pause website contact form
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
