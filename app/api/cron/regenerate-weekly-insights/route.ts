import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateWeeklyDigestServer } from '@/lib/services/analyticsServiceServer'
import { generateWeeklyInsights } from '@/lib/services/weeklyInsightService'
import { sendWeeklyDigestEmail } from '@/lib/services/emailService'

/**
 * Cron Job: Regenerate Weekly Insights
 * 
 * Runs every Monday and Friday to regenerate weekly insights for all premium users
 * This ensures insights are fresh and up-to-date throughout the week
 * 
 * Schedule: Monday and Friday at 6:00 AM UTC
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron or authenticated admin
    const authHeader = request.headers.get('authorization')
    const isValidCronRequest = authHeader === `Bearer ${process.env.CRON_SECRET}`
    
    // Verify request has valid CRON_SECRET
    if (!isValidCronRequest) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = createServiceRoleClient()

    // Debug: Get all users to see their subscription data
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, full_name, subscription_tier, subscription_status')
      .limit(10)
    // Get all premium users with active subscriptions
    const { data: premiumUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_tier, subscription_status')
      .eq('subscription_tier', 'premium')
      .eq('subscription_status', 'active')

    if (usersError) {
      return NextResponse.json(
        { success: false, error: usersError.message },
        { status: 500 }
      )
    }

    if (!premiumUsers || premiumUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No premium users to process',
        processed: 0,
      })
    }
    // Calculate current week (Monday - Sunday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - mondayOffset)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    // Process each premium user
    let successCount = 0
    let errorCount = 0

    for (const user of premiumUsers) {
      try {
        // Generate digest data
        const digest = await generateWeeklyDigestServer(user.id, weekStart, weekEnd)

        // Generate AI insights
        let insights
        try {
          insights = await generateWeeklyInsights(digest, user.full_name)
        } catch (error) {
          insights = {
            summary: 'Unable to generate AI insights at this time.',
            keyInsights: [],
            recommendations: [],
            moodAnalysis: '',
            growthAreas: [],
            provider: 'none',
            model: 'none',
          }
        }

        // Update cache (upsert to avoid conflicts)
        const { error: cacheError } = await supabase
          .from('weekly_insights_cache')
          .upsert(
            {
              user_id: user.id,
              week_start: weekStart.toISOString(),
              week_end: weekEnd.toISOString(),
              total_reflections: digest.totalReflections,
              current_streak: digest.currentStreak,
              average_word_count: digest.averageWordCount,
              top_tags: digest.topTags,
              mood_distribution: digest.moodDistribution,
              insights: insights,
              generated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,week_start,week_end',
            }
          )

        if (cacheError) {
          errorCount++
        } else {
          // Send weekly digest email
          if (user.email) {
            try {
              await sendWeeklyDigestEmail(
                user.email,
                user.id,
                user.full_name,
                {
                  weekStart: weekStart.toISOString(),
                  weekEnd: weekEnd.toISOString(),
                  totalReflections: digest.totalReflections,
                  currentStreak: digest.currentStreak,
                  averageWordCount: digest.averageWordCount,
                  topTags: digest.topTags,
                  moodDistribution: digest.moodDistribution,
                  reflectionSummaries: digest.reflectionSummaries || [],
                }
              )
            } catch (emailError) {
              // Don't fail the job if email fails
            }
          }
          
          successCount++
        }
      } catch (error) {
        errorCount++
      }
    }
    return NextResponse.json({
      success: true,
      message: 'Weekly insights regeneration completed',
      processed: successCount,
      errors: errorCount,
      total: premiumUsers.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST method for manual triggers from admin panel
export const POST = GET
