import { createServiceRoleClient } from '@/lib/supabase/server'
import { User, UserPreferences, SubscriptionTier, SubscriptionStatus } from '@/lib/types/reflection'
import { supabaseReflectionService } from './supabaseReflectionService'

/**
 * User Service for Prompt & Pause
 * 
 * Handles user profile management, preferences, and user-related statistics.
 * Uses Supabase for all database operations with proper error handling.
 */

// =============================================================================
// USER PROFILE OPERATIONS
// =============================================================================

/**
 * Get user profile from database
 * 
 * @param userId - Supabase user ID
 * @returns Promise with user profile or error
 */
export async function getUserProfile(
  userId: string
): Promise<{ user?: User; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // If profile doesn't exist (PGRST116 = no rows), create it
      if (error.code === 'PGRST116') {
        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(userId)
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: authUser?.user?.email,
            subscription_status: 'free',
            subscription_tier: 'freemium',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (createError) {
          return { error: createError.message }
        }
        return { user: newProfile as User }
      }
      
      return { error: error.message }
    }

    if (!data) {
      return { error: 'User not found' }
    }

    return { user: data as User }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update user profile fields
 * 
 * @param userId - Supabase user ID
 * @param updates - Profile fields to update
 * @returns Promise with updated user or error
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string
    avatar_url?: string
    timezone?: string
    timezone_iana?: string
    language_code?: string
  }
): Promise<{ user?: User; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    // Update profile fields (based on schema: profiles table has timezone and language columns)
    const profileUpdates: any = {
      updated_at: new Date().toISOString()
    }
    if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name
    if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url
    if (updates.timezone !== undefined) profileUpdates.timezone = updates.timezone
    if (updates.timezone_iana !== undefined) profileUpdates.timezone_iana = updates.timezone_iana
    if (updates.language_code !== undefined) profileUpdates.language = updates.language_code

    // First, try to update existing profile
    let { data, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)
      .select()
      .maybeSingle()

    // If no rows were affected (profile doesn't exist), fetch user email and create profile
    if (!data && !error) {
      // Get email from auth.users
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId)
      
      if (authError || !authUser?.email) {
        return { error: 'Could not find user email to create profile' }
      }

      // Create new profile with required fields
      const newProfile = {
        id: userId,
        email: authUser.email,
        ...profileUpdates,
        created_at: new Date().toISOString()
      }

      const insertResult = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      data = insertResult.data
      error = insertResult.error
    }

    if (error) {
      return { error: error.message }
    }
    return { user: data as User }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get basic user info (email, name) - useful for email/display purposes
 * 
 * @param userId - Supabase user ID
 * @returns Promise with basic user info or error
 */
