import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendGiftActivatedEmail, sendGiftRedeemedBuyerEmail } from '@/lib/services/emailService'

const RedeemSchema = z.object({
  redemption_token: z.string().length(32),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be signed in to redeem a gift.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = RedeemSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid redemption token' },
        { status: 400 }
      )
    }

    const { redemption_token } = parsed.data
    const serviceSupabase = createServiceRoleClient()

    // Fetch gift subscription by token
    const { data: gift, error: giftError } = await serviceSupabase
      .from('gift_subscriptions')
      .select('*')
      .eq('redemption_token', redemption_token)
      .single()

    if (giftError || !gift) {
      return NextResponse.json(
        { error: 'Invalid or expired gift code' },
        { status: 404 }
      )
    }

    // Validation checks
    if (gift.status === 'redeemed') {
      return NextResponse.json(
        { error: 'This gift has already been redeemed' },
        { status: 400 }
      )
    }

    if (gift.status === 'expired') {
      return NextResponse.json(
        { error: 'This gift code has expired' },
        { status: 400 }
      )
    }

    if (gift.status === 'refunded') {
      return NextResponse.json(
        { error: 'This gift has been refunded and is no longer valid' },
        { status: 400 }
      )
    }

    if (gift.expires_at && new Date(gift.expires_at) < new Date()) {
      // Mark as expired
      await serviceSupabase
        .from('gift_subscriptions')
        .update({ status: 'expired' })
        .eq('id', gift.id)

      return NextResponse.json(
        { error: 'This gift code has expired' },
        { status: 400 }
      )
    }

    // Get user's profile
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Email validation if recipient_email was specified
    if (gift.recipient_email && gift.recipient_email.toLowerCase() !== profile.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'This gift was sent to a different email address' },
        { status: 403 }
      )
    }

    // Check if user has an active paid subscription
    if (profile.subscription_status === 'premium' && !profile.is_gift_subscription) {
      // User has a paid subscription
      // Option: Queue gift for after current subscription ends (recommended approach)
      return NextResponse.json(
        { 
          error: 'You already have an active subscription. Please contact support to redeem this gift after your current subscription ends.',
          support_email: 'support@promptandpause.com'
        },
        { status: 400 }
      )
    }

    // Calculate gift end date
    const giftEndDate = new Date()
    giftEndDate.setMonth(giftEndDate.getMonth() + gift.duration_months)

    // Activate gift subscription
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        subscription_status: 'premium',
        subscription_tier: 'premium',
        is_gift_subscription: true,
        gift_subscription_end_date: giftEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update user profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to activate gift subscription' },
        { status: 500 }
      )
    }

    // Update gift record
    const { error: giftUpdateError } = await serviceSupabase
      .from('gift_subscriptions')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        recipient_user_id: user.id,
      })
      .eq('id', gift.id)

    if (giftUpdateError) {
      console.error('Failed to update gift record:', giftUpdateError)
    }

    // Log redemption event
    await serviceSupabase.from('subscription_events').insert({
      user_id: user.id,
      event_type: 'gift_redeemed',
      old_status: profile.subscription_status,
      new_status: 'premium',
      metadata: {
        gift_id: gift.id,
        duration_months: gift.duration_months,
        gift_end_date: giftEndDate.toISOString(),
        purchaser_email: gift.purchaser_email,
      },
    })

    // Send activation confirmation email
    const emailResult = await sendGiftActivatedEmail(
      profile.email,
      profile.full_name || profile.email.split('@')[0],
      gift.duration_months,
      giftEndDate
    )

    if (!emailResult.success) {
      console.warn('Failed to send gift activation email:', emailResult.error)
    }

    // Optional: notify buyer that gift was redeemed
    if (gift.purchaser_email) {
      sendGiftRedeemedBuyerEmail({
        buyerEmail: gift.purchaser_email,
        buyerName: gift.purchaser_name,
        durationMonths: gift.duration_months,
        redeemedAt: new Date().toISOString(),
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'Gift subscription activated successfully!',
      subscription_end_date: giftEndDate.toISOString(),
      duration_months: gift.duration_months,
    })

  } catch (error: any) {
    console.error('Gift redemption error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to redeem gift' },
      { status: 500 }
    )
  }
}
