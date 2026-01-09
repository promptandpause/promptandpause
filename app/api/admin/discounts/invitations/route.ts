import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authSupabase = await createClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminAuth = await checkAdminAuth(user.email)
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const discount_type = searchParams.get('discount_type')
    const user_id = searchParams.get('user_id')

    const supabase = createServiceRoleClient()

    let query = supabase
      .from('discount_invitations')
      .select(`
        *,
        user:profiles!discount_invitations_user_id_fkey(id, email, full_name),
        admin:profiles!discount_invitations_admin_id_fkey(id, email, full_name)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (discount_type) {
      query = query.eq('discount_type', discount_type)
    }
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitations: data,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
