import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateMonthlyReflectionSummaryServer, getPreviousMonthRange } from '@/lib/services/monthlyReflectionService'

/**
 * Cron Job: Generate Monthly Reflection Summaries
 *
 * Runs monthly to generate a calm, one-page monthly summary for premium users.
 * Schedule is configured in vercel.json.
 * Security: POST-only with Bearer token
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Valid Bearer token required' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    const { data: premiumUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, subscription_tier, subscription_status')
      .eq('subscription_tier', 'premium')
      .eq('subscription_status', 'active')

    if (usersError) {
      return NextResponse.json({ success: false, error: usersError.message }, { status: 500 })
    }

    if (!premiumUsers || premiumUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No premium users to process', processed: 0 })
    }

    const { monthStart, monthEnd } = getPreviousMonthRange(new Date())

    let successCount = 0
    let errorCount = 0

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
        } else {
          successCount++
        }
      } catch {
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly summaries generation completed',
      processed: successCount,
      errors: errorCount,
      total: premiumUsers.length,
      monthStart: monthStart.toISOString().slice(0, 10),
      monthEnd: monthEnd.toISOString().slice(0, 10),
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
