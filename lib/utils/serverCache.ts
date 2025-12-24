/**
 * Server-Side Cache Utility - Email Templates & Maintenance Status
 * 
 * Provides in-memory caching with TTL support for frequently accessed data.
 * Can be extended to use Redis in production for distributed caching.
 * 
 * This is separate from the client-side cache in cache.ts
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class ServerCacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set a cached value with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL
    const expiresAt = Date.now() + ttl

    this.cache.set(key, {
      data,
      expiresAt,
    })
  }

  /**
   * Delete a cached value or pattern
   */
  delete(keyOrPattern: string): void {
    if (keyOrPattern.includes('*')) {
      // Pattern matching for wildcard deletes
      const pattern = keyOrPattern.replace(/\*/g, '')
      const keysToDelete: string[] = []

      this.cache.forEach((_, key) => {
        if (key.startsWith(pattern) || key.includes(pattern)) {
          keysToDelete.push(key)
        }
      })

      keysToDelete.forEach((key) => this.cache.delete(key))
    } else {
      this.cache.delete(keyOrPattern)
    }
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.cache.delete(key))
  }
}

// Singleton instance
const serverCacheManager = new ServerCacheManager()

// Run cleanup every 5 minutes (server-side only)
if (typeof window === 'undefined') {
  setInterval(() => {
    serverCacheManager.cleanup()
  }, 5 * 60 * 1000)
}

// ============================================================================
// Email Template Cache Helpers
// ============================================================================

export const EmailTemplateCache = {
  /**
   * Get cached email template by key
   */
  getByKey(templateKey: string) {
    return serverCacheManager.get(`email_template:${templateKey}`)
  },

  /**
   * Get all cached templates
   */
  getAll() {
    return serverCacheManager.get('email_templates:all')
  },

  /**
   * Set cached email template
   */
  set(templateKey: string, template: any, ttlMs?: number) {
    serverCacheManager.set(`email_template:${templateKey}`, template, ttlMs)
  },

  /**
   * Set all templates cache
   */
  setAll(templates: any[], ttlMs?: number) {
    serverCacheManager.set('email_templates:all', templates, ttlMs)
  },

  /**
   * Delete cached email template
   */
  delete(templateKey: string) {
    serverCacheManager.delete(`email_template:${templateKey}`)
  },

  /**
   * Bust all email template caches
   */
  bustAll() {
    serverCacheManager.delete('email_template*')
  },
}

// ============================================================================
// Maintenance Status Cache Helpers
// ============================================================================

export const MaintenanceCache = {
  /**
   * Get cached maintenance status
   * TTL: 30 seconds (very short for critical status)
   */
  getStatus() {
    return serverCacheManager.get<{ 
      is_maintenance_mode: boolean
      maintenance_window_id: string | null 
    }>('maintenance:status')
  },

  /**
   * Set cached maintenance status
   * Default TTL: 30 seconds
   */
  setStatus(status: { is_maintenance_mode: boolean; maintenance_window_id: string | null }) {
    serverCacheManager.set('maintenance:status', status, 30 * 1000) // 30 seconds
  },

  /**
   * Delete maintenance status cache
   */
  deleteStatus() {
    serverCacheManager.delete('maintenance:status')
  },

  /**
   * Get cached maintenance windows by status
   */
  getWindows(status?: string) {
    const key = status ? `maintenance:windows:${status}` : 'maintenance:windows:all'
    return serverCacheManager.get(key)
  },

  /**
   * Set cached maintenance windows
   */
  setWindows(windows: any[], status?: string, ttlMs?: number) {
    const key = status ? `maintenance:windows:${status}` : 'maintenance:windows:all'
    serverCacheManager.set(key, windows, ttlMs)
  },

  /**
   * Bust all maintenance caches
   */
  bustAll() {
    serverCacheManager.delete('maintenance:*')
  },
}

// ============================================================================
// General Cache Access (for advanced usage)
// ============================================================================

export const ServerCache = {
  get: serverCacheManager.get.bind(serverCacheManager),
  set: serverCacheManager.set.bind(serverCacheManager),
  delete: serverCacheManager.delete.bind(serverCacheManager),
  clear: serverCacheManager.clear.bind(serverCacheManager),
  getStats: serverCacheManager.getStats.bind(serverCacheManager),
  cleanup: serverCacheManager.cleanup.bind(serverCacheManager),
}

// ============================================================================
// Cache Warming (Optional - for production)
// ============================================================================

/**
 * Warm up cache with frequently accessed data on server start
 * Call this in your server initialization or API route
 */
export async function warmServerCache() {
  try {
    console.log('[ServerCache] Cache warming initiated')
    
    // This would be called from a separate initialization script
    // Example: Pre-load active email templates
    // const { getAllEmailTemplates } = await import('@/lib/services/emailTemplateService')
    // const result = await getAllEmailTemplates()
    // if (result.success && result.data) {
    //   EmailTemplateCache.setAll(result.data)
    // }
    
    console.log('[ServerCache] Cache warming completed')
  } catch (error) {
    console.error('[ServerCache] Failed to warm cache:', error)
  }
}

// ============================================================================
// Production Note
// ============================================================================
// For production with multiple server instances, replace this in-memory cache
// with Redis using a library like ioredis or @vercel/kv for edge deployments.
// 
// Migration example:
// 
// import { kv } from '@vercel/kv'
// 
// export const EmailTemplateCache = {
//   async getByKey(templateKey: string) {
//     return await kv.get(`email_template:${templateKey}`)
//   },
//   async set(templateKey: string, template: any, ttlSeconds = 300) {
//     return await kv.set(`email_template:${templateKey}`, template, { ex: ttlSeconds })
//   },
//   // ... etc
// }
// ============================================================================
