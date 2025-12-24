import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWeeklyDigestEmail } from '@/lib/services/emailService'
import { generateWeeklyDigest } from '@/lib/services/analyticsService'
import { rateLimit } from '@/lib/utils/rateLimit'

/**
 * API Route: Send Weekly Digest Email
 * 
 * POST /api/emails/send-digest
 * 
 * Generates and sends a weekly digest email to the authenticated user.
 * This can be used for testing or manual digest delivery.
 * 
 * Response:
 * {
 *   "success": true,
 *   "emailId": "resend_email_id",
 *   "message": "Weekly digest sent successfully",
 *   "digest": { ... }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Rate limit: digest send test (1 per 10 minutes)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await rateLimit(`email-send-digest:${user.id}:${ip}`, { limit: 1, windowMs: 10 * 60_000 })
    if (!rl.allowed) {
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', String(rl.limit))
      headers.set('X-RateLimit-Remaining', String(Math.max(0, rl.remaining)))
      headers.set('X-RateLimit-Reset', String(rl.resetAt))
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      )
    }

    // Check if user has weekly digest enabled
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('weekly_digest')
      .eq('user_id', user.id)
      .single()

    if (preferences && !preferences.weekly_digest) {
      return NextResponse.json(
        { 
          error: 'Weekly digest is disabled in user preferences',
          message: 'User has opted out of weekly digest emails'
        },
        { status: 403 }
      )
    }

    // Generate weekly digest data
    const digestResult = await generateWeeklyDigest(user.id)

    if (!digestResult.success || !digestResult.data) {
      return NextResponse.json(
        { error: 'Failed to generate weekly digest', details: digestResult.error },
        { status: 500 }
      )
    }

    const digest = digestResult.data

    // Check if user has any reflections this week
    if (digest.totalReflections === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No reflections found',
          message: 'User has no reflections from the past week to include in digest'
        },
        { status: 400 }
      )
    }

    // Send the email
    const result = await sendWeeklyDigestEmail(
      profile.email,
      user.id,
      profile.full_name,
      digest
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    {
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', String(rl.limit))
      headers.set('X-RateLimit-Remaining', String(Math.max(0, rl.remaining)))
      headers.set('X-RateLimit-Reset', String(rl.resetAt))
      return NextResponse.json({
        success: true,
        emailId: result.emailId,
        message: 'Weekly digest sent successfully',
        digest: {
          totalReflections: digest.totalReflections,
          averageWordCount: digest.averageWordCount,
          topTags: digest.topTags,
          moodDistribution: digest.moodDistribution,
          currentStreak: digest.currentStreak,
        },
      }, { headers })
    }

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/emails/send-digest
 * 
 * Returns information about the endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/emails/send-digest',
    method: 'POST',
    description: 'Generates and sends a weekly digest email to the authenticated user',
    requiresAuth: true,
    notes: [
      'Requires at least one reflection from the past week',
      'Respects user\'s weekly_digest preference setting',
      'Includes: reflection count, word count average, top tags, mood distribution, current streak'
    ],
  })
}
