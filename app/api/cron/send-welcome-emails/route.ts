import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/services/emailService'

/**
 * Cron Job: Send Welcome Emails
 * 
 * Processes email queue and sends welcome emails to new users
 * Runs every 5 minutes to ensure timely delivery
 * 
 * Trigger: Every 5 minutes
 * Vercel Cron: star-slash-5 star star star star (every 5 minutes)
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
    // Get pending welcome emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('email_type', 'welcome')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('retry_count', 3)
      .order('scheduled_for', { ascending: true })
      .limit(50) // Process max 50 per run

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch email queue', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending emails to process',
        processed: 0
      })
    }
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const emailJob of pendingEmails) {
      try {
        results.processed++

        // Send welcome email
        const emailResult = await sendWelcomeEmail(
          emailJob.recipient_email,
          emailJob.recipient_name
        )

        if (emailResult.success) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', emailJob.id)

          results.sent++
        } else {
          // Mark as failed, increment retry count
          await supabase
            .from('email_queue')
            .update({
              status: emailJob.retry_count >= 2 ? 'failed' : 'pending',
              retry_count: emailJob.retry_count + 1,
              error_message: emailResult.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', emailJob.id)

          results.failed++
          results.errors.push(`${emailJob.recipient_email}: ${emailResult.error}`)
        }
      } catch (error) {
        results.errors.push(`${emailJob.recipient_email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        
        // Increment retry count
        await supabase
          .from('email_queue')
          .update({
            retry_count: emailJob.retry_count + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', emailJob.id)
      }
    }
    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} emails, sent ${results.sent}, failed ${results.failed}`,
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
