/**
 * @deprecated This file is a compatibility shim, kept only in case something
 * still imports from it. The real, actively-used rate limiter is
 * lib/utils/rateLimit.ts -- new code should import `rateLimit` from there
 * directly instead of anything in this file.
 *
 * Originally this was a full second implementation of Upstash-backed rate
 * limiting, duplicating lib/utils/rateLimit.ts. As of this cleanup it's a
 * thin wrapper so there's only one actual limiter (one Redis/in-memory
 * counter store) behind every call site in the app, regardless of which of
 * the historical APIs a given route happens to call.
 */

import { rateLimit } from '@/lib/utils/rateLimit'

const LIMIT_CONFIGS: Record<string, { limit: number; windowMs: number }> = {
  auth: { limit: 10, windowMs: 5 * 60 * 1000 },
  promptGeneration: { limit: 20, windowMs: 60 * 60 * 1000 },
  cron: { limit: 5, windowMs: 60 * 1000 },
  export: { limit: 3, windowMs: 60 * 60 * 1000 },
  api: { limit: 100, windowMs: 60 * 1000 },
  admin: { limit: 10, windowMs: 5 * 60 * 1000 },
}

export type RateLimitType = 'auth' | 'promptGeneration' | 'cron' | 'export' | 'api' | 'admin'

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
  const config = LIMIT_CONFIGS[limitType] || LIMIT_CONFIGS.api
  const result = await rateLimit(`${limitType}:${identifier}`, config)

  return {
    success: result.allowed,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.resetAt,
  }
}

export function getIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`

  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0]?.trim() || 'unknown'
  return `ip:${ip}`
}

export async function withRateLimit(
  request: Request,
  limitType: RateLimitType,
  userId?: string
): Promise<{ allowed: boolean; response?: Response }> {
  const identifier = getIdentifier(request, userId)
  const result = await checkRateLimit(identifier, limitType)

  if (!result.success) {
    const retryAfter = result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60

    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: 'Too many requests', retryAfter: Math.max(retryAfter, 1) }),
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
