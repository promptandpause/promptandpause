// Unified rate limiter with Upstash Redis backend when available.
// Falls back to in-memory buckets for local dev.

let upstashAvailable = false
let Ratelimit: any = null
let Redis: any = null

try {
  // Dynamic require so the project builds even if deps not installed yet
  // (Useful for local dev without Upstash)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Ratelimit = require('@upstash/ratelimit').Ratelimit
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Redis = require('@upstash/redis').Redis
  upstashAvailable = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
} catch {
  upstashAvailable = false
}

// Cache ratelimiters by window+limit to avoid re-creating
const upstashCache = new Map<string, any>()

function windowMsToDurationStr(ms: number): string {
  if (ms % 60000 === 0) return `${Math.max(1, Math.floor(ms / 60000))} m`
  if (ms % 1000 === 0) return `${Math.max(1, Math.floor(ms / 1000))} s`
  // default to seconds rounded up
  return `${Math.max(1, Math.ceil(ms / 1000))} s`
}

async function upstashRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfter?: number; limit: number; remaining: number; resetAt: number }> {
  if (!upstashAvailable || !Ratelimit || !Redis) {
    const local = inMemoryRateLimit(key, opts)
    return { ...local, limit: opts.limit, remaining: Math.max(0, opts.limit - (local as any).__count!), resetAt: (local as any).__resetAt! }
  }

  const duration = windowMsToDurationStr(opts.windowMs)
  const cacheKey = `${opts.limit}:${duration}`

  let limiter = upstashCache.get(cacheKey)
  if (!limiter) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(opts.limit, duration),
      analytics: true,
      prefix: 'pnp:rl',
    })
    upstashCache.set(cacheKey, limiter)
  }

  const result = await limiter.limit(key)
  const now = Date.now()
  const resetMs = typeof result.reset === 'number' && result.reset > 1e12 ? result.reset : result.reset * 1000
  if (result.success) {
    return { allowed: true, retryAfter: 0, limit: result.limit, remaining: result.remaining, resetAt: resetMs }
  }
  return { allowed: false, retryAfter: Math.max(0, resetMs - now), limit: result.limit, remaining: result.remaining, resetAt: resetMs }
}

// In-memory fallback
const buckets = new Map<string, { count: number; resetAt: number }>()
function inMemoryRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { allowed: boolean; retryAfter?: number; __count?: number; __resetAt?: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + opts.windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, retryAfter: 0, __count: 1, __resetAt: resetAt }
  }

  bucket.count += 1
  if (bucket.count <= opts.limit) {
    return { allowed: true, retryAfter: Math.max(0, bucket.resetAt - now), __count: bucket.count, __resetAt: bucket.resetAt }
  }

  return { allowed: false, retryAfter: Math.max(0, bucket.resetAt - now), __count: bucket.count, __resetAt: bucket.resetAt }
}

export async function rateLimit(
  key: string,
  opts?: { limit?: number; windowMs?: number }
): Promise<{ allowed: boolean; retryAfter?: number; limit: number; remaining: number; resetAt: number }> {
  const limit = opts?.limit ?? 30
  const windowMs = opts?.windowMs ?? 60_000

  if (upstashAvailable) {
    return upstashRateLimit(key, { limit, windowMs })
  }
  const local = inMemoryRateLimit(key, { limit, windowMs })
  return { allowed: local.allowed, retryAfter: local.retryAfter, limit, remaining: Math.max(0, limit - (local.__count || 0)), resetAt: local.__resetAt || (Date.now() + windowMs) }
}

export function getRateLimitBackend(): 'upstash' | 'memory' {
  return upstashAvailable ? 'upstash' : 'memory'
}
