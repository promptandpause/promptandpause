import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, getContentReports, getContentReportStats } from '@/lib/services/adminService'
import { getAdminUser } from '@/lib/services/adminAuth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const [result, statsResult] = await Promise.all([
      getContentReports({
        limit,
        offset,
        status: searchParams.get('status') || undefined,
        target_type: searchParams.get('target_type') || undefined,
        reason: searchParams.get('reason') || undefined,
      }),
      getContentReportStats(),
    ])

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      reports: result.reports,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      stats: statsResult.stats,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
