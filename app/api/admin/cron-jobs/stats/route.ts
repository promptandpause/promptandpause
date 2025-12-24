import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getCronJobStats } from '@/lib/services/adminService'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authCheck = await checkAdminAuth(user.email || '')
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const result = await getCronJobStats()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch stats')
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
    })
  } catch (error) {
    console.error('Error fetching cron job stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cron job stats' },
      { status: 500 }
    )
  }
}
