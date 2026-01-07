import { createServiceRoleClient } from '@/lib/supabase/server'
import { decryptIfEncrypted } from '@/lib/utils/crypto'
import { MoodType } from '@/lib/types/reflection'

type ResurfacedReflection = {
  id: string
  date: string
  prompt_text: string
  reflection_text: string
  mood: MoodType | null
  word_count: number
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function hashToInt(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function getCooldownDays(userId: string): number {
  const n = hashToInt(userId) % 16
  return 30 + n
}

function computeLowMoodStreak(moods: MoodType[], minStreak: number): boolean {
  const low = new Set<MoodType>(['😔'])
  let streak = 0
  for (let i = moods.length - 1; i >= 0; i--) {
    if (low.has(moods[i])) streak++
    else break
  }
  return streak >= minStreak
}

function computeRecentDisengagementDip(recentDaysWithEntries: number, priorDaysWithEntries: number): boolean {
  if (priorDaysWithEntries >= 3 && recentDaysWithEntries <= 1) return true
  if (priorDaysWithEntries >= 4 && recentDaysWithEntries <= 2) return true
  return false
}

export async function getFromYourPastServer(userId: string): Promise<{
  surfaced: ResurfacedReflection | null
}> {
  const supabase = createServiceRoleClient()

  const now = new Date()
  const cooldownDays = getCooldownDays(userId)

  const MIN_WORD_COUNT = 80

  const { data: lastEvent } = await supabase
    .from('reflection_resurfacing_events')
    .select('surfaced_at')
    .eq('user_id', userId)
    .order('surfaced_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastEvent?.surfaced_at) {
    const last = new Date(lastEvent.surfaced_at)
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (24 * 60 * 60 * 1000))
    if (daysSince < cooldownDays) {
      return { surfaced: null }
    }
  }

  const recentStart = toDateOnly(addDays(now, -6))
  const recentEnd = toDateOnly(now)

  const { data: recentReflections } = await supabase
    .from('reflections')
    .select('date, mood')
    .eq('user_id', userId)
    .gte('date', recentStart)
    .lte('date', recentEnd)
    .order('date', { ascending: true })

  const recentMoods = (recentReflections || []).map((r: any) => r.mood).filter(Boolean) as MoodType[]
  const recentDaysWithEntries = new Set((recentReflections || []).map((r: any) => r.date).filter(Boolean)).size

  if (computeLowMoodStreak(recentMoods, 3)) {
    return { surfaced: null }
  }

  const priorStart = toDateOnly(addDays(now, -13))
  const priorEnd = toDateOnly(addDays(now, -7))

  const { data: priorReflections } = await supabase
    .from('reflections')
    .select('date')
    .eq('user_id', userId)
    .gte('date', priorStart)
    .lte('date', priorEnd)

  const priorDaysWithEntries = new Set((priorReflections || []).map((r: any) => r.date).filter(Boolean)).size

  if (computeRecentDisengagementDip(recentDaysWithEntries, priorDaysWithEntries)) {
    return { surfaced: null }
  }

  const oldestAllowed = toDateOnly(addDays(now, -90))

  const { data: priorEvents } = await supabase
    .from('reflection_resurfacing_events')
    .select('reflection_id')
    .eq('user_id', userId)

  const alreadySurfacedIds = new Set<string>((priorEvents || []).map((e: any) => e.reflection_id).filter(Boolean))

  const { data: candidate } = await supabase
    .from('reflections')
    .select('id, date, prompt_text, reflection_text, mood, word_count')
    .eq('user_id', userId)
    .eq('resurfacing_eligible', true)
    .lte('date', oldestAllowed)
    .order('date', { ascending: false })
    .limit(12)

  const filtered = (candidate || [])
    .filter((r: any) => !alreadySurfacedIds.has(r.id))
    .filter((r: any) => Number(r.word_count || 0) >= MIN_WORD_COUNT)

  if (filtered.length === 0) {
    return { surfaced: null }
  }

  const picked = filtered[hashToInt(`${userId}-${now.toISOString().slice(0, 10)}`) % filtered.length]

  const decryptedText = decryptIfEncrypted(picked.reflection_text) || picked.reflection_text

  const surfaced: ResurfacedReflection = {
    id: picked.id,
    date: picked.date,
    prompt_text: picked.prompt_text,
    reflection_text: decryptedText,
    mood: picked.mood || null,
    word_count: Number(picked.word_count || 0),
  }

  await supabase
    .from('reflection_resurfacing_events')
    .insert({ user_id: userId, reflection_id: surfaced.id })

  return { surfaced }
}