export async function getUserBasicInfo(
  userId: string
): Promise<{
  info?: { email: string; full_name: string | null }
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { info: data }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// USER PREFERENCES OPERATIONS
// =============================================================================

/**
 * Get user preferences from database
 * 
 * @param userId - Supabase user ID
 * @returns Promise with user preferences or error
 */
export async function getUserPreferences(
  userId: string
): Promise<{ preferences?: UserPreferences; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // PGRST116 means no rows returned - user hasn't completed onboarding
      if (error.code === 'PGRST116') {
        return { preferences: undefined, error: 'No preferences found' }
      }
      return { error: error.message }
    }

    return { preferences: data as UserPreferences }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create or update user preferences
 * 
 * @param userId - Supabase user ID
 * @param preferences - Preferences to set
 * @returns Promise with updated preferences or error
 */
export async function upsertUserPreferences(
  userId: string,
  preferences: {
    reason?: string | null
    current_mood?: number | null
    prompt_time?: string
    prompt_frequency?: 'daily' | 'weekdays' | 'every-other-day' | 'twice-weekly' | 'weekly' | 'custom'
    custom_days?: string[] | null
    delivery_method?: 'email' | 'slack' | 'both'
    slack_webhook_url?: string | null
    focus_areas?: string[]
    push_notifications?: boolean
    daily_reminders?: boolean
    weekly_digest?: boolean
  }
): Promise<{ preferences?: UserPreferences; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }
    return { preferences: data as UserPreferences }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update specific user preference fields
 * 
 * @param userId - Supabase user ID
 * @param updates - Preference fields to update
 * @returns Promise with updated preferences or error
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<{ preferences?: UserPreferences; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }
    return { preferences: data as UserPreferences }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Check user's current subscription tier
 * 
 * @param userId - Supabase user ID
 * @returns Promise with subscription tier or error
 */
export async function checkSubscriptionTier(
  userId: string
): Promise<{ tier?: SubscriptionTier; status?: SubscriptionStatus; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single()

    if (error) {
      return { error: error.message }
    }

    return {
      tier: data.subscription_tier as SubscriptionTier,
      status: data.subscription_status as SubscriptionStatus,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update user's subscription information (Stripe customer/subscription IDs and tier)
 * 
 * @param userId - Supabase user ID
 * @param stripeCustomerId - Stripe customer ID
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param tier - Subscription tier ('freemium' or 'premium')
 * @param status - Subscription status ('active', 'cancelled', 'expired')
 * @returns Promise with success status or error
 */
export async function updateSubscriptionInfo(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  tier: SubscriptionTier,
  status: SubscriptionStatus = 'active'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        subscription_tier: tier,
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if user has premium access
 * 
 * @param userId - Supabase user ID
 * @returns Promise with boolean indicating premium access
 */
export async function hasPremiumAccess(
  userId: string
): Promise<{ hasPremium: boolean; error?: string }> {
  try {
    const { tier, status, error } = await checkSubscriptionTier(userId)

    if (error) {
      return { hasPremium: false, error }
    }

    const hasPremium = tier === 'premium' && status === 'active'

    return { hasPremium }
  } catch (error) {
    return {
      hasPremium: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// USER STATISTICS
// =============================================================================

/**
 * Get user statistics (total reflections, current streak, account age)
 * 
 * @param userId - Supabase user ID
 * @returns Promise with user statistics or error
 */
export async function getUserStatistics(
  userId: string
): Promise<{
  stats?: {
    totalReflections: number
    currentStreak: number
    accountAge: number
    averageWordCount: number
    lastReflectionDate: string | null
  }
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()

    // Get user created date
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single()

    if (userError) {
      return { error: userError.message }
    }

    // Get all reflections for this user
    const reflections = await supabaseReflectionService.getAllReflections()

    // Calculate statistics
    const totalReflections = reflections.length

    // Calculate current streak (reuse from supabaseAnalyticsService)
    let currentStreak = 0
    if (totalReflections > 0) {
      const today = new Date()
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]

        const hasReflection = reflections.some(r => r.date === dateStr)
        if (hasReflection) {
          currentStreak++
        } else if (i > 0) {
          break
        }
      }
    }

    // Calculate account age in days
    const accountCreated = new Date(userData.created_at)
    const accountAge = Math.floor(
      (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate average word count
    const totalWords = reflections.reduce((sum, r) => sum + r.word_count, 0)
    const averageWordCount = totalReflections > 0 ? Math.round(totalWords / totalReflections) : 0

    // Get last reflection date
    const lastReflectionDate = totalReflections > 0 ? reflections[0].date : null

    return {
      stats: {
        totalReflections,
        currentStreak,
        accountAge,
        averageWordCount,
        lastReflectionDate,
      },
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get user's reflection activity summary for dashboard
 * 
 * @param userId - Supabase user ID
 * @returns Promise with activity summary or error
 */
export async function getUserActivitySummary(
  userId: string
): Promise<{
  summary?: {
    todayReflection: boolean
    weekReflections: number
    monthReflections: number
    currentStreak: number
  }
  error?: string
}> {
  try {
    // Get today's date and calculate date ranges
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    const monthAgo = new Date(today)
    monthAgo.setDate(today.getDate() - 30)
    const monthAgoStr = monthAgo.toISOString().split('T')[0]

    // Get reflections
    const allReflections = await supabaseReflectionService.getAllReflections()
    const weekReflections = await supabaseReflectionService.getReflectionsByDateRange(
      weekAgoStr,
      todayStr
    )
    const monthReflections = await supabaseReflectionService.getReflectionsByDateRange(
      monthAgoStr,
      todayStr
    )

    // Check if user has reflected today
    const todayReflection = allReflections.some(r => r.date === todayStr)

    // Calculate current streak
    let currentStreak = 0
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const hasReflection = allReflections.some(r => r.date === dateStr)
      if (hasReflection) {
        currentStreak++
      } else if (i > 0) {
        break
      }
    }

    return {
      summary: {
        todayReflection,
        weekReflections: weekReflections.length,
        monthReflections: monthReflections.length,
        currentStreak,
      },
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// USER DELETION & CLEANUP
// =============================================================================

/**
 * Delete user account and all associated data
 * ⚠️ WARNING: This is a destructive operation and cannot be undone
 * 
 * @param userId - Supabase user ID
 * @returns Promise with success status or error
 */
export async function deleteUserAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    // Delete from users table (cascading deletes will handle related data)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if user has completed onboarding
 * 
 * @param userId - Supabase user ID
 * @returns Promise with boolean indicating onboarding completion
 */
export async function hasCompletedOnboarding(
  userId: string
): Promise<{ completed: boolean; error?: string }> {
  try {
    const { preferences, error } = await getUserPreferences(userId)

    if (error) {
      // If error is "No preferences found", onboarding is not complete
      if (error === 'No preferences found') {
        return { completed: false }
      }
      return { completed: false, error }
    }

    return { completed: !!preferences }
  } catch (error) {
    return {
      completed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get full user context (profile + preferences + stats) for personalization
 * 
 * @param userId - Supabase user ID
 * @returns Promise with complete user context or error
 */
export async function getUserContext(
  userId: string
): Promise<{
  context?: {
    user: User
    preferences: UserPreferences | null
    stats: {
      totalReflections: number
      currentStreak: number
      accountAge: number
      averageWordCount: number
      lastReflectionDate: string | null
    }
  }
  error?: string
}> {
  try {
    // Fetch all data in parallel
    const [userResult, preferencesResult, statsResult] = await Promise.all([
      getUserProfile(userId),
      getUserPreferences(userId),
      getUserStatistics(userId),
    ])

    if (userResult.error) {
      return { error: userResult.error }
    }

    if (statsResult.error) {
      return { error: statsResult.error }
    }

    return {
      context: {
        user: userResult.user!,
        preferences: preferencesResult.preferences || null,
        stats: statsResult.stats!,
      },
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// FOCUS AREAS - PREMIUM CUSTOM & FREEMIUM PREDEFINED
// =============================================================================

/**
 * Get user's subscription tier
 * 
 * @param userId - Supabase user ID
 * @returns Promise with tier or error
 */
export async function getUserTier(
  userId: string
): Promise<{ tier: SubscriptionTier; error?: string }> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return { tier: 'freemium' }
    }

    const tier =
      data.subscription_status === 'active' ? data.subscription_tier : 'freemium'
    return { tier }
  } catch (error) {
    return { tier: 'freemium' }
  }
}

/**
| * List all focus areas for user
| * 
| * Priority:
| * 1. If user has custom focus areas (premium feature) → use those
| * 2. If no custom areas → fall back to predefined areas from onboarding
| * 
| * @param userId - Supabase user ID
| * @returns Promise with list of focus areas
| */
export async function listFocusAreas(
  userId: string
): Promise<{
  areas: Array<{ id?: string; name: string; priority?: number; isPremium: boolean }>
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()
    const { tier } = await getUserTier(userId)
    const areas: Array<{
      id?: string
      name: string
      priority?: number
      isPremium: boolean
    }> = []

    // PRIORITY 1: Check for premium custom focus areas
    if (tier === 'premium') {
      const { data, error } = await supabase
        .from('focus_areas')
        .select('id, name, priority')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) {
      } else if (data && data.length > 0) {
        // User has custom areas - use them exclusively
        areas.push(
          ...data.map((a) => ({
            id: a.id,
            name: a.name,
            priority: a.priority,
            isPremium: true,
          }))
        )
        return { areas }
      }
    }

    // PRIORITY 2: Fall back to freemium predefined areas from onboarding
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('focus_areas')
      .eq('user_id', userId)
      .single()

    if (!prefsError && prefs?.focus_areas && Array.isArray(prefs.focus_areas)) {
      areas.push(
        ...prefs.focus_areas.map((name: string) => ({
          name,
          isPremium: false,
        }))
      )
    } else {
    }

    return { areas }
  } catch (error) {
    return { areas: [], error: String(error) }
  }
}

/**
 * Create custom focus area (premium only)
 * 
 * @param userId - Supabase user ID
 * @param data - Focus area data
 * @returns Promise with created area or error
 */
export async function createFocusArea(
  userId: string,
  data: { name: string; description?: string; priority?: number }
): Promise<{ area?: any; error?: string }> {
  try {
    const { tier } = await getUserTier(userId)
    if (tier !== 'premium') {
      return { error: 'Custom focus areas are a premium feature' }
    }

    const supabase = createServiceRoleClient()
    const { data: area, error } = await supabase
      .from('focus_areas')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        priority: data.priority || 0,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }
    return { area }
  } catch (error) {
    return { error: String(error) }
  }
}

/**
 * Update focus area (premium only)
 * 
 * @param areaId - Focus area ID
 * @param userId - Supabase user ID
 * @param updates - Fields to update
 * @returns Promise with updated area or error
 */
export async function updateFocusArea(
  areaId: string,
  userId: string,
  updates: Partial<{ name: string; description: string; priority: number; is_active: boolean }>
): Promise<{ area?: any; error?: string }> {
  try {
    const { tier } = await getUserTier(userId)
    if (tier !== 'premium') {
      return { error: 'Custom focus areas are a premium feature' }
    }

    const supabase = createServiceRoleClient()
    const { data: area, error } = await supabase
      .from('focus_areas')
      .update(updates)
      .eq('id', areaId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }
    return { area }
  } catch (error) {
    return { error: String(error) }
  }
}

/**
 * Delete focus area (premium only)
 * 
 * @param areaId - Focus area ID
 * @param userId - Supabase user ID
 * @returns Promise with success status or error
 */
export async function deleteFocusArea(
  areaId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { tier } = await getUserTier(userId)
    if (tier !== 'premium') {
      return { success: false, error: 'Custom focus areas are a premium feature' }
    }

    const supabase = createServiceRoleClient()
    const { error } = await supabase
      .from('focus_areas')
      .delete()
      .eq('id', areaId)
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
