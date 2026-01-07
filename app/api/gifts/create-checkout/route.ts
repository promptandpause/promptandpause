import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { withRateLimit } from '@/lib/security/rateLimit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
})

const GiftCheckoutSchema = z.object({
  duration_months: z.enum(['1', '3', '6']).transform(val => parseInt(val)),
  recipient_email: z.string().email().optional(),
  gift_message: z.string().max(500).optional(),
  purchaser_name: z.string().min(2).max(100),
  purchaser_email: z.string().email(),
})

const GIFT_PRICES = {
  1: { amount: 1500, price_id: process.env.STRIPE_PRICE_GIFT_1_MONTH },
  3: { amount: 3600, price_id: process.env.STRIPE_PRICE_GIFT_3_MONTHS },
  6: { amount: 6900, price_id: process.env.STRIPE_PRICE_GIFT_6_MONTHS },
} as const

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 gift purchases per hour per IP (prevent spam)
    const rateLimitResult = await withRateLimit(request, 'auth')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const body = await request.json()
    const parsed = GiftCheckoutSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { duration_months, recipient_email, gift_message, purchaser_name, purchaser_email } = parsed.data

    // Verify the price ID is configured
    const giftConfig = GIFT_PRICES[duration_months as keyof typeof GIFT_PRICES]
    if (!giftConfig.price_id) {
      return NextResponse.json(
        { error: 'Gift subscription price not configured' },
        { status: 500 }
      )
    }

    const supabase = createServiceRoleClient()

    // Generate secure redemption token
    const { data: tokenData } = await supabase.rpc('generate_redemption_token')
    const redemption_token = tokenData as string

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment, not subscription
      payment_method_types: ['card'],
      line_items: [
        {
          price: giftConfig.price_id,
          quantity: 1,
        },
      ],
      customer_email: purchaser_email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gifts/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/gifts/purchase-cancelled`,
      metadata: {
        gift_type: 'subscription',
        duration_months: duration_months.toString(),
        purchaser_email,
        purchaser_name,
        recipient_email: recipient_email || '',
        redemption_token,
      },
    })

    // Create pending gift subscription record
    const { data: gift, error: giftError } = await supabase
      .from('gift_subscriptions')
      .insert({
        stripe_checkout_session_id: session.id,
        purchaser_email,
        purchaser_name,
        duration_months,
        amount_paid: giftConfig.amount,
        redemption_token,
        recipient_email: recipient_email || null,
        gift_message: gift_message || null,
        status: 'pending',
      })
      .select()
      .single()

    if (giftError) {
      console.error('Failed to create gift record:', giftError)
      return NextResponse.json(
        { error: 'Failed to create gift subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      gift_id: gift.id,
    })

  } catch (error: any) {
    console.error('Gift checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create gift checkout' },
      { status: 500 }
    )
  }
}
