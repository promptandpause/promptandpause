import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { getMetaAttribution, sendMetaEvent } from '@/lib/meta/metaEventService'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { priceId, billingCycle, metaEventId } = await request.json()

    // Determine price ID from billing cycle or use provided priceId
    let finalPriceId = priceId
    
    if (billingCycle && !priceId) {
      // Use billing cycle to determine price ID from environment variables
      finalPriceId = billingCycle === 'yearly'
        ? process.env.STRIPE_PRICE_ANNUAL
        : process.env.STRIPE_PRICE_MONTHLY
    }

    if (!finalPriceId) {
      return NextResponse.json(
        { error: 'Price ID or billing cycle is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const isYearly = billingCycle === 'yearly'
    const attribution = getMetaAttribution(request)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        // Attribution is only ever recorded for consenting visitors.
        ...(attribution.consented
          ? {
              meta_consent: '1',
              meta_fbp: attribution.fbp || '',
              meta_fbc: attribution.fbc || '',
            }
          : {}),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    // Consent-gated CAPI InitiateCheckout. Shares the browser event's id so
    // Meta dedupes the pixel + server copies of the same event.
    if (attribution.consented) {
      await sendMetaEvent({
        eventName: 'InitiateCheckout',
        eventId: metaEventId || `ic-${session.id}`,
        email: user.email || undefined,
        fbp: attribution.fbp,
        fbc: attribution.fbc,
        contentName: isYearly ? 'Premium Annual' : 'Premium Monthly',
        eventSourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined,
      })
    }

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
