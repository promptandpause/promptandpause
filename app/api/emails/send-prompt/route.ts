import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDailyPromptEmail } from '@/lib/services/emailService'
import { rateLimit } from '@/lib/utils/rateLimit'

/**
 * API Route: Send Daily Prompt Email
 * 
 * POST /api/emails/send-prompt
 * 
 * Sends a daily reflection prompt email to the authenticated user.
 * This can be used for testing or manual prompt delivery.
 * 
 * Request body:
 * {
 *   "prompt": "What are you grateful for today?" // Optional, uses random if not provided
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "emailId": "resend_email_id",
 *   "message": "Prompt email sent successfully"
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

    // Rate limit: prevent mass email sends (3 per 10 minutes)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await rateLimit(`email-send-prompt:${user.id}:${ip}`, { limit: 3, windowMs: 10 * 60_000 })
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

    // Parse request body
    const body = await request.json().catch(() => ({}))
    let prompt = body.prompt

    // If no prompt provided, get today's prompt or use a default
    if (!prompt) {
      const { data: todayPrompt } = await supabase
        .from('prompts_history')
        .select('prompt_text')
        .eq('user_id', user.id)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (todayPrompt) {
        prompt = todayPrompt.prompt_text
      } else {
        // Use a default prompt if none exists
        prompt = "What emotion am I feeling right now, and what might be causing it?"
      }
    }

    // Send the email
    const result = await sendDailyPromptEmail(
      profile.email,
      prompt,
      user.id,
      profile.full_name
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
        message: 'Prompt email sent successfully',
        prompt,
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
 * GET /api/emails/send-prompt
 * 
 * Returns information about the endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/emails/send-prompt',
    method: 'POST',
    description: 'Sends a daily reflection prompt email to the authenticated user',
    requiresAuth: true,
    body: {
      prompt: 'string (optional) - Custom prompt text. If not provided, uses today\'s prompt or a default.',
    },
    example: {
      prompt: 'What are you grateful for today?'
    }
  })
}
