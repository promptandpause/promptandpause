import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendSubscriptionEmail } from '@/lib/services/emailService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        if (!userId) {
          break
        }

        // Update user's subscription status
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'premium',
            subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        // Log subscription event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'created',
          old_status: 'freemium',
          new_status: 'premium',
          stripe_event_id: event.id,
          metadata: { session_id: session.id },
        })
        // Send subscription confirmation email
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single()
        
        if (userProfile?.email) {
          // Determine plan name from session
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id
          const planName = priceId === process.env.STRIPE_PRICE_ANNUAL ? 'Annual Premium' : 'Monthly Premium'
          
          // Send email asynchronously
          sendSubscriptionEmail(
            userProfile.email,
            userId,
            'confirmation',
            planName,
            userProfile.full_name
          ).catch(error => {
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, subscription_status')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          break
        }

        const newStatus = subscription.status === 'active' ? 'premium' : subscription.status === 'canceled' ? 'cancelled' : 'freemium'

        await supabase
          .from('profiles')
          .update({
            subscription_status: newStatus,
            subscription_id: subscription.id,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        // Log subscription event
        await supabase.from('subscription_events').insert({
          user_id: profile.id,
          event_type: 'upgraded',
          old_status: profile.subscription_status,
          new_status: newStatus,
          stripe_event_id: event.id,
          metadata: { subscription_id: subscription.id },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, subscription_status')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          break
        }

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_end_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        // Log subscription event
        await supabase.from('subscription_events').insert({
          user_id: profile.id,
          event_type: 'cancelled',
          old_status: profile.subscription_status,
          new_status: 'cancelled',
          stripe_event_id: event.id,
          metadata: { subscription_id: subscription.id },
        })
        // Send cancellation email
        const { data: cancelProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', profile.id)
          .single()
        
        if (cancelProfile?.email) {
          // Determine plan name
          const priceId = subscription.items.data[0]?.price.id
          const planName = priceId === process.env.STRIPE_PRICE_ANNUAL ? 'Annual Premium' : 'Monthly Premium'
          
          sendSubscriptionEmail(
            cancelProfile.email,
            profile.id,
            'cancellation',
            planName,
            cancelProfile.full_name
          ).catch(error => {
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          break
        }

        // Log payment failure
        await supabase.from('subscription_events').insert({
          user_id: profile.id,
          event_type: 'payment_failed',
          old_status: 'premium',
          new_status: 'premium',
          stripe_event_id: event.id,
          metadata: { invoice_id: invoice.id, amount: invoice.amount_due },
        })
        // Send payment failure notification
        const { data: failProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', profile.id)
          .single()
        
        if (failProfile?.email) {
          // TODO: Create a dedicated payment failure email template in emailService
          // For now, we'll log it and handle via Stripe's built-in failed payment emails
          // Note: Stripe automatically sends payment failure emails if configured in dashboard
        }
        break
      }

      default:
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
