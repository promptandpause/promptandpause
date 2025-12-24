import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/subscription/status
 * Get user's subscription status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Get subscription details from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_end_date, stripe_customer_id, billing_cycle')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription status' },
        { status: 500 }
      )
    }

    // Determine tier based on subscription_status
    const tier = profile?.subscription_status === 'premium' ? 'premium' : 'free'

    return NextResponse.json({
      success: true,
      data: {
        tier,
        status: profile?.subscription_status || 'freemium',
        endDate: profile?.subscription_end_date,
        billingCycle: profile?.billing_cycle,
        hasStripeCustomer: !!profile?.stripe_customer_id,
        isPremium: tier === 'premium'
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
