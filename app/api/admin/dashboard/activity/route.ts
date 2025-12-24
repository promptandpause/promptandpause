import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getRecentActivity } from '@/lib/services/adminService'

/**
 * GET /api/admin/dashboard/activity
 * Get recent activity feed for dashboard
 * 
 * Query params:
 * - limit: number of activities to return (default: 20)
 */
export async function GET(request: NextRequest) {
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
    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: adminAuth.error || 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Fetch recent activity
    const result = await getRecentActivity(limit)

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch recent activity')
    }

    return NextResponse.json({
      success: true,
      data: result.activities
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
