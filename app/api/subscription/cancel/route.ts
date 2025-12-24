import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

/**
 * POST /api/subscription/cancel
 * Cancel user's subscription (downgrades to free at end of billing period)
 */
export async function POST(request: NextRequest) {
  try {
    // First, authenticate the user with regular client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS for profile access
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user's profile with subscription info
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_end_date')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 400 }
      )
    }

    if (profile.subscription_status !== 'premium') {
      return NextResponse.json(
        { error: 'You are not currently on a Premium plan.' },
        { status: 400 }
      )
    }

    // Handle two cases: paid subscription vs gifted/trial
    if (profile.stripe_subscription_id) {
      // CASE 1: Paid Stripe subscription - cancel at period end
      const subscription = await stripe.subscriptions.update(
        profile.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      )

      // Format the period end date
      const periodEnd = new Date(subscription.current_period_end * 1000)
      const formattedDate = periodEnd.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
        periodEnd: formattedDate,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        type: 'stripe'
      })
    } else {
      // CASE 2: Gifted/Trial subscription - downgrade immediately to free
      const { error: updateError } = await serviceSupabase
        .from('profiles')
        .update({ 
          subscription_status: 'free',
          subscription_end_date: null 
        })
        .eq('id', user.id)

      if (updateError) {
        throw new Error('Failed to cancel gifted subscription')
      }

      return NextResponse.json({
        success: true,
        message: 'Gifted subscription cancelled successfully',
        periodEnd: 'immediately',
        cancelAtPeriodEnd: false,
        type: 'gifted'
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
