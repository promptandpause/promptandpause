import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import crypto from 'crypto'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { generatePrompt } from '@/lib/services/aiService'
import { getUserPreferences, getUserTier, listFocusAreas } from '@/lib/services/userService'
import { reflectionServiceServer } from '@/lib/services/reflectionServiceServer'
import { calculateReflectionStreakServer, generateWeeklyDigestServer } from '@/lib/services/analyticsServiceServer'
import { selectDailyFocusArea } from '@/lib/services/focusAreaRotationService'
import { GeneratePromptContext, PromptType } from '@/lib/types/reflection'
import { generateWeeklyInsights } from '@/lib/services/weeklyInsightService'
import { generateMonthlyReflectionSummaryServer, getMonthRange } from '@/lib/services/monthlyReflectionService'
import { FREEMIUM_FOCUS_AREAS } from '@/lib/constants/focusAreas'
import { getAdminUser } from '@/lib/services/adminAuth'

const FALLBACK_AFFIRMATIONS = [
  "You're doing great—one step at a time.",
  'Be gentle with yourself today.',
  'Every small step counts.',
  'You are enough, just as you are.',
  'Progress, not perfection.',
  'You’ve already handled hard things before.',
]

const DEFAULT_TONE = 'gentle / motivating / grounded / short-mantra'

function getDailyFallback(): string {
  const today = new Date()
  const seed = Number(
    `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(
      today.getDate()
    ).padStart(2, '0')}`
  )
  return FALLBACK_AFFIRMATIONS[seed % FALLBACK_AFFIRMATIONS.length]
}

