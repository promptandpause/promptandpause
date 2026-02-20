import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { checkAdminAuth, getSubscriptionStats } from '@/lib/services/adminService'

export async function GET() {
  try {
    // Check authentication
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin authorization
    const authCheck = await checkAdminAuth(user.email || '')
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch subscription stats
    const result = await getSubscriptionStats()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch stats')
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscription stats' },
      { status: 500 }
    )
  }
}
