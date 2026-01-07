import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canCreateReflection, getWeeklyPromptAllowance } from '@/lib/utils/tierManagement'
import { decryptIfEncrypted, encryptIfPossible } from '@/lib/utils/crypto'
import { z } from 'zod'

// Zod schema for reflection creation
const CreateReflectionSchema = z.object({
  prompt_text: z.string().min(1, 'Prompt text is required').max(1000, 'Prompt text too long'),
  reflection_text: z.string().min(1, 'Reflection text is required').max(10000, 'Reflection text too long'),
  mood: z.string().max(50, 'Mood too long').optional().default('😊'),
  tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional().default([]),
  word_count: z.number().int().min(0).optional()
})

/**
 * GET /api/reflections
 * Get all reflections for the authenticated user
 * Query params:
 * - startDate: Filter reflections from this date
 * - endDate: Filter reflections until this date
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate date formats if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json(
        { error: 'Invalid startDate format' },
        { status: 400 }
      )
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json(
        { error: 'Invalid endDate format' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query
    if (error) throw error

    const decrypted = (data || []).map((r: any) => ({
      ...r,
      reflection_text: decryptIfEncrypted(r.reflection_text) || r.reflection_text,
    }))

    return NextResponse.json({
      success: true,
      data: decrypted,
      count: decrypted.length
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reflections' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reflections
 * Create a new reflection
 * Body: { prompt_text, reflection_text, mood, tags, word_count }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input with Zod
    const parsed = CreateReflectionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { prompt_text, reflection_text, mood, tags, word_count } = parsed.data

    // CHECK TIER LIMITS: Enforce weekly reflection limit for free users
    // Fetch user's subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_tier')
      .eq('id', user.id)
      .single()

    // Get start of current week (Monday 00:00)
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // If Sunday, go back 6 days; else go back to Monday
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - daysToMonday)
    startOfWeek.setHours(0, 0, 0, 0)

    // Count reflections created this week
    const { count: weeklyCount } = await supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfWeek.toISOString())

    // Check if user can create more reflections this week
    const canCreate = canCreateReflection(
      weeklyCount || 0,
      profile?.subscription_status,
      profile?.subscription_tier
    )

    if (!canCreate) {
      const allowance = getWeeklyPromptAllowance(
        profile?.subscription_status,
        profile?.subscription_tier
      )
      return NextResponse.json(
        {
          error: 'Weekly limit reached',
          message: `You've used all ${allowance} prompts this week. Upgrade to Premium for daily prompts!`,
          weeklyCount,
          weeklyLimit: allowance,
          upgradeUrl: '/dashboard/settings'
        },
        { status: 403 }
      )
    }

    // Calculate word count if not provided
    const finalWordCount = word_count || reflection_text.trim().split(/\s+/).length

    // Encrypt sensitive text on write (if ENCRYPTION_KEY set)
    const encryptedText = encryptIfPossible(reflection_text)
    const todayStr = new Date().toISOString().split('T')[0]

    const { data: inserted, error: insertError } = await supabase
      .from('reflections')
      .insert({
        user_id: user.id,
        prompt_text,
        reflection_text: encryptedText,
        mood: mood || '😊',
        tags: tags || [],
        word_count: finalWordCount,
        date: todayStr,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Upsert today's mood (non-blocking failure)
    await supabase
      .from('moods')
      .upsert({ user_id: user.id, date: todayStr, mood: mood || '😊', reflection_id: inserted.id }, { onConflict: 'user_id,date' })

    return NextResponse.json(
      {
        success: true,
        message: 'Reflection created successfully',
        data: {
          ...inserted,
          reflection_text, // return plaintext to client
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create reflection' },
      { status: 500 }
    )
  }
}
