import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getFeatureFlags, getUserTier, getSubscriptionStatusMessage } from '@/lib/utils/tierManagement'

/**
 * React Hook for Tier Management
 * 
 * Automatically fetches and tracks user's subscription tier
 * and provides feature flags for conditional rendering.
 * 
 * Usage:
 * ```tsx
 * const { tier, features, isLoading } = useTier()
 * 
 * if (features.isPremium) {
 *   // Show premium content
 * }
 * ```
 */

export interface UseTierResult {
  // Tier info
  tier: 'free' | 'premium'
  subscriptionStatus: string | null
  subscriptionEndDate: Date | null
  statusMessage: string
  
  // Trial info
  isTrial: boolean
  trialEndDate: Date | null
  trialDaysRemaining: number | null
  
  // Feature flags
  features: ReturnType<typeof getFeatureFlags>
  
  // Loading state
  isLoading: boolean
  error: string | null
  
  // Helper methods
  refresh: () => Promise<void>
}

// Cache key for localStorage
const TIER_CACHE_KEY = 'pp_user_tier_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CachedTierData {
  tier: 'free' | 'premium'
  subscriptionStatus: string | null
  subscriptionEndDate: string | null
  timestamp: number
  userId: string
}

export function useTier(): UseTierResult {
  // Initialize state from cache if available
  const getCachedData = (): CachedTierData | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(TIER_CACHE_KEY)
      if (!cached || cached.trim() === '') return null
      
      const data: CachedTierData = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is still valid (within 5 minutes)
      if (now - data.timestamp < CACHE_DURATION) {
        return data
      }
      
      // Cache expired, remove it
      localStorage.removeItem(TIER_CACHE_KEY)
      return null
    } catch (err) {
      localStorage.removeItem(TIER_CACHE_KEY)
      return null
    }
  }
  
  const cachedData = getCachedData()
  
  const [tier, setTier] = useState<'free' | 'premium'>(cachedData?.tier || 'free')
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(cachedData?.subscriptionStatus || null)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(
    cachedData?.subscriptionEndDate ? new Date(cachedData.subscriptionEndDate) : null
  )
  const [isTrial, setIsTrial] = useState<boolean>(false)
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(!cachedData) // If we have cache, start with loading=false
  const [error, setError] = useState<string | null>(null)

  const fetchTierData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = getSupabaseClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setTier('free')
        setSubscriptionStatus(null)
        setIsLoading(false)
        return
      }

      // Fetch user's subscription data from profiles table including trial info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_end_date, billing_cycle, is_trial, trial_end_date, trial_start_date')
        .eq('id', user.id)
        .single()

      if (profileError) {
        // If profile doesn't exist (PGRST116 = no rows), create it
        if (profileError.code === 'PGRST116') {
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              subscription_status: 'free',
              subscription_tier: 'freemium',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (!createError) {
            // Profile created successfully, set defaults
            setTier('free')
            setSubscriptionStatus('free')
            setIsLoading(false)
            return
          }
        }
        
        setError('Failed to load subscription data')
        setTier('free')
        setSubscriptionStatus(null)
      } else if (profile) {
        // Determine tier using helper (handles expired trials/subscriptions)
        const subscriptionEnd = profile.subscription_end_date 
          ? new Date(profile.subscription_end_date) 
          : null
        const userTier = getUserTier(
          profile.subscription_status,
          null,
          subscriptionEnd
        )

        setTier(userTier)
        setSubscriptionStatus(profile.subscription_status || null)
        setSubscriptionEndDate(subscriptionEnd)
        
        // Set trial info
        setIsTrial(profile.is_trial || false)
        setTrialEndDate(
          profile.trial_end_date
            ? new Date(profile.trial_end_date)
            : null
        )
        
        // Cache the data in localStorage
        try {
          const cacheData: CachedTierData = {
            tier: userTier,
            subscriptionStatus: profile.subscription_status || null,
            subscriptionEndDate: profile.subscription_end_date || null,
            timestamp: Date.now(),
            userId: user.id
          }
          localStorage.setItem(TIER_CACHE_KEY, JSON.stringify(cacheData))
        } catch (err) {
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTier('free')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTierData()
    
    // Set up real-time subscription to profile changes
    const supabase = getSupabaseClient()
    let realtimeChannel: any = null
    let pollingInterval: NodeJS.Timeout | null = null
    
    const setupRealtimeSync = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Subscribe to changes in the profiles table for this user
      realtimeChannel = supabase
        .channel(`profile-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            // Re-fetch tier data when profile updates
            fetchTierData()
          }
        )
        .subscribe((status) => {
        })
      
      // FALLBACK: Poll every 30 seconds to check for changes (reduced from 10s)
      // This ensures updates work even if Realtime isn't properly configured
      pollingInterval = setInterval(() => {
        fetchTierData()
      }, 30000) // Poll every 30 seconds (less aggressive)
    }
    
    setupRealtimeSync()
    
    // Cleanup subscription and polling on unmount
    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe()
      }
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [])

  // Generate status message
  const statusMessage = getSubscriptionStatusMessage(subscriptionStatus, subscriptionEndDate)
  
  // Calculate trial days remaining
  const trialDaysRemaining = trialEndDate && isTrial
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return {
    tier,
    subscriptionStatus,
    subscriptionEndDate,
    statusMessage,
    isTrial,
    trialEndDate,
    trialDaysRemaining,
    features: getFeatureFlags(tier),
    isLoading,
    error,
    refresh: fetchTierData,
  }
}

/**
 * Hook to check if user can access a specific feature
 * 
 * Usage:
 * ```tsx
 * const canExport = useFeatureAccess('exportReflections')
 * ```
 */
export function useFeatureAccess(featureName: string): boolean {
  const { features, isLoading } = useTier()
  
  if (isLoading) return false
  
  // Map feature names to feature flags
  const featureMap: Record<string, boolean> = {
    dailyPrompts: features.canAccessDailyPrompts,
    unlimitedArchive: features.hasUnlimitedArchive,
    searchReflections: features.canSearchReflections,
    exportReflections: features.canExportReflections,
    advancedAnalytics: features.hasAdvancedAnalytics,
    weeklyDigest: features.hasWeeklyDigest,
    moodTrends: features.hasMoodTrends,
    slackDelivery: features.canUseSlack,
    voiceNotes: features.canUseVoiceNotes,
    customFocusAreas: features.hasCustomFocusAreas,
    prioritySupport: features.hasPrioritySupport,
  }
  
  return featureMap[featureName] ?? false
}

/**
 * Hook to get weekly prompt allowance
 * 
 * Usage:
 * ```tsx
 * const { allowance, used, remaining, canCreate } = usePromptAllowance()
 * ```
 */
export function usePromptAllowance() {
  const { features, isLoading } = useTier()
  const [used, setUsed] = useState(0)
  const [isLoadingUsage, setIsLoadingUsage] = useState(true)

  useEffect(() => {
    async function fetchWeeklyUsage() {
      try {
        setIsLoadingUsage(true)
        const supabase = getSupabaseClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setIsLoadingUsage(false)
          return
        }

        // Get start of current week (Monday)
        const today = new Date()
        const dayOfWeek = today.getDay() // 0 = Sunday
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Monday start
        const monday = new Date(today)
        monday.setDate(today.getDate() + diff)
        monday.setHours(0, 0, 0, 0)

        // Count reflections this week
        const { count, error } = await supabase
          .from('reflections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monday.toISOString())

        if (!error && count !== null) {
          setUsed(count)
        }
      } catch (err) {
      } finally {
        setIsLoadingUsage(false)
      }
    }

    if (!isLoading) {
      fetchWeeklyUsage()
    }
  }, [isLoading])

  const allowance = features.promptsPerWeek
  const remaining = Math.max(0, allowance - used)
  const canCreate = remaining > 0

  return {
    allowance,
    used,
    remaining,
    canCreate,
    isLoading: isLoading || isLoadingUsage,
  }
}

export default useTier
