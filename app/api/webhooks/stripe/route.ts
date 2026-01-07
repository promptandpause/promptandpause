import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendGiftBuyerConfirmationEmail, sendGiftRecipientEmail, sendSubscriptionEmail } from '@/lib/services/emailService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

// Initialize Supabase Admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key needed for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Handle gift purchases (mode: 'payment' with gift metadata)
  if (session.mode === 'payment' && session.metadata?.gift_type === 'subscription') {
    const { data: gift } = await supabaseAdmin
      .from('gift_subscriptions')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_customer_id: session.customer as string,
        status: 'pending',
      })
      .eq('stripe_checkout_session_id', session.id)
      .select()
      .single()

    if (gift) {
      await supabaseAdmin.from('subscription_events').insert({
        user_id: null,
        event_type: 'gift_purchased',
        old_status: null,
        new_status: 'pending',
        stripe_event_id: session.id,
        metadata: {
          gift_id: gift.id,
          duration_months: gift.duration_months,
          purchaser_email: gift.purchaser_email,
          recipient_email: gift.recipient_email,
        },
      })

      sendGiftBuyerConfirmationEmail({
        buyerEmail: gift.purchaser_email,
        buyerName: gift.purchaser_name,
        durationMonths: gift.duration_months,
        redemptionToken: gift.redemption_token,
        expiresAt: gift.expires_at,
        recipientEmail: gift.recipient_email,
      }).catch(() => {})

      if (gift.recipient_email) {
        sendGiftRecipientEmail({
          recipientEmail: gift.recipient_email,
          durationMonths: gift.duration_months,
          redemptionToken: gift.redemption_token,
          expiresAt: gift.expires_at,
          giftMessage: gift.gift_message,
          purchaserName: gift.purchaser_name,
        }).catch(() => {})
      }
    }
    return
  }

  // Regular subscription flow
  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    return
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  await handleSubscriptionUpdate(subscription, session)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, session?: Stripe.Checkout.Session) {
  const customerId = subscription.customer as string
  
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    return
  }

  const userId = profile.id
  const stripeStatus = subscription.status
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()
  const priceId = subscription.items.data[0]?.price.id

  // Detect discount types and plan name
  let discount_type = null
  let planName = 'Monthly Premium'

  if (priceId === process.env.STRIPE_PRICE_STUDENT_MONTHLY) {
    discount_type = 'student'
    planName = 'Student Monthly'
  } else if (priceId === process.env.STRIPE_PRICE_STUDENT_ANNUAL) {
    discount_type = 'student'
    planName = 'Student Annual'
  } else if (priceId === process.env.STRIPE_PRICE_NHS_MONTHLY) {
    discount_type = 'nhs'
    planName = 'NHS Monthly'
  } else if (priceId === process.env.STRIPE_PRICE_NHS_ANNUAL) {
    discount_type = 'nhs'
    planName = 'NHS Annual'
  } else if (priceId === process.env.STRIPE_PRICE_ANNUAL) {
    planName = 'Annual Premium'
  }

  const isMonthly = priceId === process.env.STRIPE_PRICE_MONTHLY || (discount_type && (priceId === process.env.STRIPE_PRICE_STUDENT_MONTHLY || priceId === process.env.STRIPE_PRICE_NHS_MONTHLY))
  const isYearly = priceId === process.env.STRIPE_PRICE_ANNUAL || (discount_type && (priceId === process.env.STRIPE_PRICE_STUDENT_ANNUAL || priceId === process.env.STRIPE_PRICE_NHS_ANNUAL))

  const subscriptionStatus = (stripeStatus === 'active' || stripeStatus === 'trialing') && (isMonthly || isYearly)
    ? 'premium'
    : stripeStatus === 'canceled'
    ? 'cancelled'
    : 'freemium'

  const billingCycle = isYearly ? 'yearly' : 'monthly'

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscriptionStatus,
      subscription_id: subscription.id,
      stripe_customer_id: customerId,
      billingCycle,
      subscription_end_date: currentPeriodEnd,
      discount_type,
      discount_verified_at: discount_type ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    throw updateError
  }

  // Mark discount invitation as completed if applicable
  if (discount_type && session?.metadata?.admin_id) {
    await supabaseAdmin
      .from('discount_invitations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
  }

  await supabaseAdmin
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: discount_type ? 'discount_activated' : (subscriptionStatus === 'premium' ? 'upgraded' : 'downgraded'),
      old_status: null,
      new_status: subscriptionStatus,
      stripe_event_id: subscription.id,
      metadata: {
        session_id: session?.id,
        discount_type,
        price_id: priceId,
      },
    })

  // Send confirmation email
  const { data: userProfile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (userProfile?.email) {
    sendSubscriptionEmail(
      userProfile.email,
      userId,
      'confirmation',
      planName,
      userProfile.full_name
    ).catch(() => {})
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, subscription_status')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    return
  }

  const userId = profile.id

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      billing_cycle: null,
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    throw updateError
  }

  await supabaseAdmin
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: 'cancelled',
      old_status: profile.subscription_status,
      new_status: 'cancelled',
      stripe_event_id: subscription.id,
    })

  const { data: cancelProfile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (cancelProfile?.email) {
    const priceId = subscription.items.data[0]?.price.id
    const planName = priceId === process.env.STRIPE_PRICE_ANNUAL ? 'Annual Premium' : 'Monthly Premium'
    
    sendSubscriptionEmail(
      cancelProfile.email,
      userId,
      'cancellation',
      planName,
      cancelProfile.full_name
    ).catch(() => {})
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      (invoice as any).subscription as string
    )
    await handleSubscriptionUpdate(subscription)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    return
  }

  await supabaseAdmin
    .from('subscription_events')
    .insert({
      user_id: profile.id,
      event_type: 'payment_failed',
      old_status: 'premium',
      new_status: 'premium',
      stripe_event_id: invoice.id,
      metadata: { invoice_id: invoice.id, amount: invoice.amount_due },
    })
}
