// Minimal structured logger with PII redaction
// Usage: logger.info('event_name', { email, user_id, ... })

const SENSITIVE_KEYS = new Set([
  'email', 'admin_email', 'target_user_email', 'recipient_email',
  'user_id', 'target_user_id', 'stripe_customer_id', 'subscription_id',
])

function redactValue(key: string, value: any): any {
  if (value == null) return value
  if (SENSITIVE_KEYS.has(key)) {
    if (typeof value === 'string') {
      // keep small hint for traceability
      const atIndex = value.indexOf('@')
      if (atIndex > 1) return value[0] + '***' + value.slice(atIndex)
      return value.length > 4 ? value.slice(0, 2) + '***' : '***'
    }
    return '***'
  }
  return value
}

function redact(obj: any): any {
  if (obj == null) return obj
  if (Array.isArray(obj)) return obj.map(redact)
  if (typeof obj === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = typeof v === 'object' && v !== null ? redact(v) : redactValue(k, v)
    }
    return out
  }
  return obj
}

function toSafeError(err: any) {
  if (!err) return null
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  return redact(err)
}

function log(level: 'info'|'warn'|'error', event: string, meta?: any) {
  const entry = {
    level,
    event,
    ts: new Date().toISOString(),
    meta: redact(meta),
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (event: string, meta?: any) => log('info', event, meta),
  warn: (event: string, meta?: any) => log('warn', event, meta),
  error: (event: string, meta?: any) => log('error', event, toSafeError(meta)),
}
