/**
 * @deprecated This file is a compatibility shim, kept only in case something
 * still imports from it. The real, actively-used rate limiter is
 * lib/utils/rateLimit.ts -- new code should import `rateLimit` from there
 * directly instead of anything in this file.
 *
 * Originally this was a full second implementation of Upstash-backed rate
 * limiting (a third, alongside lib/security/rateLimit.ts and the canonical
 * lib/utils/rateLimit.ts). As of this cleanup it's a thin wrapper so there's
 * only one actual limiter (one Redis/in-memory counter store) behind every
 * call site in the app, regardless of which historical API a given route
 * happens to call.
 */

import { rateLimit } from '@/lib/utils/rateLimit'

export const rateLimitConfig: Record<string, { limit: number; windowMs: number }> = {
  auth: { limit: 5, windowMs: 60 * 1000 },
  api: { limit: 20, windowMs: 60 * 1000 },
  webhook: { limit: 100, windowMs: 60 * 1000 },
  cron: { limit: 10, windowMs: 60 * 1000 },
}

export type RateLimitConfigType = keyof typeof rateLimitConfig

export async function checkRateLimit(
  identifier: string,
  type: RateLimitConfigType = 'api'
): Promise<{ success: boolean; remaining?: number; reset?: number; error?: string }> {
  const config = rateLimitConfig[type] || rateLimitConfig.api
  const result = await rateLimit(`${type}:${identifier}`, config)

  return {
    success: result.allowed,
    remaining: result.remaining,
    reset: result.resetAt,
    error: result.allowed ? undefined : 'Too many requests',
  }
}

export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`

  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = realIp || forwarded?.split(',')[0]?.trim() || 'unknown'
  return `ip:${ip}`
}

export async function rateLimitMiddleware(
  request: Request,
  type: RateLimitConfigType,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const identifier = getRateLimitIdentifier(request, userId)
  const result = await checkRateLimit(identifier, type)
  return { success: result.success, error: result.error }
}

export function withRateLimit(type: RateLimitConfigType) {
  return async (request: Request, userId?: string) => {
    return rateLimitMiddleware(request, type, userId)
  }
}
