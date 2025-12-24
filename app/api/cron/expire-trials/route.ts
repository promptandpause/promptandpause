import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendTrialExpirationEmail } from '@/lib/services/emailService'

/**
 * Cron Job: Expire Trial Subscriptions
 * 
 * Runs daily to check for expired trials and:
 * 1. Revert users to free tier
 * 2. Send trial expiration notification emails
 * 
 * Trigger: Daily at 00:00 UTC
 * Vercel Cron: 0 0 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()
    // Find all users with expired trials
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, trial_end_date')
      .eq('is_trial', true)
      .eq('subscription_status', 'premium')
      .lt('trial_end_date', new Date().toISOString())

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch expired trials', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired trials to process',
        expired: 0
      })
    }
    // Expire trials and send emails
    const results = {
      expired: 0,
      emailsSent: 0,
      errors: [] as string[]
    }

    for (const trial of expiredTrials) {
      try {
        // Update profile to free tier
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'free',
            subscription_tier: 'freemium',
            is_trial: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', trial.id)

        if (updateError) {
          results.errors.push(`${trial.email}: ${updateError.message}`)
          continue
        }

        results.expired++
        // Send trial expiration email
        try {
          await sendTrialExpirationEmail(
            trial.email,
            trial.full_name || 'User'
          )
          results.emailsSent++
        } catch (emailError) {
          results.errors.push(`Email to ${trial.email}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`)
          // Don't fail the whole process if email fails
        }
      } catch (error) {
        results.errors.push(`${trial.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    return NextResponse.json({
      success: true,
      message: `Expired ${results.expired} trials, sent ${results.emailsSent} emails`,
      ...results
    })

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
