import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

/**
 * POST /api/subscription/portal
 * Create Stripe customer portal session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 400 }
      )
    }

    // Create portal session
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      })

      return NextResponse.json({
        success: true,
        url: portalSession.url
      })
    } catch (stripeError: any) {
      // Check if it's a portal configuration error
      if (stripeError.message?.includes('No configuration provided') || 
          stripeError.message?.includes('default configuration has not been created')) {
        console.error('Stripe Customer Portal not configured. Please configure it at: https://dashboard.stripe.com/settings/billing/portal')
        return NextResponse.json(
          { 
            error: 'Customer portal not yet configured. Please contact support to manage your subscription.',
            requiresSetup: true,
            setupUrl: 'https://dashboard.stripe.com/settings/billing/portal'
          },
          { status: 503 } // Service Unavailable
        )
      }
      throw stripeError // Re-throw other Stripe errors
    }
  } catch (error: any) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
