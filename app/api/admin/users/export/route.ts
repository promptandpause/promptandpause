import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getAllUsers, usersToCSV } from '@/lib/services/adminService'

/**
 * GET /api/admin/users/export
 * Export all users to CSV
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

    // Fetch all users (no pagination for export)
    const result = await getAllUsers({
      limit: 10000, // Large limit to get all users
      offset: 0
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch users')
    }

    // Convert to CSV
    const csv = usersToCSV(result.users)

    // Return as CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to export users' },
      { status: 500 }
    )
  }
}
