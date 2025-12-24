/**
 * Client-side Cache Utility
 * 
 * Prevents "flash of wrong content" by caching user data in localStorage
 * Only fetches from server when cache is invalid or missing
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  userId?: string
}

export class CacheManager {
  private static readonly PREFIX = 'pp_cache_'
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached data if valid, otherwise return null
   */
  static get<T>(key: string, userId?: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const fullKey = this.PREFIX + key
      const cached = localStorage.getItem(fullKey)
      
      if (!cached || cached.trim() === '') {
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is expired
      if (now - entry.timestamp >= this.DEFAULT_TTL) {
        this.remove(key)
        return null
      }
      
      // If userId is provided, verify it matches
      if (userId && entry.userId && entry.userId !== userId) {
        this.remove(key)
        return null
      }
      return entry.data
    } catch (err) {
      this.remove(key)
      return null
    }
  }

  /**
   * Set cache data with timestamp
   */
  static set<T>(key: string, data: T, userId?: string): void {
    if (typeof window === 'undefined') return

    try {
      const fullKey = this.PREFIX + key
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        userId
      }
      
      localStorage.setItem(fullKey, JSON.stringify(entry))
    } catch (err) {
    }
  }

  /**
   * Remove cached data
   */
  static remove(key: string): void {
    if (typeof window === 'undefined') return

    try {
      const fullKey = this.PREFIX + key
      localStorage.removeItem(fullKey)
    } catch (err) {
    }
  }

  /**
   * Clear all cache for a specific user
   */
  static clearUser(userId: string): void {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage)
      let removed = 0
      
      keys.forEach(key => {
        if (!key.startsWith(this.PREFIX)) return
        
        try {
          const cached = localStorage.getItem(key)
          if (cached && cached.trim() !== '') {
            const entry = JSON.parse(cached)
            if (entry.userId === userId) {
              localStorage.removeItem(key)
              removed++
            }
          }
        } catch {}
      })
    } catch (err) {
    }
  }

  /**
   * Clear all cache
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage)
      let removed = 0
      
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key)
          removed++
        }
      })
    } catch (err) {
    }
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    if (typeof window === 'undefined') return null

    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(k => k.startsWith(this.PREFIX))
      const now = Date.now()
      
      let validCount = 0
      let expiredCount = 0
      
      cacheKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key)
          if (cached && cached.trim() !== '') {
            const entry = JSON.parse(cached)
            if (now - entry.timestamp < this.DEFAULT_TTL) {
              validCount++
            } else {
              expiredCount++
            }
          }
        } catch {}
      })
      
      return {
        total: cacheKeys.length,
        valid: validCount,
        expired: expiredCount,
        ttl: this.DEFAULT_TTL / 1000 + 's'
      }
    } catch (err) {
      return null
    }
  }
}

/**
 * Hook-style cache getter (for React components)
 */
export function useCachedValue<T>(key: string, userId?: string): T | null {
  return CacheManager.get<T>(key, userId)
}

// Predefined cache keys (for consistency)
export const CACHE_KEYS = {
  USER_TIER: 'user_tier',
  USER_PROFILE: 'user_profile',
  REFLECTIONS: 'reflections',
  ACHIEVEMENTS: 'achievements',
  FOCUS_AREAS: 'focus_areas',
  MOOD_HISTORY: 'mood_history',
  WEEKLY_INSIGHTS: 'weekly_insights',
} as const
