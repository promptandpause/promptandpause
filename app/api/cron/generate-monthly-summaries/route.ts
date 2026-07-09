import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateMonthlyReflectionSummaryServer, getPreviousMonthRange } from '@/lib/services/monthlyReflectionService'
import { sendMonthlyReflectionEmail } from '@/lib/services/emailService'

/**
 * Cron Job: Generate + Email Monthly Reflection Summaries
 *
 * Runs on the 1st of each month. For every Premium user this:
 *   1. Generates the AI monthly summary (overview / observations /
 *      theme reflection / closing question) via the existing service.
 *   2. Upserts it into `monthly_reflection_summaries` so the in-app
 *      monthly view has the data.
 *   3. Sends the user an email with the same summary — ONE source of
 *      truth across in-app and inbox. Opt-in is gated on
 *      `user_preferences.weekly_digest` (our existing summary-emails
 *      preference; swap later if we split it).
 *
 * Idempotency:
 *   - The upsert is idempotent on `(user_id, month_start)`.
 *   - Email send is gated by a lookup against `email_logs` for a
 *     `monthly_reflection` row created after month_end, so re-runs
 *     never duplicate an inbox send.
 *
 * Schedule: `0 9 1 * *` (09:00 UTC on day 1). Security: Bearer CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Valid Bearer token required' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    // Pull Premium users AND their email + preference row in one go. Using a
    // left join on user_preferences so users who never saved prefs still
    // generate a summary — they just won't receive the email.
    const { data: premiumUsers, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        subscription_tier,
        subscription_status,
        user_preferences ( weekly_digest )
      `)
      .eq('subscription_tier', 'premium')
      .eq('subscription_status', 'premium')

    if (usersError) {
      return NextResponse.json({ success: false, error: usersError.message }, { status: 500 })
    }

    if (!premiumUsers || premiumUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No premium users to process', processed: 0 })
    }

    const { monthStart, monthEnd } = getPreviousMonthRange(new Date())
    const monthLabel = monthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    const monthEndIso = monthEnd.toISOString()

    let successCount = 0
    let errorCount = 0
    let emailedCount = 0
    let emailSkippedCount = 0

    for (const user of premiumUsers) {
      try {
        const summary = await generateMonthlyReflectionSummaryServer(
          user.id,
          user.full_name,
          monthStart,
          monthEnd
        )

        const { error: upsertError } = await supabase
          .from('monthly_reflection_summaries')
          .upsert(
            {
              user_id: user.id,
              month_start: summary.monthStart,
              month_end: summary.monthEnd,
              overview_text: summary.overviewText,
              observations: summary.observations,
              theme_reflection: summary.themeReflection,
              closing_question: summary.closingQuestion,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,month_start' }
          )

        if (upsertError) {
          errorCount++
          continue
        }

        successCount++

        // ─── Email delivery ────────────────────────────────────────────────
        // Gated on: valid email + weekly_digest opt-in + no prior send this
        // month. All three guards are required; any one of them failing
        // silently skips the send (this is the expected path for opted-out
        // users, not an error).
        if (!user.email) {
          emailSkippedCount++
          continue
        }

        const prefsRaw = (user as any).user_preferences
        const prefs = Array.isArray(prefsRaw) ? prefsRaw[0] : prefsRaw
        if (!prefs?.weekly_digest) {
          emailSkippedCount++
          continue
        }

        const { data: priorSend } = await supabase
          .from('email_logs')
          .select('id')
          .eq('recipient_email', user.email)
          .eq('template_name', 'monthly_reflection')
          .gte('created_at', monthEndIso)
          .limit(1)
          .maybeSingle()

        if (priorSend) {
          emailSkippedCount++
          continue
        }

        const sendResult = await sendMonthlyReflectionEmail(
          user.email,
          user.id,
          user.full_name ?? null,
          {
            monthStart: summary.monthStart,
            monthEnd: summary.monthEnd,
            monthLabel,
            overviewText: summary.overviewText,
            observations: summary.observations,
            themeReflection: summary.themeReflection,
            closingQuestion: summary.closingQuestion,
          },
        )

        if (sendResult.success) {
          emailedCount++
        } else {
          emailSkippedCount++
        }
      } catch {
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly summaries generation + email completed',
      processed: successCount,
      errors: errorCount,
      emailed: emailedCount,
      emailSkipped: emailSkippedCount,
      total: premiumUsers.length,
      monthStart: monthStart.toISOString().slice(0, 10),
      monthEnd: monthEnd.toISOString().slice(0, 10),
      monthLabel,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/generate-monthly-summaries
 * Returns endpoint documentation only (no execution)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/cron/generate-monthly-summaries',
    method: 'POST',
    description: 'Generates monthly reflection summaries for all premium users',
    requiresAuth: true,
    security: 'Requires Bearer token with CRON_SECRET in Authorization header',
    schedule: 'First day of each month'
  })
}
