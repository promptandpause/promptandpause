import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/subscription/gift
 * Grant a gifted Premium subscription to a user
 * For admin use - grant free Premium access for a specified period
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

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      )
    }

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
        subscription_end_date: endDate.toISOString(),
        // Don't set stripe_subscription_id - this indicates it's gifted
      })
      .eq('id', userId)

    if (updateError) {
      throw new Error(updateError.message)
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
