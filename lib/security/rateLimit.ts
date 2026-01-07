/**
 * Rate Limiting Middleware using Upstash Redis
 * 
 * Provides distributed rate limiting across serverless instances
 * to prevent abuse and control costs.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client (only if env vars are present)
let redis: Redis | null = null
let rateLimiters: Record<string, Ratelimit> | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
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
  // If rate limiting not configured, allow request (dev mode)
  if (!rateLimiters || !redis) {
    return { success: true }
  }

  try {
    const limiter = rateLimiters[limitType]
    if (!limiter) {
      return { success: true }
    }

    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    return {
      success,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    // On error, fail open (allow request) but log the issue
    console.error('Rate limit check failed:', error)
    return {
      success: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown'
  return `ip:${ip}`
}

/**
 * Rate limit middleware for Next.js API routes
 * Returns 429 response if rate limit exceeded
 */
export async function withRateLimit(
  request: Request,
  limitType: RateLimitType,
  userId?: string
): Promise<{ allowed: boolean; response?: Response }> {
  const identifier = getIdentifier(request, userId)
  const result = await checkRateLimit(identifier, limitType)

  if (!result.success) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60),
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
