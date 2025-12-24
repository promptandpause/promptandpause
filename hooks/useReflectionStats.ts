'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * Reflection statistics data
 */
export interface ReflectionStats {
  today: number
  last7Days: number
  total: number
}

/**
 * Cache key and timing
 */
const STATS_CACHE_KEY = 'pp_reflection_stats'
const STATS_CACHE_DURATION = 30 * 1000 // 30 seconds

interface CachedStatsData {
  stats: ReflectionStats
  timestamp: number
}

/**
 * Hook for fetching and caching reflection statistics
 * 
 * Features:
 * - Automatic caching with 30-second TTL
 * - Manual cache invalidation via refetch
 * - Loading and error states
 * - Automatic refetch on component mount
 * 
 * Usage:
 * ```tsx
 * const { stats, isLoading, error, refetch } = useReflectionStats()
 * 
 * // Invalidate cache when a reflection is created
 * await refetch()
 * ```
 */
export function useReflectionStats() {
  const [stats, setStats] = useState<ReflectionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use a ref to track if we've mounted to avoid double-fetching in development
  const hasMountedRef = useRef(false)

  const getCachedStats = useCallback((): CachedStatsData | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(STATS_CACHE_KEY)
      if (!cached || cached.trim() === '') return null
      
      const data: CachedStatsData = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is still valid
      if (now - data.timestamp < STATS_CACHE_DURATION) {
        console.log('📊 [useReflectionStats] Using cached stats', data.stats)
        return data
      }
      
      // Cache expired, remove it
      localStorage.removeItem(STATS_CACHE_KEY)
      return null
    } catch (err) {
      console.error('Error reading stats cache:', err)
      localStorage.removeItem(STATS_CACHE_KEY)
      return null
    }
  }, [])

  const fetchStats = useCallback(async (skipCache = false) => {
    try {
      // If not forcing fresh data, try cache first
      if (!skipCache) {
        const cached = getCachedStats()
        if (cached) {
          setStats(cached.stats)
          setIsLoading(false)
          setError(null)
          return
        }
      }

      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/reflections/stats')
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized')
          setStats(null)
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const text = await response.text()
      if (!text || !text.trim()) {
        throw new Error('Empty response body')
      }
      const data = JSON.parse(text)
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response format')
      }

      const newStats: ReflectionStats = data.data
      setStats(newStats)
      setError(null)

      // Cache the result
      try {
        const cacheData: CachedStatsData = {
          stats: newStats,
          timestamp: Date.now(),
        }
        localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(cacheData))
        console.log('💾 [useReflectionStats] Cached stats', newStats)
      } catch (err) {
        console.error('Error caching stats:', err)
      }
    } catch (err) {
      console.error('Error fetching reflection stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [getCachedStats])

  // Fetch on mount and setup Realtime subscription
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      fetchStats()
    }

    // Setup Realtime subscription for cross-tab updates
    const setupRealtimeSync = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        console.log('🔌 [useReflectionStats] Setting up Realtime subscription for user:', user.id)

        // Subscribe to changes in the reflections table for this user
        const channel = supabase
          .channel(`reflections-changes-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'reflections',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log('⚡ [useReflectionStats] Real-time reflection change detected!', payload.eventType)
              // Re-fetch stats when reflections change
              fetchStats(true) // Force fresh data, bypass cache
            }
          )
          .subscribe((status) => {
            console.log('📡 [useReflectionStats] Realtime channel status:', status)
          })

        return () => {
          console.log('🧹 [useReflectionStats] Cleaning up Realtime subscription')
          channel.unsubscribe()
        }
      } catch (err) {
        console.error('Error setting up Realtime subscription:', err)
      }
    }

    const cleanup = setupRealtimeSync()
    return () => {
      cleanup?.then(fn => fn?.())
    }
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: () => fetchStats(true), // Force fresh data
  }
}

/**
 * Hook for invalidating reflection stats cache
 * 
 * Use this when you create a reflection or generate a prompt
 * to ensure the cache is cleared
 */
export function useInvalidateReflectionStats() {
  return useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(STATS_CACHE_KEY)
      console.log('🧹 [useInvalidateReflectionStats] Cache invalidated')
    } catch (err) {
      console.error('Error invalidating stats cache:', err)
    }
  }, [])
}
