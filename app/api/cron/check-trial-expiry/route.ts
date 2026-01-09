import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendTrialExpiredEmail } from '@/lib/services/emailService'
import { logger } from '@/lib/utils/logger'

/**
 * Cron Job: Check for Expired Trials
 * 
 * This API route should be called daily (via Vercel Cron)
 * to check for expired trials and:
 * 1. Downgrade users from premium to freemium
 * 2. Send trial expiration email notifications
 * 
 * Security: POST-only with Bearer token
 * Schedule: Daily at 9 AM UTC (configured in vercel.json)
 */

export async function POST(request: NextRequest) {
  try {
    // Security: Require Bearer token with CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid Bearer token required' },
        { status: 401 }
      )
    }
    const supabase = createServiceRoleClient()

    const nowIso = new Date().toISOString()
    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Find all users with expired trials (premium status but trial/subscription end is past)
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_end_date, subscription_status, subscription_id, trial_start_date, trial_end_date, is_trial')
      .eq('subscription_status', 'premium')
      .eq('is_trial', true)
      .or(
        [
          `trial_end_date.lt.${nowIso}`,
          // Backstop: if trial_end_date is missing, only expire if trial_start_date is > 7 days ago
          `and(trial_end_date.is.null,trial_start_date.lt.${sevenDaysAgoIso})`,
        ].join(',')
      )
      .is('subscription_id', null) // Only users without Stripe subscription (trial users)

    if (fetchError) {
      logger.error('trial_expiry_fetch_error', { error: fetchError })
      return NextResponse.json(
        { error: 'Failed to fetch expired trials', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired trials found',
        processed: 0,
      })
    }
    const results = {
      total: expiredUsers.length,
      downgraded: 0,
      emailsSent: 0,
      errors: [] as string[],
    }

    // Process each expired trial user
    for (const user of expiredUsers) {
      try {
        // 1. Downgrade user to freemium
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'free',
            subscription_end_date: null,
            is_trial: false,
            trial_end_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) {
          logger.error('trial_expiry_downgrade_error', { error: updateError, userId: user.id })
          results.errors.push(`Failed to downgrade user ${user.email}: ${updateError.message}`)
          continue
        }

        results.downgraded++
        // 2. Send trial expiration email
        const emailResult = await sendTrialExpiredEmail(
          user.email,
          user.id,
          user.full_name
        )

        if (emailResult.success) {
          results.emailsSent++
        } else {
          logger.warn('trial_expiry_email_error', { 
            error: emailResult.error, 
            userId: user.id, 
            email: user.email 
          })
          results.errors.push(`Email failed for ${user.email}: ${emailResult.error}`)
        }

        // 3. Log subscription event
        await supabase
          .from('subscription_events')
          .insert({
            user_id: user.id,
            event_type: 'downgraded',
            old_status: 'premium',
            new_status: 'free',
            metadata: {
              reason: 'trial_expired',
              trial_end_date: user.trial_end_date,
              processed_at: new Date().toISOString(),
            },
          })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('trial_expiry_process_error', { error, userId: user.id })
        results.errors.push(`Processing error for ${user.email}: ${errorMessage}`)
      }
    }
    return NextResponse.json({
      success: true,
      message: 'Trial expiry check completed',
      results,
    })

  } catch (error) {
    logger.error('trial_expiry_cron_error', { error })
    return NextResponse.json(
      { 
        error: 'Trial expiry check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/check-trial-expiry
 * Returns endpoint documentation only (no execution)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/cron/check-trial-expiry',
    method: 'POST',
    description: 'Checks for expired trials and downgrades users',
    requiresAuth: true,
    security: 'Requires Bearer token with CRON_SECRET in Authorization header',
    schedule: 'Daily at 9 AM UTC'
  })
}
