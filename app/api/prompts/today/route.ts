import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/prompts/today
 * 
 * Fetches today's prompt for the authenticated user from prompts_history table.
 * Returns 404 if no prompt exists for today.
 */
export async function GET(request: NextRequest) {
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

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Fetch today's prompt from prompts_history
    const { data: prompt, error: promptError } = await supabase
      .from('prompts_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_generated', today)
      .single()

    // If no prompt found, return 404
    if (promptError) {
      if (promptError.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          {
            success: false,
            error: 'No prompt found for today',
            message: 'Generate a new prompt to get started',
          },
          { status: 404 }
        )
      }

      console.error('Error fetching today\'s prompt:', promptError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch prompt' },
        { status: 500 }
      )
    }

    // Return the prompt
    return NextResponse.json({
      success: true,
      data: {
        id: prompt.id,
        prompt_text: prompt.prompt_text,
        ai_provider: prompt.ai_provider,
        ai_model: prompt.ai_model,
        date_generated: prompt.date_generated,
        used: prompt.used,
      },
    })
  } catch (error) {
    console.error('Unexpected error in /api/prompts/today:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
