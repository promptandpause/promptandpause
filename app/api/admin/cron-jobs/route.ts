import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, getCronJobRuns } from '@/lib/services/adminService'
import { getAdminUser } from '@/lib/services/adminAuth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
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

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const job_name = searchParams.get('job_name') || undefined
    const status = searchParams.get('status') || undefined
    const start_date = searchParams.get('start_date') || undefined
    const end_date = searchParams.get('end_date') || undefined

    const result = await getCronJobRuns({
      limit,
      offset,
      job_name,
      status,
      start_date,
      end_date,
    })

    return NextResponse.json({
      success: true,
      runs: result.runs,
      total: result.total,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    )
  }
}
