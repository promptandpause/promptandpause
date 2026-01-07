import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendGiftExpiringSoonEmail } from '@/lib/services/emailService'

export async function GET() {
  return NextResponse.json({
    message: 'Gift expiry cron job',
    method: 'POST',
    auth: 'Bearer token required',
    endpoint: '/api/cron/expire-gifts'
  })
}

export async function POST(request: NextRequest) {
  const startedAt = new Date()
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // 1. Expire unredeemed gifts older than 12 months
    const { data: expiredGiftsData, error: expireGiftsError } = await supabase
      .rpc('expire_unredeemed_gifts')

    if (expireGiftsError) {
      console.error('Error expiring unredeemed gifts:', expireGiftsError)
    }

    const expiredGiftsCount = expiredGiftsData || 0

    // 2. Expire active gift subscriptions that have ended
    const { data: expiredSubsData, error: expireSubsError } = await supabase
      .rpc('expire_active_gift_subscriptions')

    if (expireSubsError) {
      console.error('Error expiring gift subscriptions:', expireSubsError)
    }

    const expiredSubsCount = expiredSubsData || 0

    // 3. Get users who will expire in 7 days for reminder emails
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data: expiringUsers, error: expiringError } = await supabase
      .from('profiles')
      .select('id, email, full_name, gift_subscription_end_date')
      .eq('is_gift_subscription', true)
      .gte('gift_subscription_end_date', new Date().toISOString())
      .lte('gift_subscription_end_date', sevenDaysFromNow.toISOString())

    if (expiringError) {
      console.error('Error fetching expiring subscriptions:', expiringError)
    }

    if (expiringUsers?.length) {
      await Promise.all(
        expiringUsers
          .filter((u: any) => !!u.email && !!u.gift_subscription_end_date)
          .map((u: any) =>
            sendGiftExpiringSoonEmail({
              email: u.email,
              name: u.full_name,
              endDate: u.gift_subscription_end_date,
            }).catch(() => {})
          )
      )
    }

    // Log cron job execution
    const completedAt = new Date()
    await supabase.from('cron_job_runs').insert({
      job_name: 'expire-gifts',
      status: 'success',
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      execution_time_ms: completedAt.getTime() - startedAt.getTime(),
      metadata: {
        expired_gifts: expiredGiftsCount,
        expired_subscriptions: expiredSubsCount,
        expiring_soon_count: expiringUsers?.length || 0,
      },
    })

    return NextResponse.json({
      success: true,
      expired_gifts: expiredGiftsCount,
      expired_subscriptions: expiredSubsCount,
      expiring_soon: expiringUsers?.length || 0,
    })

  } catch (error: any) {
    console.error('Gift expiry cron error:', error)

    const supabase = createServiceRoleClient()
    const completedAt = new Date()
    await supabase.from('cron_job_runs').insert({
      job_name: 'expire-gifts',
      status: 'failed',
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      execution_time_ms: completedAt.getTime() - startedAt.getTime(),
      error_message: error.message,
    })

    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    )
  }
}
