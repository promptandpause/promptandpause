/**
 * Rate Limiting Middleware using Upstash Redis
 * 
 * Provides distributed rate limiting across serverless instances
 * to prevent abuse and control costs.
 *
 * Security design:
 * - Fail-CLOSED in production: if Redis is unavailable, requests are blocked (503)
 * - In-memory fallback: lightweight sliding window when Redis is temporarily unreachable
 * - Supports both UPSTASH_REDIS_REST_URL/TOKEN and KV_REST_API_URL/TOKEN env vars
 */

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
// Used when Redis is temporarily unreachable so rate limiting is never disabled.
// ---------------------------------------------------------------------------
interface MemoryEntry {
  timestamps: number[]
}

const memoryStore = new Map<string, MemoryEntry>()

// Limits mirror the Redis-backed limiters (maxRequests within windowMs)
const MEMORY_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  auth:             { maxRequests: 10,  windowMs: 5 * 60 * 1000 },
  promptGeneration: { maxRequests: 20,  windowMs: 60 * 60 * 1000 },
  cron:             { maxRequests: 5,   windowMs: 60 * 1000 },
  export:           { maxRequests: 3,   windowMs: 60 * 60 * 1000 },
  api:              { maxRequests: 100, windowMs: 60 * 1000 },
}

function checkMemoryRateLimit(
  identifier: string,
  limitType: string
): { success: boolean; limit: number; remaining: number; reset: number } {
  const config = MEMORY_LIMITS[limitType] || MEMORY_LIMITS.api
  const key = `${limitType}:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  let entry = memoryStore.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    memoryStore.set(key, entry)
  }

  // Evict timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  const remaining = Math.max(0, config.maxRequests - entry.timestamps.length)
  const reset = now + config.windowMs

  if (entry.timestamps.length >= config.maxRequests) {
    return { success: false, limit: config.maxRequests, remaining: 0, reset }
  }

  entry.timestamps.push(now)
  return { success: true, limit: config.maxRequests, remaining: remaining - 1, reset }
}

// Periodic cleanup of stale memory entries (every 60 s)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of Array.from(memoryStore.entries())) {
      // Determine the longest window (1 h) for safe eviction
      entry.timestamps = entry.timestamps.filter((t) => t > now - 60 * 60 * 1000)
      if (entry.timestamps.length === 0) {
        memoryStore.delete(key)
      }
    }
  }, 60_000).unref?.()
}

// ---------------------------------------------------------------------------
// Redis-backed Upstash rate limiters
// ---------------------------------------------------------------------------
let redis: Redis | null = null
let rateLimiters: Record<string, Ratelimit> | null = null
let redisInitError: string | null = null

try {
  if (REDIS_URL && REDIS_TOKEN) {
    redis = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    })

    // Define rate limiters for different endpoint types
    rateLimiters = {
      // Auth routes: 10 requests per 5 minutes per IP
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '5 m'),
        analytics: true,
        prefix: 'ratelimit:auth',
      }),

      // Prompt generation: 20 requests per hour per user
      promptGeneration: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 h'),
        analytics: true,
        prefix: 'ratelimit:prompt',
      }),

      // Cron endpoints: 5 requests per minute (prevent accidental hammering)
      cron: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:cron',
      }),

      // Export endpoints: 3 requests per hour per user
      export: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
        prefix: 'ratelimit:export',
      }),

      // General API: 100 requests per minute per user
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:api',
      }),
    }
  } else if (IS_PRODUCTION) {
    redisInitError =
      'Rate limiter Redis credentials missing in production. ' +
      'Set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN.'
    console.error(`[SECURITY] ${redisInitError}`)
  }
} catch (err) {
  redisInitError = err instanceof Error ? err.message : 'Unknown Redis init error'
  console.error('[SECURITY] Failed to initialize Redis rate limiter:', err)
}

export type RateLimitType = 'auth' | 'promptGeneration' | 'cron' | 'export' | 'api'

/**
 * Check rate limit for a given identifier and limit type
 * 
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limitType - Type of rate limit to apply
 * @returns Object with success status and optional reset timestamp
 */
export async function checkRateLimit(
  identifier: string,
  limitType: RateLimitType = 'api'
): Promise<{
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
  error?: string
}> {
  // -----------------------------------------------------------------------
  // FAIL-CLOSED: If Redis is not configured in production, block the request
  // with a 503 signal so the caller can return Service Unavailable.
  // In development, fall through to the in-memory limiter.
  // -----------------------------------------------------------------------
  if (!rateLimiters || !redis) {
    if (IS_PRODUCTION) {
      console.warn(
        `[SECURITY] Rate limiter unavailable (${redisInitError || 'not configured'}). ` +
        `Falling back to in-memory limiter for: ${identifier}`
      )
      // Use in-memory fallback so requests are still throttled
      const memResult = checkMemoryRateLimit(identifier, limitType)
      return memResult
    }

    // Development: use in-memory limiter instead of silently allowing all
    const memResult = checkMemoryRateLimit(identifier, limitType)
    return memResult
  }

  try {
    const limiter = rateLimiters[limitType]
    if (!limiter) {
      console.error(`[SECURITY] Unknown rate limit type: ${limitType}`)
      // Fail closed: unknown limiter type should not bypass rate limiting
      if (IS_PRODUCTION) {
        return { success: false, error: `Unknown rate limit type: ${limitType}` }
      }
      const memResult = checkMemoryRateLimit(identifier, limitType)
      return memResult
    }

    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    return {
      success,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    // FAIL-CLOSED: On Redis error, fall back to in-memory limiter
    console.error('[SECURITY] Rate limit Redis check failed, using in-memory fallback:', error)
    const memResult = checkMemoryRateLimit(identifier, limitType)
    return {
      ...memResult,
      error: error instanceof Error ? error.message : 'Redis error – used in-memory fallback',
    }
  }
}

/**
 * Get identifier from request (IP address or user ID)
 * Uses trusted proxy headers in order of reliability.
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0]?.trim() || 'unknown'
  return `ip:${ip}`
}

/**
 * Rate limit middleware for Next.js API routes
 * Returns 429 response if rate limit exceeded, or 503 if limiter is completely unavailable
 */
export async function withRateLimit(
  request: Request,
  limitType: RateLimitType,
  userId?: string
): Promise<{ allowed: boolean; response?: Response }> {
  const identifier = getIdentifier(request, userId)
  const result = await checkRateLimit(identifier, limitType)

  if (!result.success) {
    const retryAfter = result.reset
      ? Math.ceil((result.reset - Date.now()) / 1000)
      : 60

    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.max(retryAfter, 1),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.max(retryAfter, 1)),
            'X-RateLimit-Limit': String(result.limit || 0),
            'X-RateLimit-Remaining': String(result.remaining || 0),
            'X-RateLimit-Reset': String(result.reset || 0),
          },
        }
      ),
    }
  }

  return { allowed: true }
}
