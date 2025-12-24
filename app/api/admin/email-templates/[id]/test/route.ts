import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getTemplate } from '@/lib/services/emailTemplateService'
import { Resend } from 'resend'

// Simple in-memory rate limiter (5 test emails per admin per minute)
const rateLimiter = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 1000 // 1 minute

function checkRateLimit(adminId: string): boolean {
  const now = Date.now()
  const limit = rateLimiter.get(adminId)

  if (!limit || now > limit.resetAt) {
    rateLimiter.set(adminId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (limit.count >= RATE_LIMIT) {
    return false
  }

  limit.count++
  return true
}

/**
 * POST /api/admin/email-templates/[id]/test
 * Send a test email with sample data (rate-limited)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    
    // Check admin authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Maximum ${RATE_LIMIT} test emails per minute.` },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { recipientEmail, sampleData = {} } = body

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Get template
    const templateResult = await getTemplate(params.id)
    if (!templateResult.success || !templateResult.data) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templateResult.data

    // Replace variables in subject
    let subject = template.subject_template || 'Test Email'
    Object.entries(sampleData).forEach(([key, value]) => {
      if (subject && value !== null && value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        subject = subject.replace(regex, String(value))
      }
    })

    // Generate simple test HTML
    const customization = template.customization
    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: ${customization?.background_color || '#F5F5DC'};">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
            <p style="margin: 0; color: #78350F; font-size: 14px; font-weight: 600;">⚠️ TEST EMAIL</p>
          </div>
          
          <h1 style="color: ${customization?.primary_color || '#667eea'}; font-size: 28px; margin: 0 0 24px 0;">
            ${template.name}
          </h1>
          
          <p style="color: #6B7280; font-size: 16px; margin: 0 0 16px 0;">
            This is a test email for the <strong>${template.name}</strong> template.
          </p>
          
          <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B7280;">Sample Data</h3>
            ${Object.entries(sampleData).map(([key, value]) => `
              <p style="margin: 4px 0; font-size: 14px; color: #374151;">
                <strong>${key}:</strong> ${value}
              </p>
            `).join('')}
          </div>
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #E5E7EB; margin-top: 32px;">
            <p style="margin: 0; color: #9CA3AF; font-size: 13px;">
              Prompt & Pause Email System • Test Mode
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send test email via Resend
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: `Prompt & Pause <${process.env.RESEND_FROM_EMAIL || 'prompts@promptandpause.com'}>`,
      to: recipientEmail,
      subject: `[TEST] ${subject}`,
      html: testHTML,
    })

    if (error) {
      console.error('Test email send error:', error)
      return NextResponse.json(
        { error: 'Failed to send test email', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: data?.id,
      recipient: recipientEmail,
    })
  } catch (error: any) {
    const params = await context.params
    console.error(`Error in POST /api/admin/email-templates/${params.id}/test:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
