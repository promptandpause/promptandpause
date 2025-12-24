import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendTrialExpiredEmail } from '@/lib/services/emailService'
import { logger } from '@/lib/utils/logger'

/**
 * Cron Job: Check for Expired Trials
 * 
 * This API route should be called daily (via Vercel Cron or external service like Cron-job.org)
 * to check for expired trials and:
 * 1. Downgrade users from premium to freemium
 * 2. Send trial expiration email notifications
 * 
 * Set up in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-trial-expiry",
 *     "schedule": "0 9 * * *"  // Run daily at 9 AM UTC
 *   }]
 * }
 * 
 * Or use authorization header for security
 */

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (for security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting trial expiry check...')

    const supabase = createServiceRoleClient()

    // Find all users with expired trials (premium status but subscription_end_date in the past)
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_end_date, subscription_status, subscription_id')
      .eq('subscription_status', 'premium')
      .lt('subscription_end_date', new Date().toISOString())
      .is('subscription_id', null) // Only users without Stripe subscription (trial users)

    if (fetchError) {
      logger.error('trial_expiry_fetch_error', { error: fetchError })
      return NextResponse.json(
        { error: 'Failed to fetch expired trials', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('[CRON] No expired trials found')
      return NextResponse.json({
        success: true,
        message: 'No expired trials found',
        processed: 0,
      })
    }

    console.log(`[CRON] Found ${expiredUsers.length} expired trials to process`)

    const results = {
      total: expiredUsers.length,
      downgraded: 0,
      emailsSent: 0,
      errors: [] as string[],
    }

    // Process each expired trial user
    for (const user of expiredUsers) {
      try {
        console.log(`[CRON] Processing user ${user.id} (${user.email})`)

        // 1. Downgrade user to freemium
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'freemium',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) {
          logger.error('trial_expiry_downgrade_error', { error: updateError, userId: user.id })
          results.errors.push(`Failed to downgrade user ${user.email}: ${updateError.message}`)
          continue
        }

        results.downgraded++
        console.log(`[CRON] ✓ Downgraded user ${user.email} to freemium`)

        // 2. Send trial expiration email
        const emailResult = await sendTrialExpiredEmail(
          user.email,
          user.id,
          user.full_name
        )

        if (emailResult.success) {
          results.emailsSent++
          console.log(`[CRON] ✓ Sent trial expiry email to ${user.email}`)
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
            new_status: 'freemium',
            metadata: {
              reason: 'trial_expired',
              trial_end_date: user.subscription_end_date,
              processed_at: new Date().toISOString(),
            },
          })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('trial_expiry_process_error', { error, userId: user.id })
        results.errors.push(`Processing error for ${user.email}: ${errorMessage}`)
      }
    }

    console.log('[CRON] Trial expiry check completed', results)

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

// Support POST method as well (some cron services use POST)
export async function POST(request: NextRequest) {
  return GET(request)
}
