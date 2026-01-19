import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/security/rateLimit'
import { sendDiscountInvitationEmail } from '@/lib/services/emailService'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const SendDiscountLinkSchema = z.object({
  user_id: z.string().uuid(),
  discount_type: z.enum(['student', 'nhs']),
  admin_email: z.string().email(),
  admin_notes: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 discount links per hour per IP (admin only)
    const rateLimitResult = await withRateLimit(request, 'auth')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const body = await request.json()
    const parsed = SendDiscountLinkSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { user_id, discount_type, admin_email, admin_notes } = parsed.data

    const supabase = createServiceRoleClient()

    // Verify user exists and get their details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name, created_at')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user_id)
      .in('status', ['active', 'trialing'])
      .single()

    if (subscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Check if user already has a pending discount code
    const { data: existingCode } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('user_id', user_id)
      .eq('discount_type', discount_type)
      .eq('used', false)
      .single()

    if (existingCode) {
      return NextResponse.json(
        { error: 'User already has a pending discount code for this type' },
        { status: 400 }
      )
    }

    // Generate unique discount code
    const code = generateDiscountCode(discount_type)

    // Create discount code record
    const { data: discountCode, error: codeError } = await supabase
      .from('discount_codes')
      .insert({
        code,
        discount_type,
        user_id,
        created_by: admin_email,
        admin_notes,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single()

    if (codeError || !discountCode) {
      console.error('Failed to create discount code:', codeError)
      return NextResponse.json(
        { error: 'Failed to generate discount code' },
        { status: 500 }
      )
    }

    // Send email to user with discount link using centralized email service
    const discountUrl = `${process.env.NEXT_PUBLIC_APP_URL}/discounts/claim?code=${code}&type=${discount_type}`
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Use existing email template from emailService
    const emailResult = await sendDiscountInvitationEmail(
      user.email,
      user.full_name || user.email.split('@')[0],
      discount_type,
      'monthly', // Default billing cycle shown in email
      discountUrl,
      expiryDate
    )

    if (!emailResult.success) {
      console.error('Failed to send discount email:', emailResult.error)
      // Don't fail the request, but log it
    }

    // Send confirmation to admin
    const adminEmailHtml = `
      <h2>Discount Code Sent</h2>
      <p>You've sent a ${discount_type} discount code to:</p>
      <ul>
        <li><strong>User:</strong> ${user.full_name || 'N/A'} (${user.email})</li>
        <li><strong>Code:</strong> ${code}</li>
        <li><strong>Expires:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
        ${admin_notes ? `<li><strong>Notes:</strong> ${admin_notes}</li>` : ''}
      </ul>
      <p>The user can claim their discount at: ${discountUrl}</p>
    `

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Prompt & Pause <noreply@promptandpause.com>',
      to: admin_email,
      subject: `Discount Code Sent: ${code}`,
      html: adminEmailHtml,
    })

    return NextResponse.json({
      success: true,
      code,
      userEmail: user.email,
      userName: user.full_name,
      discountUrl,
    })

  } catch (error: any) {
    console.error('Send discount link error:', error)
    return NextResponse.json(
      { error: 'Failed to send discount link' },
      { status: 500 }
    )
  }
}

function generateDiscountCode(type: 'student' | 'nhs'): string {
  const prefix = type === 'student' ? 'STU' : 'NHS'
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}${random}`
}

