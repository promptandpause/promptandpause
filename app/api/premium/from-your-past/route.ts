import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFromYourPastServer } from '@/lib/services/resurfacingServiceServer'

/**
 * GET /api/premium/from-your-past
 * Returns either one resurfaced reflection (quiet, factual) or null if unsafe.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 })
    }

    if (profile.subscription_tier !== 'premium' || profile.subscription_status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This feature is a premium feature', requiresPremium: true },
        { status: 403 }
      )
    }

    const { surfaced } = await getFromYourPastServer(user.id)

    return NextResponse.json({
      success: true,
      data: surfaced
        ? {
            label: 'Three months ago, you wrote:',
            reflection: {
              id: surfaced.id,
              date: surfaced.date,
              promptText: surfaced.prompt_text,
              reflectionText: surfaced.reflection_text,
              mood: surfaced.mood,
              wordCount: surfaced.word_count,
            },
          }
        : null,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
