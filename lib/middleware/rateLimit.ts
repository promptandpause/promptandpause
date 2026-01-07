import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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
  return new Ratelimit({
    redis: Redis.fromEnv(),
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
  try {
    const config = rateLimitConfig[type]
    const ratelimit = createRateLimiter(config)
    
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
    // If rate limiting fails (e.g., Redis down), allow request (fail open)
    console.error('Rate limiting error:', error)
    return { success: true }
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
