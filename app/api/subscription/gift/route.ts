import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { sendSubscriptionEmail } from '@/lib/services/emailService'

/**
 * POST /api/subscription/gift
 * Grant a gifted Premium subscription to a user
 * For admin use - grant free Premium access for a specified period
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const adminAuth = await checkAdminAuth(user.email || undefined)
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get request body
    const body = await request.json()
    const { userId, durationDays } = body

    if (!userId || !durationDays) {
      return NextResponse.json(
        { error: 'userId and durationDays are required.' },
        { status: 400 }
      )
    }

    // Calculate end date
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + parseInt(durationDays))

    // Update user's profile to Premium with end date
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'premium',
        subscription_tier: 'premium', // Keep tier in sync with status
        subscription_end_date: endDate.toISOString(),
        is_gift_subscription: true,
        gift_subscription_end_date: endDate.toISOString(),
        is_trial: false,
        updated_at: new Date().toISOString(),
        // Don't set stripe_subscription_id - this indicates it's gifted
      })
      .eq('id', userId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Fetch user profile to send welcome email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    // Send Welcome to Premium email
    if (userProfile?.email) {
      const planName = `Gifted Premium (${durationDays} days)`
      sendSubscriptionEmail(
        userProfile.email,
        userId,
        'confirmation',
        planName,
        userProfile.full_name
      ).catch((err) => {
        console.error('Failed to send gift welcome email:', err)
      })
    }

    const formattedDate = endDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    return NextResponse.json({
      success: true,
      message: `Gifted Premium subscription granted for ${durationDays} days`,
      userId,
      endDate: formattedDate,
      endDateISO: endDate.toISOString(),
      emailSent: !!userProfile?.email,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to grant subscription' },
      { status: 500 }
    )
  }
}

/**
 * Example usage (from admin panel or API client):
 * 
 * POST /api/subscription/gift
 * Body:
 * {
 *   "userId": "user-uuid-here",
 *   "durationDays": 30  // 30 days, 90 days, 365 days, etc.
 * }
 */
