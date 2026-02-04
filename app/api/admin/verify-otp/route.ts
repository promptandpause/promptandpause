import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Get stored OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('admin_otp_codes')
      .select('*')
      .eq('email', email)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'No OTP found. Please request a new code.' }, { status: 400 })
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase.from('admin_otp_codes').delete().eq('email', email)
      return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 })
    }

    // Verify OTP hash
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
    if (otpHash !== otpRecord.otp_hash) {
      return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 400 })
    }

    // OTP is valid - delete it (one-time use)
    await supabase.from('admin_otp_codes').delete().eq('email', email)

    // Get admin user details
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('email', email)
      .single()

    if (adminError || !adminUser || !adminUser.is_active) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('email', email)

    // Generate a session token for the admin
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const sessionExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store session in admin_sessions table
    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        email,
        session_token: crypto.createHash('sha256').update(sessionToken).digest('hex'),
        expires_at: sessionExpiry.toISOString(),
        admin_user_id: adminUser.id,
      })

    if (sessionError) {
      console.error('[Admin Verify OTP] Failed to create session:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    console.log('[Admin Verify OTP] Login successful for:', email)

    // Return session token to be stored client-side
    const response = NextResponse.json({
      success: true,
      user: {
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role,
      },
    })

    // Set session cookie
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })

    return response

  } catch (error: any) {
    console.error('[Admin Verify OTP] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
