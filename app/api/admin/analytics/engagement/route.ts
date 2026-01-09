import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/analytics/engagement
 * Get engagement analytics data
 * 
 * Query params:
 * - days: number of days to analyze (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const serviceSupabase = createServiceRoleClient()

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const cutoffDateISO = cutoffDate.toISOString()
    const cutoffDateStr = cutoffDateISO.split('T')[0]

    // Get overall engagement stats
    let engagement = {
      total_prompts_sent: 0,
      total_reflections: 0,
      overall_engagement_rate: 0,
      avg_reflection_length: 0,
    }

    try {
      const { data: engagementData, error: engagementError } = await serviceSupabase.rpc('get_engagement_stats', { days_back: days })
      if (engagementError) throw engagementError

      const row = engagementData?.[0] || {}
      engagement = {
        total_prompts_sent: Number((row as any).total_prompts_sent) || 0,
        total_reflections: Number((row as any).total_reflections) || 0,
        overall_engagement_rate: Number((row as any).overall_engagement_rate) || 0,
        avg_reflection_length: Number((row as any).avg_reflection_length) || 0,
      }
    } catch {
      const [promptCount, reflectionCount] = await Promise.all([
        serviceSupabase
          .from('prompts_history')
          .select('id', { count: 'exact', head: true })
          .gte('date_generated', cutoffDateStr),
        serviceSupabase
          .from('reflections')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', cutoffDateISO),
      ])

      if (promptCount.error) throw promptCount.error
      if (reflectionCount.error) throw reflectionCount.error

      const total_prompts_sent = promptCount.count || 0
      const total_reflections = reflectionCount.count || 0

      engagement = {
        total_prompts_sent,
        total_reflections,
        overall_engagement_rate: total_prompts_sent > 0
          ? Math.round((total_reflections / total_prompts_sent) * 1000) / 10
          : 0,
        avg_reflection_length: 0,
      }
    }

    // Get engagement by activity status
    const { data: userStats } = await serviceSupabase
      .from('admin_user_stats')
      .select('activity_status, engagement_rate_percent')

    const engagementByActivity = userStats?.reduce((acc: any, user: any) => {
      const status = user.activity_status || 'unknown'
      if (!acc[status]) {
        acc[status] = { total: 0, sum: 0 }
      }
      acc[status].total++
      acc[status].sum += user.engagement_rate_percent || 0
      return acc
    }, {})

    const engagementBreakdown = Object.entries(engagementByActivity || {}).map(([status, data]: [string, any]) => ({
      status,
      count: data.total,
      avgEngagement: data.sum / data.total
    }))

    // Get daily trend for the period
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: reflectionTrend } = await serviceSupabase
      .from('reflections')
      .select('created_at')
      .gte('created_at', daysAgo)
      .order('created_at', { ascending: true })

    // Group by day
    const dailyReflections = reflectionTrend?.reduce((acc: any, ref: any) => {
      const date = ref.created_at.split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {}) || {}

    const trend = Object.entries(dailyReflections).map(([date, count]) => ({
      date,
      reflections: count
    }))

    return NextResponse.json({
      success: true,
      data: {
        overall: engagement,
        byActivity: engagementBreakdown,
        trend
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch engagement analytics' },
      { status: 500 }
    )
  }
}
