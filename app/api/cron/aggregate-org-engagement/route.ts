import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { upsertOrgEngagementDay } from '@/lib/services/orgAnalyticsService'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const now = new Date()

    // Fetch active orgs
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id')
      .eq('status', 'active')

    if (orgsError) throw orgsError

    const daysToBackfill = 30
    let processedDays = 0
    let writtenRows = 0
    let skippedRows = 0

    for (const org of orgs || []) {
      for (let i = 0; i < daysToBackfill; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        try {
          const written = await upsertOrgEngagementDay({
            organizationId: org.id,
            date: dateStr,
          })
          processedDays++
          if (written) writtenRows++
          else skippedRows++
        } catch (err) {
          logger.error('org_analytics_cron_day_error', {
            organizationId: org.id,
            date: dateStr,
            error: err as any,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedDays,
      writtenRows,
      skippedRows,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Analytics aggregation failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cron/aggregate-org-engagement',
    method: 'POST',
    description: 'Aggregate org engagement into organization_engagement_daily',
    auth: 'Bearer CRON_SECRET required',
  })
}
