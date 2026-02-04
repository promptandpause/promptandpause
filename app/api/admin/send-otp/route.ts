import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'admin@promptandpause.com'

// OTP expires in 10 minutes
const OTP_EXPIRY_MINUTES = 10

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check domain restriction
    if (!email.endsWith('@promptandpause.com')) {
      return NextResponse.json({ error: 'Only @promptandpause.com emails are allowed' }, { status: 403 })
    }

    const supabase = createServiceRoleClient()

    // Check if user exists in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, is_active')
      .eq('email', email)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Access denied. You are not registered as an admin user.' }, { status: 403 })
    }

    if (!adminUser.is_active) {
      return NextResponse.json({ error: 'Access denied. Your admin account is inactive.' }, { status: 403 })
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Store OTP in admin_otp_codes table
    // First, delete any existing OTP for this email
    await supabase
      .from('admin_otp_codes')
      .delete()
      .eq('email', email)

    // Insert new OTP
    const { error: insertError } = await supabase
      .from('admin_otp_codes')
      .insert({
        email,
        otp_hash: crypto.createHash('sha256').update(otp).digest('hex'),
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('[Admin OTP] Failed to store OTP:', insertError)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    // Send OTP via Resend
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Admin Login Code - Prompt & Pause',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b;">Admin Login Code</h2>
          <p style="color: #475569;">Hi ${adminUser.full_name || 'Admin'},</p>
          <p style="color: #475569;">Your one-time login code is:</p>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${otp}</span>
          </div>
          <p style="color: #475569;">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="color: #94a3b8; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">Prompt & Pause Admin Panel</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('[Admin OTP] Failed to send email:', emailError)
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 })
    }

    console.log('[Admin OTP] OTP sent successfully to:', email)
    return NextResponse.json({ success: true, message: 'OTP sent to your email' })

  } catch (error: any) {
    console.error('[Admin OTP] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
