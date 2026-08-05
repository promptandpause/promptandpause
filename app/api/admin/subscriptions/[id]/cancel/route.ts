import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, cancelSubscription } from '@/lib/services/adminService'
import { getAdminUser } from '@/lib/services/adminAuth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAdminUser()

    if (!user) {
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
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
