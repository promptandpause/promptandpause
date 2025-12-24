import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getAllSubscriptions } from '@/lib/services/adminService'

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
    const subscription_status = searchParams.get('subscription_status') || undefined
    const billing_cycle = searchParams.get('billing_cycle') || undefined
    const search = searchParams.get('search') || undefined
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc'

    // Fetch subscriptions
    const result = await getAllSubscriptions({
      limit,
      offset,
      subscription_status,
      billing_cycle,
      search,
      sort_by,
      sort_order,
    })

    return NextResponse.json({
      success: true,
      subscriptions: result.subscriptions,
      total: result.total,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}
