import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  checkAdminAuth, 
  getSubscriptionById,
  updateSubscription
} from '@/lib/services/adminService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin authentication
    const authCheck = await checkAdminAuth(user.email || '')
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id: userId } = await params

    // Fetch subscription details
    const result = await getSubscriptionById(userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      events: result.events,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin authentication
    const authCheck = await checkAdminAuth(user.email || '')
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id: userId } = await params
    const body = await request.json()

    // Validate updates
    const allowedFields = ['subscription_status', 'billing_cycle', 'subscription_end_date']
    const updates: any = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update subscription
    const result = await updateSubscription(userId, updates, user.email || '')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
