import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Cache for 5 minutes to avoid hammering the DB on a public page
export const revalidate = 300

/**
 * GET /api/public/impact-stats
 * Returns anonymized, aggregate impact stats for the public support-us page.
 * No authentication required. No PII exposed.
 */
export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Total users (from profiles table)
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (totalUsersError) throw totalUsersError

    // Free users count
    const { count: premiumCount, error: premiumError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'premium')

    if (premiumError) throw premiumError

    const freeUsers = Math.max(0, (totalUsers || 0) - (premiumCount || 0))

    // Engagement rate (last 30 days)
    let engagementRate = 0
    let totalPromptsSent = 0
    let totalReflections = 0

    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
    const cutoffDateISO = cutoffDate.toISOString()

    try {
      const { data: engagementData, error: engagementError } = await supabase.rpc('get_engagement_stats', { days_back: 30 })
      if (engagementError) throw engagementError

      const row = engagementData?.[0] || {}
      totalPromptsSent = Number((row as any).total_prompts_sent) || 0
      totalReflections = Number((row as any).total_reflections) || 0
      engagementRate = Number((row as any).overall_engagement_rate) || 0
    } catch {
      // Fallback: compute from live tables
      const [promptCount, reflectionCount] = await Promise.all([
        supabase
          .from('prompts_history')
          .select('id', { count: 'exact', head: true })
          .gte('date_generated', cutoffDateStr),
        supabase
          .from('reflections')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', cutoffDateISO),
      ])

      totalPromptsSent = promptCount.count || 0
      totalReflections = reflectionCount.count || 0
      engagementRate = totalPromptsSent > 0
        ? Math.round((totalReflections / totalPromptsSent) * 1000) / 10
        : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        freeUsersSupported: freeUsers,
        engagementRate,
        totalPromptsSent,
        totalReflections,
        bootstrapped: true,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch impact stats' },
      { status: 500 }
    )
  }
}
