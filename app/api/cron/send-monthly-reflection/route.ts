import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendMonthlyReflectionEmail } from '@/lib/services/emailService'
import type { MoodType, MonthlyReflection } from '@/lib/types/reflection'
import { logger } from '@/lib/utils/logger'

/**
 * Cron Job: Monthly Reflection Email (Premium)
 *
 * Runs on the 1st of every month. Aggregates the *previous* calendar month's
 * reflections for each Premium user who has opted in to summary emails, then
 * fires `sendMonthlyReflectionEmail` per user.
 *
 * Why this sender bypasses the generic `email_queue` + shared cron:
 *   - It's a pull model (scan → aggregate → send) rather than push
 *     (event → queue → drain). Generating the aggregate is the work; there's
 *     no savings from queuing.
 *   - Idempotency is enforced by an `email_logs` month-scoped lookup so a
 *     duplicate cron run is safe.
 *
 * Security: POST-only, Bearer CRON_SECRET.
 * Suggested schedule (cron-jobs.org): `0 9 1 * *` — 09:00 UTC on day 1.
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

    // Compute the previous calendar month in UTC. Running the cron on day 1
    // means `today.getUTCMonth()` is the new month, so subtract 1.
    const today = new Date()
    const monthStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1, 0, 0, 0, 0),
    )
    const monthEnd = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0),
    )
    const monthLabel = monthStart.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    })

    // Pull Premium-eligible users who have the `weekly_digest` preference
    // enabled — our best existing proxy for "wants summary emails". If you
    // ever split this into its own preference, swap the filter here.
    const { data: candidates, error: fetchError } = await supabase
      .from('user_preferences')
      .select('user_id, weekly_digest, profiles!inner(id, email, full_name, subscription_status)')
      .eq('weekly_digest', true)
      .in('profiles.subscription_status', ['premium', 'active', 'trialing'])

    if (fetchError) {
      logger.error('monthly_reflection_fetch_candidates_error', { error: fetchError })
      return NextResponse.json(
        { error: 'Failed to fetch candidates', details: fetchError.message },
        { status: 500 },
      )
    }

    const results = {
      scanned: candidates?.length ?? 0,
      sent: 0,
      skippedEmpty: 0,
      skippedAlreadySent: 0,
      errors: [] as string[],
    }

    for (const row of candidates ?? []) {
      // Supabase's inner-join projection can come back as an object OR an
      // array depending on relationship metadata; normalise defensively.
      const profileRaw = (row as any).profiles
      const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw
      if (!profile?.email || !profile?.id) continue

      try {
        // Idempotency: skip users who already received this month's email.
        const { data: priorSend } = await supabase
          .from('email_logs')
          .select('id')
          .eq('recipient_email', profile.email)
          .eq('template_name', 'monthly_reflection')
          .gte('created_at', monthEnd.toISOString())
          .limit(1)
          .maybeSingle()

        if (priorSend) {
          results.skippedAlreadySent++
          continue
        }

        // Aggregate the user's reflections for the target month.
        const { data: reflections, error: reflectionsError } = await supabase
          .from('reflections')
          .select('mood, tags, word_count, date, created_at')
          .eq('user_id', profile.id)
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString())

        if (reflectionsError) {
          results.errors.push(`${profile.email}: ${reflectionsError.message}`)
          continue
        }

        const total = reflections?.length ?? 0
        if (total === 0) {
          results.skippedEmpty++
          continue
        }

        const aggregate = buildMonthlyAggregate(reflections as any[], {
          monthStart: monthStart.toISOString(),
          monthEnd: monthEnd.toISOString(),
          monthLabel,
        })

        const sendResult = await sendMonthlyReflectionEmail(
          profile.email,
          profile.id,
          profile.full_name ?? null,
          aggregate,
        )

        if (sendResult.success) {
          results.sent++
        } else {
          results.errors.push(`${profile.email}: ${sendResult.error ?? 'send failed'}`)
        }
      } catch (err: any) {
        results.errors.push(`${profile.email}: ${err?.message ?? 'unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Monthly reflection: sent ${results.sent} of ${results.scanned}`,
      monthLabel,
      ...results,
    })
  } catch (error) {
    logger.error('monthly_reflection_cron_error', { error })
    return NextResponse.json(
      {
        error: 'Monthly reflection cron failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * Pure aggregation — unit-testable without hitting the DB. Takes the month's
 * reflection rows and compresses them into the shape the email expects.
 */
function buildMonthlyAggregate(
  reflections: Array<{
    mood: MoodType | null
    tags: string[] | null
    word_count: number | null
    date: string | null
    created_at: string
  }>,
  window: { monthStart: string; monthEnd: string; monthLabel: string },
): MonthlyReflection {
  const total = reflections.length

  // Days with at least one entry. `date` column is preferred (what the user
  // considers the entry's day), falling back to created_at if absent.
  const daySet = new Set<string>()
  for (const r of reflections) {
    const dayIso = (r.date ?? r.created_at).slice(0, 10)
    daySet.add(dayIso)
  }

  const wordSum = reflections.reduce((sum, r) => sum + (r.word_count ?? 0), 0)
  const averageWordCount = total > 0 ? Math.round(wordSum / total) : 0

  // Top 5 tags by frequency.
  const tagCounts = new Map<string, number>()
  for (const r of reflections) {
    for (const tag of r.tags ?? []) {
      if (!tag) continue
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))

  // Dominant mood = most frequent non-null value. Ties broken by first
  // occurrence (stable Array#reduce behaviour).
  const moodCounts = new Map<MoodType, number>()
  for (const r of reflections) {
    if (!r.mood) continue
    moodCounts.set(r.mood, (moodCounts.get(r.mood) ?? 0) + 1)
  }
  let dominantMood: MoodType | null = null
  let dominantCount = 0
  for (const [mood, count] of moodCounts) {
    if (count > dominantCount) {
      dominantMood = mood
      dominantCount = count
    }
  }

  return {
    monthStart: window.monthStart,
    monthEnd: window.monthEnd,
    monthLabel: window.monthLabel,
    totalReflections: total,
    daysWithEntries: daySet.size,
    averageWordCount,
    topTags,
    dominantMood,
  }
}

/** GET — self-documenting help. No execution. */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cron/send-monthly-reflection',
    method: 'POST',
    description:
      "Sends the previous calendar month's reflection recap to Premium users with weekly_digest enabled.",
    requiresAuth: true,
    security: 'Bearer CRON_SECRET',
    suggestedSchedule: '0 9 1 * *  (09:00 UTC on the 1st)',
  })
}
