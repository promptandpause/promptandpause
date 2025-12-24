import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklyDigestServer } from '@/lib/services/analyticsServiceServer'
import { generateWeeklyInsights } from '@/lib/services/weeklyInsightService'
import { sendWeeklyDigestEmail } from '@/lib/services/emailService'
import { sendWeeklyDigestToSlack } from '@/lib/services/slackService'
import { getUserTier } from '@/lib/utils/tierManagement'

/**
 * POST /api/premium/weekly-digest
 * 
 * Generate and optionally send weekly digest with AI insights
 * Premium feature only
 * 
 * Body (optional):
 * - sendEmail: boolean - Whether to send via email (default: false)
 * - sendSlack: boolean - Whether to send to Slack (default: false)
 * - weekOffset: number - Number of weeks back (0 = current week, 1 = last week, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, full_name, email')
      .eq('id', user.id)
      .single()

    // Get user preferences for Slack webhook
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('slack_webhook_url')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = getUserTier(profile.subscription_status, profile.subscription_tier)
    
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Weekly digest is a premium feature',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const sendEmail = body.sendEmail || false
    const sendSlack = body.sendSlack || false
    const weekOffset = body.weekOffset || 0

    // Calculate date range (week starts on Monday)
    const today = new Date()
    const daysToSubtract = weekOffset * 7
    const targetDate = new Date(today.getTime() - daysToSubtract * 24 * 60 * 60 * 1000)
    
    // Get Monday of target week
    const dayOfWeek = targetDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(targetDate)
    weekStart.setDate(targetDate.getDate() - mondayOffset)
    weekStart.setHours(0, 0, 0, 0)
    
    // Get Sunday of target week
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    console.log(`Generating weekly digest for ${user.id}:`, {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      weekOffset
    })

    // Generate digest data using server-side service for fresh data
    const digest = await generateWeeklyDigestServer(user.id, weekStart, weekEnd)

    // Generate AI insights (premium feature)
    let insights
    try {
      insights = await generateWeeklyInsights(digest, profile.full_name)
    } catch (error) {
      console.error('Error generating AI insights:', error)
      // Continue without AI insights if generation fails
      insights = {
        summary: 'Unable to generate AI insights at this time.',
        keyInsights: [],
        recommendations: [],
        moodAnalysis: '',
        growthAreas: [],
        provider: 'none',
        model: 'none'
      }
    }

    // Combine digest and insights
    const fullDigest = {
      ...digest,
      insights,
      generatedAt: new Date().toISOString(),
    }

    // Optionally send via email and/or Slack
    const deliveryResults: any = {}

    if (sendEmail && profile.email) {
      try {
        const emailResult = await sendWeeklyDigestEmail(
          profile.email,
          user.id,
          profile.full_name,
          digest
        )
        deliveryResults.emailSent = emailResult.success
        deliveryResults.emailId = emailResult.emailId
      } catch (error) {
        console.error('Error sending weekly digest email:', error)
        deliveryResults.emailSent = false
        deliveryResults.emailError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    if (sendSlack && preferences?.slack_webhook_url) {
      try {
        const slackResult = await sendWeeklyDigestToSlack(
          preferences.slack_webhook_url,
          profile.full_name,
          digest
        )
        deliveryResults.slackSent = slackResult.success
        if (!slackResult.success) {
          deliveryResults.slackError = slackResult.error
        }
      } catch (error) {
        console.error('Error sending weekly digest to Slack:', error)
        deliveryResults.slackSent = false
        deliveryResults.slackError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Return digest with delivery results if anything was sent
    if (sendEmail || sendSlack) {
      return NextResponse.json({
        success: true,
        data: fullDigest,
        ...deliveryResults,
      })
    }

    // Return digest without sending email
    return NextResponse.json({
      success: true,
      data: fullDigest,
    })

  } catch (error) {
    console.error('Error generating weekly digest:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate weekly digest' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/premium/weekly-digest
 * 
 * Get the most recent weekly digest for the user
 * Returns current week's digest with AI insights
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = getUserTier(profile.subscription_status, profile.subscription_tier)
    
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Weekly digest is a premium feature',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Get current week (Monday - Sunday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - mondayOffset)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Check cache first to avoid regenerating insights on every page load
    const { data: cachedInsights } = await supabase
      .from('weekly_insights_cache')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart.toISOString())
      .eq('week_end', weekEnd.toISOString())
      .single()

    if (cachedInsights) {
      console.log('✅ Using cached weekly insights (no API call)')
      return NextResponse.json({
        success: true,
        data: {
          weekStart: cachedInsights.week_start,
          weekEnd: cachedInsights.week_end,
          totalReflections: cachedInsights.total_reflections,
          currentStreak: cachedInsights.current_streak,
          averageWordCount: cachedInsights.average_word_count,
          topTags: cachedInsights.top_tags,
          moodDistribution: cachedInsights.mood_distribution,
          insights: cachedInsights.insights,
          generatedAt: cachedInsights.generated_at,
        },
      })
    }

    console.log('⚡ Generating NEW weekly insights (API call) for', user.id)

    // Generate digest using server-side service for fresh data
    const digest = await generateWeeklyDigestServer(user.id, weekStart, weekEnd)

    // Generate AI insights (only if not cached)
    let insights
    try {
      insights = await generateWeeklyInsights(digest, profile.full_name)
    } catch (error) {
      console.error('Error generating AI insights:', error)
      insights = {
        summary: 'Unable to generate AI insights at this time.',
        keyInsights: [],
        recommendations: [],
        moodAnalysis: '',
        growthAreas: [],
        provider: 'none',
        model: 'none'
      }
    }

    // Save to cache for future page loads
    const fullDigest = {
      ...digest,
      insights,
      generatedAt: new Date().toISOString(),
    }

    await supabase
      .from('weekly_insights_cache')
      .upsert({
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
      }, {
        onConflict: 'user_id,week_start,week_end'
      })

    console.log('✅ Cached weekly insights for future page loads')

    return NextResponse.json({
      success: true,
      data: fullDigest,
    })

  } catch (error) {
    console.error('Error fetching weekly digest:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch weekly digest' 
      },
      { status: 500 }
    )
  }
}
