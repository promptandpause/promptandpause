import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Cron Job: Send Trial Ending Reminders
 *
 * Scans the profiles table for users whose trial_end_date falls inside the
 * next 36–60h window and queues a single `trial_ending_soon` email per user.
 * The actual send happens via the shared lifecycle cron
 * (`/api/cron/send-welcome-emails`), so this route only handles detection
 * and queueing — keeping one place to worry about Resend rate-limits.
 *
 * Idempotency: a user cannot be queued twice. We double-check both
 *   - email_queue  (pending or sent in the current trial window)
 *   - email_logs   (any historical delivered send)
 * before inserting. Running this cron hourly is safe.
 *
 * Suggested schedule: every 6 hours. The 36–60h window gives us two safe
 * hits at it (e.g. T-54h and T-48h) without risk of duplication.
 *
 * Security: POST-only, Bearer CRON_SECRET — matches the pattern used by
 * every other cron route in the project.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid Bearer token required' },
        { status: 401 },
      )
    }

    const supabase = createServiceRoleClient()

    // Window: trial ends between 36h and 60h from now. Intentionally wider
    // than 48h ± epsilon so the cron can run every ~6h and still catch
    // everyone exactly once.
    const now = Date.now()
    const windowStart = new Date(now + 36 * 60 * 60 * 1000).toISOString()
    const windowEnd = new Date(now + 60 * 60 * 60 * 1000).toISOString()

    const { data: candidates, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, trial_end_date, subscription_status, is_trial')
      .eq('is_trial', true)
      .eq('subscription_status', 'premium')
      .gte('trial_end_date', windowStart)
      .lte('trial_end_date', windowEnd)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch trial candidates', details: fetchError.message },
        { status: 500 },
      )
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No trial-ending candidates in window',
        queued: 0,
      })
    }

    const results = {
      scanned: candidates.length,
      queued: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const profile of candidates) {
      if (!profile.email || !profile.trial_end_date) {
        results.skipped++
        continue
      }

      try {
        // Historical log check (all-time): never resend a template the user
        // has already received for any previous trial cycle.
        const { data: priorLog } = await supabase
          .from('email_logs')
          .select('id')
          .eq('recipient_email', profile.email)
          .eq('template_name', 'trial_ending_soon')
          .in('status', ['sent', 'delivered', 'opened', 'clicked'])
          .limit(1)
          .maybeSingle()

        // Queue check (current cycle): avoid double-queueing within the
        // detection window. Scoped to the user; a stale 'sent' row from a
        // previous trial cycle is caught by the email_logs check above.
        const { data: priorQueue } = await supabase
          .from('email_queue')
          .select('id')
          .eq('user_id', profile.id)
          .eq('email_type', 'trial_ending_soon')
          .in('status', ['pending', 'sent'])
          .limit(1)
          .maybeSingle()

        if (priorLog || priorQueue) {
          results.skipped++
          continue
        }

        const displayName =
          profile.full_name || profile.email.split('@')[0] || 'there'

        const { error: insertError } = await supabase
          .from('email_queue')
          .insert({
            user_id: profile.id,
            email_type: 'trial_ending_soon',
            recipient_email: profile.email,
            recipient_name: displayName,
            scheduled_for: new Date().toISOString(),
            status: 'pending',
            retry_count: 0,
            metadata: { trial_end_date: profile.trial_end_date },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) {
          results.errors.push(`${profile.email}: ${insertError.message}`)
          continue
        }

        results.queued++
      } catch (err: any) {
        results.errors.push(`${profile.email}: ${err?.message || 'unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${results.queued} trial-ending reminders`,
      ...results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Trial-reminder cron failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * GET — self-documenting help. No execution.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cron/send-trial-reminders',
    method: 'POST',
    description:
      'Queues a trial_ending_soon email for users whose trial ends in 36–60h.',
    requiresAuth: true,
    security: 'Bearer CRON_SECRET',
    suggestedSchedule: 'Every 6 hours',
  })
}
