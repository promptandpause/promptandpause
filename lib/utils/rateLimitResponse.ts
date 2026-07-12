import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/utils/rateLimit'

/**
 * Convenience wrapper around lib/utils/rateLimit.ts for API routes.
 * Returns null if the request is allowed, or a ready-to-return 429
 * NextResponse if the caller has exceeded the limit.
 *
 * Usage:
 *   const limited = await rateLimitOr429(`comments:${user.id}`, { limit: 10, windowMs: 60_000 })
 *   if (limited) return limited
 */
export async function rateLimitOr429(
  key: string,
  opts: { limit: number; windowMs: number }
): Promise<NextResponse | null> {
  const rl = await rateLimit(key, opts)

  if (!rl.allowed) {
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', String(rl.limit))
    headers.set('X-RateLimit-Remaining', String(Math.max(0, rl.remaining)))
    headers.set('X-RateLimit-Reset', String(rl.resetAt))
    headers.set('Retry-After', String(Math.max(1, Math.ceil((rl.retryAfter || 0) / 1000))))

    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers }
    )
  }

  return null
}
