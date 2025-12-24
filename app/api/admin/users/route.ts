import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getAllUsers } from '@/lib/services/adminService'

/**
 * GET /api/admin/users
 * Get all users with filters, search, and pagination
 * 
 * Query params:
 * - limit: number of users per page (default: 50)
 * - offset: pagination offset (default: 0)
 * - subscription_status: filter by subscription status
 * - activity_status: filter by activity status
 * - search: search by email or name
 * - sort_by: column to sort by (default: signup_date)
 * - sort_order: asc or desc (default: desc)
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const subscription_status = searchParams.get('subscription_status') || undefined
    const activity_status = searchParams.get('activity_status') || undefined
    const search = searchParams.get('search') || undefined
    const sort_by = searchParams.get('sort_by') || 'signup_date'
    const sort_order = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc'

    // Fetch users
    const result = await getAllUsers({
      limit,
      offset,
      subscription_status,
      activity_status,
      search,
      sort_by,
      sort_order
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch users')
    }

    return NextResponse.json({
      success: true,
      data: result.users,
      total: result.total,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
