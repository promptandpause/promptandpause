import { SupabaseClient } from '@supabase/supabase-js'

export interface GratitudeItem {
  text: string
  photo_url?: string
}

export interface GratitudeEntry {
  id: string
  user_id: string
  entry_date: string
  items: GratitudeItem[]
  reflection_id?: string
  created_at: string
  updated_at: string
}

/**
 * Get today's gratitude entry for a user
 */
export async function getTodayGratitude(
  supabase: SupabaseClient,
  userId: string
): Promise<GratitudeEntry | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', today)
      .single()

    if (error && error.code !== 'PGRST116') {
      // Silently ignore 406 (table doesn't exist yet)
      if (error.message?.includes('406') || error.code === '42P01') return null
      console.error('Error fetching gratitude:', error)
    }

    return data
  } catch {
    return null
  }
}

/**
 * Save or update today's gratitude entry
 */
export async function saveGratitude(
  supabase: SupabaseClient,
  userId: string,
  items: GratitudeItem[],
  reflectionId?: string
): Promise<{ success: boolean; data?: GratitudeEntry; error?: string }> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('gratitude_entries')
    .upsert({
      user_id: userId,
      entry_date: today,
      items,
      reflection_id: reflectionId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,entry_date'
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving gratitude:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get gratitude entries for a date range
 */
export async function getGratitudeHistory(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<GratitudeEntry[]> {
  const { data, error } = await supabase
    .from('gratitude_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: false })

  if (error) {
    console.error('Error fetching gratitude history:', error)
    return []
  }

  return data || []
}

/**
 * Get gratitude streak (consecutive days with entries)
 */
export async function getGratitudeStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('entry_date')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(30)

    if (error || !data || data.length === 0) {
      return 0
    }

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < data.length; i++) {
    const entryDate = new Date(data[i].entry_date)
    entryDate.setHours(0, 0, 0, 0)
    
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    
    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

    return streak
  } catch {
    return 0
  }
}

/**
 * Get total gratitude items count for a user
 */
export async function getTotalGratitudeCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('gratitude_entries')
    .select('items')
    .eq('user_id', userId)

  if (error || !data) {
    return 0
  }

  return data.reduce((total, entry) => {
    const items = entry.items as GratitudeItem[]
    return total + (items?.length || 0)
  }, 0)
}
