/**
 * Cache Service for Instant Page Loads
 * 
 * Caches user data, profile, and preferences in localStorage
 * for instant page loads while API fetches fresh data in background.
 * 
 * Strategy:
 * 1. Load from cache immediately (instant UI)
 * 2. Fetch fresh data from API in background
 * 3. Update cache with fresh data
 */

const CACHE_KEYS = {
  USER_PROFILE: 'prompt_pause_user_profile',
  USER_PREFERENCES: 'prompt_pause_user_preferences',
  USER_TIER: 'prompt_pause_user_tier',
  REFLECTIONS_COUNT: 'prompt_pause_reflections_count',
  LAST_SYNC: 'prompt_pause_last_sync',
} as const

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CachedData<T> {
  data: T
  timestamp: number
  userId: string
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cachedItem: CachedData<any> | null, userId: string): boolean {
  if (!cachedItem) return false
  if (cachedItem.userId !== userId) return false // Different user
  
  const age = Date.now() - cachedItem.timestamp
  return age < CACHE_DURATION
}

/**
 * Get data from cache
 */
export function getFromCache<T>(key: string, userId: string): T | null {
  try {
    const cached = localStorage.getItem(key)
    if (!cached || cached.trim() === '') return null

    const parsedCache: CachedData<T> = JSON.parse(cached)
    
    if (isCacheValid(parsedCache, userId)) {
      console.log(`✅ Cache hit: ${key}`)
      return parsedCache.data
    } else {
      console.log(`⏰ Cache expired: ${key}`)
      localStorage.removeItem(key)
      return null
    }
  } catch (error) {
    console.error('Cache read error:', error)
    return null
  }
}

/**
 * Save data to cache
 */
export function saveToCache<T>(key: string, data: T, userId: string): void {
  try {
    const cacheItem: CachedData<T> = {
      data,
      timestamp: Date.now(),
      userId,
    }
    localStorage.setItem(key, JSON.stringify(cacheItem))
    console.log(`💾 Cached: ${key}`)
  } catch (error) {
    console.error('Cache write error:', error)
  }
}

/**
 * Clear specific cache key
 */
export function clearCache(key: string): void {
  try {
    localStorage.removeItem(key)
    console.log(`🗑️ Cleared cache: ${key}`)
  } catch (error) {
    console.error('Cache clear error:', error)
  }
}

/**
 * Clear all app caches
 */
export function clearAllCache(): void {
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    console.log('🗑️ Cleared all caches')
  } catch (error) {
    console.error('Cache clear all error:', error)
  }
}

/**
 * Cache user profile
 */
export function cacheUserProfile(profile: any, userId: string): void {
  saveToCache(CACHE_KEYS.USER_PROFILE, profile, userId)
}

/**
 * Get cached user profile
 */
export function getCachedUserProfile(userId: string): any | null {
  return getFromCache(CACHE_KEYS.USER_PROFILE, userId)
}

/**
 * Cache user preferences
 */
export function cacheUserPreferences(preferences: any, userId: string): void {
  saveToCache(CACHE_KEYS.USER_PREFERENCES, preferences, userId)
}

/**
 * Get cached user preferences
 */
export function getCachedUserPreferences(userId: string): any | null {
  return getFromCache(CACHE_KEYS.USER_PREFERENCES, userId)
}

/**
 * Cache user tier
 */
export function cacheUserTier(tier: string, userId: string): void {
  saveToCache(CACHE_KEYS.USER_TIER, tier, userId)
}

/**
 * Get cached user tier
 */
export function getCachedUserTier(userId: string): string | null {
  return getFromCache(CACHE_KEYS.USER_TIER, userId)
}

/**
 * Cache reflections count
 */
export function cacheReflectionsCount(count: number, userId: string): void {
  saveToCache(CACHE_KEYS.REFLECTIONS_COUNT, count, userId)
}

/**
 * Get cached reflections count
 */
export function getCachedReflectionsCount(userId: string): number | null {
  return getFromCache(CACHE_KEYS.REFLECTIONS_COUNT, userId)
}

/**
 * Update last sync time
 */
export function updateLastSyncTime(userId: string): void {
  saveToCache(CACHE_KEYS.LAST_SYNC, Date.now(), userId)
}

/**
 * Get last sync time
 */
export function getLastSyncTime(userId: string): number | null {
  return getFromCache(CACHE_KEYS.LAST_SYNC, userId)
}

/**
 * Invalidate cache on logout
 */
export function invalidateCacheOnLogout(): void {
  clearAllCache()
  console.log('🔄 Cache invalidated (logout)')
}

/**
 * Prefetch and cache data for instant loads
 */
export async function prefetchUserData(userId: string): Promise<void> {
  try {
    console.log('🚀 Prefetching user data...')
    
    // Fetch in parallel
    const [profileRes, preferencesRes] = await Promise.all([
      fetch('/api/user/profile'),
      fetch('/api/user/preferences'),
    ])

    if (profileRes.ok) {
      const text = await profileRes.text()
      if (text && text.trim()) {
        const { data } = JSON.parse(text)
        if (data) cacheUserProfile(data, userId)
      }
    }

    if (preferencesRes.ok) {
      const text = await preferencesRes.text()
      if (text && text.trim()) {
        const { data } = JSON.parse(text)
        if (data) cacheUserPreferences(data, userId)
      }
    }

    updateLastSyncTime(userId)
    console.log('✅ Prefetch complete')
  } catch (error) {
    console.error('Prefetch error:', error)
  }
}
