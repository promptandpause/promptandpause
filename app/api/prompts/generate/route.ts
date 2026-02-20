import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { generatePrompt } from '@/lib/services/aiService'
import { getUserPreferences, getUserTier, listFocusAreas } from '@/lib/services/userService'
import { reflectionServiceServer } from '@/lib/services/reflectionServiceServer'
import { calculateReflectionStreakServer } from '@/lib/services/analyticsServiceServer'
import { selectDailyFocusArea } from '@/lib/services/focusAreaRotationService'
import { GeneratePromptContext, PromptType } from '@/lib/types/reflection'
import { rateLimit } from '@/lib/utils/rateLimit'

/**
 * POST /api/prompts/generate
 * 
 * Generates a personalized AI prompt for the authenticated user.
 * Uses user preferences and recent reflections as context for personalization.
 * Saves the generated prompt to prompts_history table.
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limit per user/IP to prevent abuse of AI API
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await rateLimit(`prompts-generate:${user.id}:${ip}`, { limit: 5, windowMs: 60_000 })
    if (!rl.allowed) {
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', String(rl.limit))
      headers.set('X-RateLimit-Remaining', String(Math.max(0, rl.remaining)))
      headers.set('X-RateLimit-Reset', String(rl.resetAt))
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a bit.' },
        { status: 429, headers }
      )
    }

    const supabase = await createClient()

    // Check if prompt already exists for today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingPrompt } = await supabase
      .from('prompts_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_generated', today)
      .single()

    if (existingPrompt) {
      return NextResponse.json({
        success: true,
        data: {
          id: existingPrompt.id,
          prompt_text: existingPrompt.prompt_text,
          ai_provider: existingPrompt.ai_provider,
          ai_model: existingPrompt.ai_model,
          prompt_type: existingPrompt.personalization_context?.prompt_type || undefined,
          date_generated: existingPrompt.date_generated,
          message: 'Using existing prompt for today',
        },
      })
    }

    // Check user's subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, billing_cycle')
      .eq('id', user.id)
      .single()

    const isFreeUser = profile?.subscription_status !== 'premium' && profile?.billing_cycle !== 'gift_trial'

    // For free users, enforce 3 prompts per week limit
    if (isFreeUser) {
      // Calculate start of current week (Monday)
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // If Sunday, go back 6 days
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - daysToMonday)
      weekStart.setHours(0, 0, 0, 0)
      const weekStartStr = weekStart.toISOString().split('T')[0]

      // Count prompts generated this week
      const { data: weeklyPrompts, error: weeklyError } = await supabase
        .from('prompts_history')
        .select('id')
        .eq('user_id', user.id)
        .gte('date_generated', weekStartStr)

      if (weeklyError) {
        console.error('Failed to check weekly prompts:', weeklyError)
      } else if (weeklyPrompts && weeklyPrompts.length >= 3) {
        const nextMonday = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        const resetLabel = nextMonday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
        return NextResponse.json({
          success: false,
          error: 'Weekly limit reached',
          message: `You've used all 3 prompts this week. Your prompts reset on ${resetLabel}. Upgrade to Premium for unlimited daily prompts.`,
          limit: 3,
          used: weeklyPrompts.length,
          resetDate: nextMonday.toISOString().split('T')[0],
        }, { status: 403 })
      }
    }

    // Fetch user context for personalization
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const [preferencesResult, recentReflections, tierResult, allAreasResult] = await Promise.all([
      getUserPreferences(user.id),
      reflectionServiceServer.getReflectionsByDateRange(
        supabase,
        user.id,
        thirtyDaysAgo,
        today
      ),
      getUserTier(user.id),
      listFocusAreas(user.id),
    ])

    const { tier } = tierResult
    const { areas: allFocusAreas } = allAreasResult

    const [currentStreak, recentPromptsResult] = await Promise.all([
      calculateReflectionStreakServer(user.id),
      supabase
        .from('prompts_history')
        .select('personalization_context')
        .eq('user_id', user.id)
        .order('date_generated', { ascending: false })
        .limit(12),
    ])

    const validPromptTypes = new Set<PromptType>([
      'noticing',
      'naming',
      'contrast',
      'perspective',
      'closure',
      'grounding',
    ])
    const isPromptType = (value: any): value is PromptType => validPromptTypes.has(value)

    const recentPromptTypes: PromptType[] = (recentPromptsResult.data || [])
      .map((p: any) => p?.personalization_context?.prompt_type)
      .filter(isPromptType)
    
    // Get list of all focus areas for context
    const focusAreaNames = allFocusAreas.map((a) => a.name)
    
    // Select focus area using deterministic rotation (respects onboarding choices)
    // Premium users with custom focus areas use their custom areas
    // Free users use onboarding focus areas with weekly cadence / LRU rotation
    let selectedFocusArea: string | null = null
    let rotationReason = ''
    
    if (tier === 'premium' && allFocusAreas.some(a => a.isPremium)) {
      // Premium with custom focus areas - use weighted random (existing behavior)
      const premiumAreas = allFocusAreas.filter(a => a.isPremium)
      const totalWeight = premiumAreas.reduce((sum, a) => sum + (a.priority || 0), 0)
      if (totalWeight > 0) {
        let random = Math.random() * totalWeight
        for (const area of premiumAreas) {
          random -= area.priority || 0
          if (random <= 0) {
            selectedFocusArea = area.name
            break
          }
        }
        selectedFocusArea = selectedFocusArea || premiumAreas[premiumAreas.length - 1]?.name || null
        rotationReason = 'premium_weighted'
      }
    } else {
      // Use deterministic rotation for onboarding focus areas
      const rotationResult = await selectDailyFocusArea(user.id, focusAreaNames)
      selectedFocusArea = rotationResult.selectedFocus
      rotationReason = rotationResult.reason
    }

    // Build context for AI generation
    const userLanguage = preferencesResult.preferences?.language || 'en'
    const context: GeneratePromptContext = {
      focus_areas: focusAreaNames,
      focus_area_name: selectedFocusArea || undefined, // Embed the selected one explicitly
      recent_moods: recentReflections.slice(0, 7).map((r) => r.mood),
      recent_topics: recentReflections
        .slice(0, 10)
        .flatMap((r) => r.tags)
        .filter((tag, index, self) => self.indexOf(tag) === index)
        .slice(0, 5),
      user_reason: preferencesResult.preferences?.reason || undefined,
      current_streak: currentStreak,
      recent_prompt_types: recentPromptTypes,
      language: userLanguage,
    }
    // Generate prompt using AI service
    const { prompt, provider, model, prompt_type } = await generatePrompt(context)

    // Save prompt to database
    const { data: savedPrompt, error: saveError } = await supabase
      .from('prompts_history')
      .insert({
        user_id: user.id,
        prompt_text: prompt,
        ai_provider: provider,
        ai_model: model,
        focus_area_used: selectedFocusArea,
        personalization_context: { ...context, prompt_type, rotation_reason: rotationReason },
        date_generated: today,
        used: false,
      })
      .select()
      .single()

    if (saveError) {
      // Return the prompt anyway, even if saving fails
      return NextResponse.json({
        success: true,
        data: {
          prompt_text: prompt,
          ai_provider: provider,
          ai_model: model,
          prompt_type: prompt_type || undefined,
          focus_area_used: selectedFocusArea,
          date_generated: today,
          warning: 'Prompt generated but not saved to database',
        },
      })
    }

    // Track focus area usage ONLY for premium users with custom focus areas
    // Free users use onboarding focus areas which don't need tracking
    if (selectedFocusArea && savedPrompt && tier === 'premium') {
      const { error: usageError } = await supabase
        .from('prompt_focus_area_usage')
        .insert({
          user_id: user.id,
          prompt_id: savedPrompt.id,
          focus_area_name: selectedFocusArea,
          provider,
          model,
        })
      
      if (usageError) {
        // Non-critical error, don't fail the response
      }
    }

    // Return the generated prompt
    {
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', String(rl.limit))
      headers.set('X-RateLimit-Remaining', String(Math.max(0, rl.remaining)))
      headers.set('X-RateLimit-Reset', String(rl.resetAt))
      return NextResponse.json({
        success: true,
        data: {
          id: savedPrompt.id,
          prompt_text: savedPrompt.prompt_text,
          ai_provider: savedPrompt.ai_provider,
          ai_model: savedPrompt.ai_model,
          focus_area_used: savedPrompt.focus_area_used,
          prompt_type: savedPrompt.personalization_context?.prompt_type || undefined,
          date_generated: savedPrompt.date_generated,
        },
      }, { headers })
    }
  } catch (error) {
    // Check if it's an AI generation error
    if (error instanceof Error && error.message.includes('Failed to generate prompt')) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service unavailable',
          message: 'Unable to generate prompt. Please try again later.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
