import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/security/rateLimit'
import crypto from 'crypto'

// In-memory attempt tracker for OTP brute-force protection
// Tracks failed attempts per email to enforce lockout
const otpAttempts = new Map<string, { count: number; lockedUntil: number }>()

const MAX_OTP_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

function checkOtpLockout(email: string): { locked: boolean; retryAfter?: number } {
  const entry = otpAttempts.get(email)
  if (!entry) return { locked: false }

  const now = Date.now()
  if (entry.lockedUntil > now) {
    return { locked: true, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) }
  }

  // Lockout expired, reset
  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    otpAttempts.delete(email)
  }

  return { locked: false }
}

function recordOtpFailure(email: string): void {
  const entry = otpAttempts.get(email) || { count: 0, lockedUntil: 0 }
  entry.count += 1

  if (entry.count >= MAX_OTP_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS
    console.warn(`[SECURITY] OTP lockout triggered for: ${email} after ${entry.count} failed attempts`)
  }

  otpAttempts.set(email, entry)
}

function clearOtpAttempts(email: string): void {
  otpAttempts.delete(email)
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 attempts per 5 minutes per IP
    const rateLimitResult = await withRateLimit(request, 'auth')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    // Check per-email lockout (brute-force protection)
    const lockout = checkOtpLockout(email)
    if (lockout.locked) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.', retryAfter: lockout.retryAfter },
        { status: 429 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get stored OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('admin_otp_codes')
      .select('*')
      .eq('email', email)
      .single()

    if (otpError || !otpRecord) {
      // Use generic error to avoid revealing whether email has a pending OTP
      return NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 })
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase.from('admin_otp_codes').delete().eq('email', email)
      return NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 })
    }

    // Verify OTP hash
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
    if (otpHash !== otpRecord.otp_hash) {
      // Record failed attempt
      recordOtpFailure(email)

      // Check if lockout was just triggered
      const postFailLockout = checkOtpLockout(email)
      if (postFailLockout.locked) {
        // Delete the OTP to force a new code request
        await supabase.from('admin_otp_codes').delete().eq('email', email)
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new code.', retryAfter: postFailLockout.retryAfter },
          { status: 429 }
        )
      }

      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
    }

    // Clear attempt tracking on success
    clearOtpAttempts(email)

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
