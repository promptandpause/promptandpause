import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePrompt, selectFocusArea } from '@/lib/services/aiService'
import { getUserPreferences, getUserTier, listFocusAreas } from '@/lib/services/userService'
import { reflectionServiceServer } from '@/lib/services/reflectionServiceServer'
import { GeneratePromptContext } from '@/lib/types/reflection'
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
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
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
          date_generated: existingPrompt.date_generated,
          message: 'Using existing prompt for today',
        },
      })
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
    
    // Get list of all focus areas for context
    const focusAreaNames = allFocusAreas.map((a) => a.name)
    
    // Select a focus area for this session (random or weighted)
    const selectedFocusArea = selectFocusArea(allFocusAreas, tier === 'premium')
    if (selectedFocusArea) {
    }

    // Build context for AI generation
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
    }
    // Generate prompt using AI service
    const { prompt, provider, model } = await generatePrompt(context)

    // Save prompt to database
    const { data: savedPrompt, error: saveError } = await supabase
      .from('prompts_history')
      .insert({
        user_id: user.id,
        prompt_text: prompt,
        ai_provider: provider,
        ai_model: model,
        focus_area_used: selectedFocusArea,
        personalization_context: context,
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
