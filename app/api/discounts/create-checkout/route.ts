import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { withRateLimit } from '@/lib/security/rateLimit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any,
})

const DiscountCheckoutSchema = z.object({
  user_id: z.string().uuid(),
  discount_type: z.enum(['student', 'nhs']),
  billing_cycle: z.enum(['monthly', 'annual']),
  verification_code: z.string().min(6).max(20),
})

const DISCOUNT_PRICES = {
  student: {
    monthly: { price_id: process.env.STRIPE_PRICE_STUDENT_MONTHLY },
    annual: { price_id: process.env.STRIPE_PRICE_STUDENT_ANNUAL },
  },
  nhs: {
    monthly: { price_id: process.env.STRIPE_PRICE_NHS_MONTHLY },
    annual: { price_id: process.env.STRIPE_PRICE_NHS_ANNUAL },
  },
} as const

export async function POST(request: NextRequest) {
  try {
    // Admin authentication: verify admin session cookie
    const sessionToken = request.cookies.get('admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized - Admin login required' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const crypto = await import('crypto')
    const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')
    const { data: adminSession } = await supabase
      .from('admin_sessions')
      .select('*, admin_users!inner(email, role, is_active)')
      .eq('session_token', sessionHash)
      .single()

    if (!adminSession || new Date(adminSession.expires_at) < new Date() || !adminSession.admin_users.is_active) {
      return NextResponse.json({ error: 'Unauthorized - Invalid or expired admin session' }, { status: 401 })
    }

    // Rate limit: 3 discount requests per hour per IP
    const rateLimitResult = await withRateLimit(request, 'auth')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const body = await request.json()
    const parsed = DiscountCheckoutSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { user_id, discount_type, billing_cycle, verification_code } = parsed.data

    // Verify the price ID is configured
    const priceConfig = DISCOUNT_PRICES[discount_type]?.[billing_cycle]
    if (!priceConfig?.price_id) {
      return NextResponse.json(
        { error: 'Discount price not configured' },
        { status: 500 }
      )
    }

    // Verify user exists and get their email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user_id)
      .in('status', ['active', 'trialing'])
      .single()

    if (subscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Verify the discount code (this would be validated against a database of issued codes)
    const { data: discountCode, error: codeError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', verification_code.toUpperCase())
      .eq('discount_type', discount_type)
      .eq('used', false)
      .single()

    if (codeError || !discountCode) {
      return NextResponse.json(
        { error: 'Invalid or already used verification code' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceConfig.price_id, quantity: 1 }],
      customer_email: user.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?discount_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?discount_cancelled=true`,
      metadata: {
        discount_type,
        billing_cycle,
        user_id,
        discount_code_id: discountCode.id,
        verification_code: verification_code.toUpperCase(),
      },
      subscription_data: {
        metadata: {
          discount_type,
          billing_cycle,
          user_id,
        },
      },
    })

    // Mark the discount code as used (but keep it in case of payment failure)
    await supabase
      .from('discount_codes')
      .update({ 
        used: true,
        used_by: user_id,
        used_at: new Date().toISOString(),
        stripe_session_id: session.id,
      })
      .eq('id', discountCode.id)

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })

  } catch (error: any) {
    console.error('Discount checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create discount checkout session' },
      { status: 500 }
    )
  }
}

// Handle webhook events to mark codes as actually used only on successful payment
export async function POST_WEBHOOK(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata

      if (metadata?.discount_code_id && metadata?.user_id) {
        const supabase = createServiceRoleClient()
        
        // Confirm the discount code was successfully used
        await supabase
          .from('discount_codes')
          .update({ 
            payment_completed: true,
            payment_completed_at: new Date().toISOString(),
          })
          .eq('id', metadata.discount_code_id)
          .eq('used_by', metadata.user_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }
}
