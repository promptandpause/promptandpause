import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, cancelSubscription } from '@/lib/services/adminService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin authorization
    const authCheck = await checkAdminAuth(user.email || '')
    if (!authCheck.isAdmin || !authCheck.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id: userId } = await params
    const body = await request.json()
    const reason = body.reason || undefined

    // Cancel subscription
    const result = await cancelSubscription(userId, authCheck.email, reason)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to cancel subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
