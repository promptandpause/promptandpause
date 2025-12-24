import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getDashboardStats } from '@/lib/services/adminService'

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard overview statistics
 * 
 * Returns:
 * - MRR and user counts
 * - Engagement metrics
 * - New signups
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

    // Fetch dashboard stats
    const result = await getDashboardStats()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch dashboard stats')
    }

    return NextResponse.json({
      success: true,
      data: result.stats
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