function summarizeTags(tags: string[][]): string[] {
  const counts = new Map<string, number>()
  tags.flat().forEach((tag) => {
    if (!tag) return
    counts.set(tag, (counts.get(tag) ?? 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)
}

async function resolveAdminEmail(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value
  let adminEmail: string | null = null

  if (sessionToken) {
    const supabase = createServiceRoleClient()
    const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')
    const { data: session } = await supabase
      .from('admin_sessions')
      .select('*, admin_users!inner(email, is_active)')
      .eq('session_token', sessionHash)
      .single()

    if (session && new Date(session.expires_at) >= new Date() && session.admin_users?.is_active) {
      adminEmail = session.admin_users.email
    }
  }

  if (!adminEmail) {
    const user = await getAdminUser()

    if (!user?.email) {
      return {
        email: null,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const adminAuth = await checkAdminAuth(user.email)
    if (!adminAuth.isAdmin) {
      return {
        email: null,
        response: NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    adminEmail = user.email
  } else {
    const adminAuth = await checkAdminAuth(adminEmail)
    if (!adminAuth.isAdmin) {
      return {
        email: null,
        response: NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }
  }

  return { email: adminEmail, response: null }
}

async function resolveTargetUser(options: {
  userId?: string | null
  userEmail?: string | null
  fallbackEmail?: string | null
}) {
  const { userId, userEmail, fallbackEmail } = options
  const supabase = createServiceRoleClient()

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()
    return profile || null
  }

  const emailToFind = userEmail || fallbackEmail
  if (!emailToFind) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', emailToFind)
    .single()

  return profile || null
}

async function generateDailyPrompt(userId: string) {
  const supabase = createServiceRoleClient()
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [preferencesResult, recentReflections, tierResult, allAreasResult] = await Promise.all([
    getUserPreferences(userId),
    reflectionServiceServer.getReflectionsByDateRange(
      supabase,
      userId,
      thirtyDaysAgo,
      today
    ),
    getUserTier(userId),
    listFocusAreas(userId),
  ])

  const { tier } = tierResult
  const focusAreaNames = (allAreasResult.areas || []).map((a) => a.name)
  const fallbackFocusAreas = FREEMIUM_FOCUS_AREAS.map((a) => a.name)
  const availableFocusAreas = focusAreaNames.length > 0 ? focusAreaNames : fallbackFocusAreas

  const [currentStreak, recentPromptsResult] = await Promise.all([
    calculateReflectionStreakServer(userId),
    supabase
      .from('prompts_history')
      .select('personalization_context')
      .eq('user_id', userId)
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

  let selectedFocusArea: string | null = null
  let rotationReason = ''

  if (tier === 'premium' && allAreasResult.areas?.some((a) => a.isPremium)) {
    const premiumAreas = allAreasResult.areas.filter((a) => a.isPremium)
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
    const rotationResult = await selectDailyFocusArea(userId, availableFocusAreas)
    selectedFocusArea = rotationResult.selectedFocus
    rotationReason = rotationResult.reason
  }

  const context: GeneratePromptContext = {
    focus_areas: availableFocusAreas,
    focus_area_name: selectedFocusArea || undefined,
    recent_moods: recentReflections.slice(0, 7).map((r) => r.mood),
    recent_topics: recentReflections
      .slice(0, 10)
      .flatMap((r) => r.tags || [])
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .slice(0, 5),
    user_reason: preferencesResult.preferences?.reason || undefined,
    current_streak: currentStreak,
    recent_prompt_types: recentPromptTypes,
  }

  const { prompt, provider, model, prompt_type } = await generatePrompt(context)

  return {
    prompt_text: prompt,
    ai_provider: provider,
    ai_model: model,
    prompt_type: prompt_type || undefined,
    focus_area_used: selectedFocusArea,
    rotation_reason: rotationReason,
    date_generated: today,
  }
}

async function generateDailyAffirmation(userId: string) {
  const supabase = createServiceRoleClient()
  const today = new Date().toISOString().split('T')[0]
  const fallback = getDailyFallback()

  const { data: cachedAffirmation } = await supabase
    .from('daily_affirmations')
    .select('text,source,tone,usage,ai_provider,ai_model')
    .eq('user_id', userId)
    .eq('affirmation_date', today)
    .maybeSingle()

  if (cachedAffirmation?.text) {
    return {
      text: cachedAffirmation.text,
      source: cachedAffirmation.source || 'cache',
      date: today,
      tone: cachedAffirmation.tone || DEFAULT_TONE,
      usage: cachedAffirmation.usage ?? undefined,
      provider: cachedAffirmation.ai_provider ?? undefined,
      model: cachedAffirmation.ai_model ?? undefined,
      cached: true,
    }
  }

  const { data: reflections } = await supabase
    .from('reflections')
    .select('mood,tags,word_count,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const recent = reflections ?? []
  const recentMoods = recent.map((item) => item.mood).filter(Boolean)
  const recentTags = summarizeTags(recent.map((item) => item.tags || []))
  const lastReflectionDate = recent[0]?.created_at?.split('T')[0] ?? null

  const context = {
    date: today,
    recent_moods: recentMoods,
    recent_tags: recentTags,
    reflections_count: recent.length,
    last_reflection_date: lastReflectionDate,
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (!openrouterKey) {
    return {
      text: fallback,
      source: 'fallback',
      date: today,
      tone: DEFAULT_TONE,
      reason: 'OPENROUTER_API_KEY not configured',
      context,
    }
  }

  const openrouter = new OpenAI({
    apiKey: openrouterKey,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  const model =
    process.env.OPENROUTER_MODEL_PREFS?.split(',')[0]?.trim() ||
    'meta-llama/llama-3.3-70b-instruct:free'

  const stream = await openrouter.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a calm, supportive wellness coach. Write one short affirmation (8-12 words). Tone: gentle, motivating, grounded, short-mantra. No emojis. No quotes. Return only the sentence.',
      },
      {
        role: 'user',
        content: `Context: ${JSON.stringify(context)}`,
      },
    ],
    stream: true,
    stream_options: { include_usage: true },
    temperature: 0.75,
    max_tokens: 80,
    top_p: 0.9,
  })

  let response = ''
  let usage: unknown = null

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) response += content
    if (chunk.usage) usage = chunk.usage
  }

  const text = response.trim() || fallback
  const source = response.trim() ? 'openrouter' : 'fallback'

  return {
    text,
    source,
    date: today,
    tone: DEFAULT_TONE,
    usage: source === 'openrouter' ? usage : undefined,
    provider: source === 'openrouter' ? 'openrouter' : undefined,
    model: source === 'openrouter' ? model : undefined,
    context,
  }
}

function getWeekRange(weekOffset: number) {
  const today = new Date()
  const daysToSubtract = weekOffset * 7
  const targetDate = new Date(today.getTime() - daysToSubtract * 24 * 60 * 60 * 1000)

  const dayOfWeek = targetDate.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(targetDate)
  weekStart.setDate(targetDate.getDate() - mondayOffset)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return { weekStart, weekEnd }
}

function getMonthRangeForOffset(monthOffset: number) {
  const now = new Date()
  const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0, 0))
  anchor.setUTCMonth(anchor.getUTCMonth() - Math.max(0, monthOffset))
  return getMonthRange(anchor)
}

export async function POST(request: NextRequest) {
  try {
    const { email: adminEmail, response } = await resolveAdminEmail(request)
    if (response) return response

    const body = await request.json().catch(() => ({}))
    const module = String(body?.module || '').trim()
    const userId = body?.userId ? String(body.userId).trim() : ''
    const userEmail = body?.userEmail ? String(body.userEmail).trim() : ''
    const weekOffset = Number.isFinite(body?.weekOffset) ? Number(body.weekOffset) : 0
    const monthOffset = Number.isFinite(body?.monthOffset) ? Number(body.monthOffset) : 1

    const allowedModules = ['daily_prompt', 'daily_affirmation', 'weekly_insights', 'monthly_summary']
    if (!allowedModules.includes(module)) {
      return NextResponse.json({ success: false, error: 'Invalid module selection' }, { status: 400 })
    }

    const targetUser = await resolveTargetUser({
      userId: userId || null,
      userEmail: userEmail || null,
      fallbackEmail: adminEmail,
    })

    if (!targetUser?.id) {
      return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 })
    }

    if (module === 'daily_prompt') {
      const data = await generateDailyPrompt(targetUser.id)
      return NextResponse.json({
        success: true,
        module,
        targetUser,
        message: 'Daily prompt generated (not saved)',
        data,
      })
    }

    if (module === 'daily_affirmation') {
      const data = await generateDailyAffirmation(targetUser.id)
      return NextResponse.json({
        success: true,
        module,
        targetUser,
        message: data.cached ? 'Daily affirmation loaded from cache' : 'Daily affirmation generated',
        data,
      })
    }

    if (module === 'weekly_insights') {
      const { weekStart, weekEnd } = getWeekRange(Math.max(0, weekOffset))
      const digest = await generateWeeklyDigestServer(targetUser.id, weekStart, weekEnd)
      const insights = await generateWeeklyInsights(digest, targetUser.full_name || null)

      return NextResponse.json({
        success: true,
        module,
        targetUser,
        message: 'Weekly digest + insights generated (not cached)',
        data: {
          digest,
          insights,
          generatedAt: new Date().toISOString(),
        },
      })
    }

    const { monthStart, monthEnd } = getMonthRangeForOffset(monthOffset)
    const summary = await generateMonthlyReflectionSummaryServer(
      targetUser.id,
      targetUser.full_name || null,
      monthStart,
      monthEnd
    )

    return NextResponse.json({
      success: true,
      module,
      targetUser,
      message: 'Monthly summary generated (not saved)',
      data: summary,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
