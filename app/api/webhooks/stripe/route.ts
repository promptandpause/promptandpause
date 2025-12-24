import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
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
  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    return
  }
  // Get subscription details
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )
    await handleSubscriptionUpdate(subscription)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get user ID from customer
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
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
  
  // Determine subscription status based on price ID
  const priceId = subscription.items.data[0]?.price.id
  const isMonthly = priceId === process.env.STRIPE_PRICE_MONTHLY
  const isYearly = priceId === process.env.STRIPE_PRICE_ANNUAL
  
  // Set status based on subscription - using correct schema field names
  const subscriptionStatus = (stripeStatus === 'active' || stripeStatus === 'trialing') && (isMonthly || isYearly)
    ? 'premium'
    : stripeStatus === 'canceled'
    ? 'cancelled'
    : 'freemium'

  const billingCycle = isYearly ? 'yearly' : 'monthly'
  // Update profile with CORRECT field names from your schema
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscriptionStatus,  // ✅ Your actual field
      subscription_id: subscription.id,         // ✅ Your actual field
      billing_cycle: billingCycle,              // ✅ Your actual field
      subscription_end_date: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    throw updateError
  }

  // Log subscription event
  await supabaseAdmin
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: subscriptionStatus === 'premium' ? 'upgraded' : 'downgraded',
      old_status: null,
      new_status: subscriptionStatus,
      stripe_event_id: subscription.id,
      metadata: {
        billing_cycle: billingCycle,
        price_id: priceId,
        stripe_status: stripeStatus
      }
    })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get user ID from customer
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    return
  }

  const userId = profile.id
  // Downgrade to cancelled - using correct schema field names
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'cancelled',  // ✅ Your actual field
      billing_cycle: null,               // Clear billing cycle
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    throw updateError
  }

  // Log subscription event
  await supabaseAdmin
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: 'cancelled',
      old_status: 'premium',
      new_status: 'cancelled',
      stripe_event_id: subscription.id
    })
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )
    await handleSubscriptionUpdate(subscription)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  // Optionally notify the user about payment failure
  // You could send an email or in-app notification here
}
