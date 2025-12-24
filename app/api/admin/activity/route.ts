import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getAdminActivityLogs } from '@/lib/services/adminService'

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

    // Check admin authentication
    const authCheck = await checkAdminAuth(user.email || '')
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action_type = searchParams.get('action_type') || undefined
    const admin_email = searchParams.get('admin_email') || undefined
    const target_user_id = searchParams.get('target_user_id') || undefined
    const search = searchParams.get('search') || undefined
    const start_date = searchParams.get('start_date') || undefined
    const end_date = searchParams.get('end_date') || undefined

    // Fetch activity logs
    const result = await getAdminActivityLogs({
      limit,
      offset,
      action_type,
      admin_email,
      target_user_id,
      search,
      start_date,
      end_date,
    })

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}
