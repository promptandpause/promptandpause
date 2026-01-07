import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { checkAdminAuth } from '@/lib/services/adminService'
import { sendDiscountInvitationEmail } from '@/lib/services/emailService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
})

const InviteSchema = z.object({
  user_id: z.string().uuid(),
  discount_type: z.enum(['student', 'nhs']),
  billing_cycle: z.enum(['monthly', 'yearly']),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authSupabase = await createClient()
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminAuth = await checkAdminAuth(authUser.email || undefined)
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { user_id, discount_type, billing_cycle, notes } = parsed.data
    const supabase = createServiceRoleClient()

    // Verify user exists and get profile
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_status, stripe_customer_id')
      .eq('id', user_id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active premium subscription
    if (userProfile.subscription_status === 'premium') {
      return NextResponse.json(
        { error: 'User already has an active premium subscription. Cancel it first.' },
        { status: 400 }
      )
    }

    // Check if there's an existing pending invitation
    const { data: existingInvite } = await supabase
      .from('discount_invitations')
      .select('id, status')
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'User already has a pending discount invitation' },
        { status: 400 }
      )
    }

    // Determine Stripe price ID based on discount type and billing cycle
    let priceId: string
    if (discount_type === 'student') {
      priceId = billing_cycle === 'monthly'
        ? process.env.STRIPE_PRICE_STUDENT_MONTHLY!
        : process.env.STRIPE_PRICE_STUDENT_ANNUAL!
    } else {
      priceId = billing_cycle === 'monthly'
        ? process.env.STRIPE_PRICE_NHS_MONTHLY!
        : process.env.STRIPE_PRICE_NHS_ANNUAL!
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Discount price not configured. Check environment variables.' },
        { status: 500 }
      )
    }

    // Get or create Stripe customer
    let customerId = userProfile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          supabase_user_id: userProfile.id,
        },
      })
      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userProfile.id)
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?discount_activated=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?discount_cancelled=true`,
      metadata: {
        supabase_user_id: userProfile.id,
        discount_type,
        admin_id: authUser.id,
      },
      allow_promotion_codes: false, // Discount already applied via price
      billing_address_collection: 'auto',
    })

    // Create discount invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('discount_invitations')
      .insert({
        user_id,
        admin_id: authUser.id,
        discount_type,
        billing_cycle,
        stripe_checkout_session_id: session.id,
        stripe_checkout_url: session.url,
        notes,
      })
      .select()
      .single()

    if (inviteError) {
      return NextResponse.json(
        { error: 'Failed to create discount invitation' },
        { status: 500 }
      )
    }

    // Log the invitation event
    await supabase.from('subscription_events').insert({
      user_id,
      event_type: 'discount_invited',
      old_status: userProfile.subscription_status,
      new_status: 'pending',
      metadata: {
        discount_type,
        billing_cycle,
        admin_id: authUser.id,
        invitation_id: invitation.id,
      },
    })

    // Send invitation email to user
    const emailResult = await sendDiscountInvitationEmail(
      userProfile.email,
      userProfile.full_name || userProfile.email.split('@')[0],
      discount_type,
      billing_cycle,
      session.url!,
      invitation.expires_at
    )

    if (!emailResult.success) {
      // Log warning but don't fail the request
      console.warn('Failed to send discount invitation email:', emailResult.error)
    }

    return NextResponse.json({
      success: true,
      invitation_id: invitation.id,
      checkout_url: session.url,
      expires_at: invitation.expires_at,
    })

  } catch (error: any) {
    console.error('Discount invitation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create discount invitation' },
      { status: 500 }
    )
  }
}
