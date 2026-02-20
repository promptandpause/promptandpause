import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Environment variable resolution
// Support Vercel KV naming (KV_REST_API_URL / KV_REST_API_TOKEN) as well as
// the canonical Upstash names (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
// ---------------------------------------------------------------------------
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  undefined

const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  undefined

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// ---------------------------------------------------------------------------
// In-memory fallback limiter (per-instance, non-distributed)
// ---------------------------------------------------------------------------
const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

function inMemoryCheck(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const bucket = memoryBuckets.get(identifier)

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  bucket.count += 1
  if (bucket.count <= limit) {
    return { success: true, remaining: limit - bucket.count, reset: bucket.resetAt }
  }

  return { success: false, remaining: 0, reset: bucket.resetAt }
}

// Window string to milliseconds for fallback
function windowToMs(w: string): number {
  if (w.includes('h')) return 60 * 60 * 1000
  if (w.includes('m')) {
    const n = parseInt(w) || 1
    return n * 60 * 1000
  }
  if (w.includes('s')) {
    const n = parseInt(w) || 1
    return n * 1000
  }
  return 60 * 1000
}

/**
 * Rate limiting configuration for different endpoint types
 */
export const rateLimitConfig = {
  // Strict: Auth endpoints (login, signup, password reset)
  auth: {
    limit: 5,
    window: '1 m' as const,
    message: 'Too many authentication attempts. Please try again later.'
  },
  
  // Moderate: Public API endpoints
  api: {
    limit: 20,
    window: '1 m' as const,
    message: 'Too many requests. Please slow down.'
  },
  
  // Lenient: Webhook endpoints
  webhook: {
    limit: 100,
    window: '1 m' as const,
    message: 'Webhook rate limit exceeded.'
  },
  
  // Generous: Cron endpoints (protected by secret)
  cron: {
    limit: 10,
    window: '1 m' as const,
    message: 'Cron rate limit exceeded.'
  }
}

/**
 * Create a rate limiter instance
 */
function createRateLimiter(config: { limit: number; window: '1 s' | '10 s' | '1 m' | '10 m' | '1 h' }) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return null
  }
  return new Ratelimit({
    redis: new Redis({ url: REDIS_URL, token: REDIS_TOKEN }),
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    analytics: true,
    timeout: 1000,
  })
}

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimitConfig
): Promise<{ success: boolean; remaining?: number; reset?: number; error?: string }> {
  const config = rateLimitConfig[type]

  try {
    const ratelimit = createRateLimiter(config)

    if (!ratelimit) {
      // Redis not configured — use in-memory fallback (fail-closed)
      if (IS_PRODUCTION) {
        console.warn('[SECURITY] Redis not configured in production, using in-memory rate limiter')
      }
      const mem = inMemoryCheck(identifier, config.limit, windowToMs(config.window))
      if (!mem.success) {
        return { success: false, remaining: mem.remaining, reset: mem.reset, error: config.message }
      }
      return { success: true, remaining: mem.remaining, reset: mem.reset }
    }
    
    const result = await ratelimit.limit(identifier)
    
    if (!result.success) {
      return {
        success: false,
        remaining: result.remaining,
        reset: result.reset,
        error: config.message
      }
    }
    
    return {
      success: true,
      remaining: result.remaining,
      reset: result.reset
    }
  } catch (error) {
    // FAIL-CLOSED: On Redis error, fall back to in-memory limiter
    console.error('[SECURITY] Rate limiting Redis error, using in-memory fallback:', error)
    const mem = inMemoryCheck(identifier, config.limit, windowToMs(config.window))
    if (!mem.success) {
      return { success: false, remaining: mem.remaining, reset: mem.reset, error: config.message }
    }
    return { success: true, remaining: mem.remaining, reset: mem.reset }
  }
}

/**
 * Get client identifier from request
 * Uses IP address or user ID if authenticated
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // If user is authenticated, use user ID
  if (userId) {
    return `user:${userId}`
  }
  
  // Otherwise use IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Rate limit middleware for Next.js API routes
 * Returns 429 response if rate limit exceeded
 */
export async function rateLimitMiddleware(
  request: Request,
  type: keyof typeof rateLimitConfig = 'api',
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const identifier = getRateLimitIdentifier(request, userId)
  const result = await checkRateLimit(identifier, type)
  
  if (!result.success) {
    return {
      success: false,
      error: result.error
    }
  }
  
  return { success: true }
}

/**
 * Express.js style middleware for API routes
 */
export function withRateLimit(type: keyof typeof rateLimitConfig = 'api') {
  return async (request: Request, userId?: string) => {
    return rateLimitMiddleware(request, type, userId)
  }
}
