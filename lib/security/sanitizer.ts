/**
 * Input Sanitization Utilities
 * 
 * Provides comprehensive input sanitization to protect against
 * XSS, SQL injection, and other injection attacks.
 */

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

/**
 * Dangerous patterns to remove
 */
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+=/gi,           // Event handlers like onclick=
  /<script[^>]*>/gi,
  /<\/script>/gi,
  /<iframe[^>]*>/gi,
  /<\/iframe>/gi,
  /<object[^>]*>/gi,
  /<\/object>/gi,
  /<embed[^>]*>/gi,
  /<\/embed>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<style[^>]*>/gi,
  /<\/style>/gi,
  /expression\s*\(/gi,  // CSS expression
  /url\s*\(/gi,         // CSS url
]

/**
 * Input Sanitizer Class
 */
export class InputSanitizer {
  /**
   * Escape HTML entities to prevent XSS
   */
  static escapeHtml(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }
    
    return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char)
  }

  /**
   * Remove dangerous HTML patterns
   */
  static stripDangerousHtml(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    let sanitized = input

    for (const pattern of DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '')
    }

    return sanitized
  }

  /**
   * Sanitize a string for safe display
   * Removes dangerous patterns and escapes HTML
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    return this.escapeHtml(this.stripDangerousHtml(input.trim()))
  }

  /**
   * Sanitize HTML content - allows basic formatting
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    // First strip dangerous patterns
    let sanitized = this.stripDangerousHtml(input)

    // Allow only safe HTML tags
    const allowedTags = ['b', 'i', 'u', 'em', 'strong', 'br', 'p', 'span', 'div', 'a', 'ul', 'ol', 'li']
    const allowedAttributes = ['href', 'class', 'id']

    // Remove disallowed tags but keep content
    sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)[^>]*>/gi, (match, tagName) => {
      const tag = tagName.toLowerCase()
      if (allowedTags.includes(tag)) {
        // For allowed tags, sanitize attributes
        return match.replace(/\s+([a-z-]+)=["'][^"']*["']/gi, (attrMatch, attrName) => {
          if (allowedAttributes.includes(attrName.toLowerCase())) {
            // For href, validate it's not javascript:
            if (attrName.toLowerCase() === 'href') {
              const hrefMatch = attrMatch.match(/=["']([^"']*)["']/)
              if (hrefMatch && /^(https?:|mailto:|\/|#)/i.test(hrefMatch[1])) {
                return attrMatch
              }
              return ''
            }
            return attrMatch
          }
          return ''
        })
      }
      return ''
    })

    return sanitized
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    // Remove any HTML/script content first
    const stripped = this.stripDangerousHtml(input.trim().toLowerCase())
    
    // Basic email validation regex
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
    
    if (!emailRegex.test(stripped)) {
      return ''
    }

    return stripped
  }

  /**
   * Sanitize username
   */
  static sanitizeUsername(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    // Only allow alphanumeric, underscore, hyphen
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 50) // Max 50 characters
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhone(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    // Remove everything except digits and +
    return input.replace(/[^\d+]/g, '').slice(0, 20)
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    const stripped = input.trim()

    // Only allow http, https, mailto protocols
    if (!/^(https?:|mailto:)/i.test(stripped)) {
      return ''
    }

    // Remove dangerous patterns
    const sanitized = this.stripDangerousHtml(stripped)

    try {
      // Validate it's a proper URL
      new URL(sanitized)
      return sanitized
    } catch {
      return ''
    }
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    return input
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .slice(0, 255) // Max file name length
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJson<T>(input: string, defaultValue: T): T {
    if (typeof input !== 'string') {
      return defaultValue
    }

    try {
      const parsed = JSON.parse(input)
      
      // Recursively sanitize string values
      const sanitizeObject = (obj: unknown): unknown => {
        if (typeof obj === 'string') {
          return this.sanitizeString(obj)
        }
        if (Array.isArray(obj)) {
          return obj.map(sanitizeObject)
        }
        if (obj && typeof obj === 'object') {
          const sanitized: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(obj)) {
            sanitized[this.sanitizeString(key)] = sanitizeObject(value)
          }
          return sanitized
        }
        return obj
      }

      return sanitizeObject(parsed) as T
    } catch {
      return defaultValue
    }
  }

  /**
   * Sanitize number input
   */
  static sanitizeNumber(input: string | number, min?: number, max?: number): number | null {
    const num = typeof input === 'string' ? parseFloat(input) : input

    if (isNaN(num) || !isFinite(num)) {
      return null
    }

    let result = num

    if (min !== undefined && result < min) {
      result = min
    }

    if (max !== undefined && result > max) {
      result = max
    }

    return result
  }

  /**
   * Sanitize integer input
   */
  static sanitizeInteger(input: string | number, min?: number, max?: number): number | null {
    const num = this.sanitizeNumber(input, min, max)
    
    if (num === null) {
      return null
    }

    return Math.floor(num)
  }

  /**
   * Sanitize boolean input
   */
  static sanitizeBoolean(input: unknown): boolean {
    if (typeof input === 'boolean') {
      return input
    }
    
    if (typeof input === 'string') {
      const lower = input.toLowerCase().trim()
      return lower === 'true' || lower === '1' || lower === 'yes'
    }
    
    if (typeof input === 'number') {
      return input !== 0
    }

    return false
  }

  /**
   * Sanitize date input
   */
  static sanitizeDate(input: string | Date): Date | null {
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input
    }

    if (typeof input !== 'string') {
      return null
    }

    const date = new Date(input)
    return isNaN(date.getTime()) ? null : date
  }

  /**
   * Sanitize UUID
   */
  static sanitizeUUID(input: string): string | null {
    if (typeof input !== 'string') {
      return null
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const sanitized = input.trim().toLowerCase()

    return uuidRegex.test(sanitized) ? sanitized : null
  }

  /**
   * Sanitize request body with schema validation
   */
  static sanitizeRequestBody<T extends Record<string, unknown>>(
    body: unknown,
    schema: {
      [K in keyof T]: {
        type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'date' | 'html'
        required?: boolean
        default?: T[K]
        min?: number
        max?: number
        maxLength?: number
      }
    }
  ): { data: Partial<T>; errors: string[] } {
    const errors: string[] = []
    const data: Partial<T> = {}

    if (!body || typeof body !== 'object') {
      return { data, errors: ['Invalid request body'] }
    }

    const bodyObj = body as Record<string, unknown>

    for (const [key, config] of Object.entries(schema)) {
      const value = bodyObj[key]

      if (value === undefined || value === null) {
        if (config.required) {
          errors.push(`${key} is required`)
        } else if (config.default !== undefined) {
          (data as Record<string, unknown>)[key] = config.default
        }
        continue
      }

      let sanitized: unknown

      switch (config.type) {
        case 'string':
          sanitized = this.sanitizeString(String(value))
          if (config.maxLength && (sanitized as string).length > config.maxLength) {
            sanitized = (sanitized as string).slice(0, config.maxLength)
          }
          break
        case 'number':
          sanitized = this.sanitizeNumber(value as string | number, config.min, config.max)
          if (sanitized === null) {
            errors.push(`${key} must be a valid number`)
            continue
          }
          break
        case 'boolean':
          sanitized = this.sanitizeBoolean(value)
          break
        case 'email':
          sanitized = this.sanitizeEmail(String(value))
          if (!sanitized) {
            errors.push(`${key} must be a valid email`)
            continue
          }
          break
        case 'url':
          sanitized = this.sanitizeUrl(String(value))
          if (!sanitized) {
            errors.push(`${key} must be a valid URL`)
            continue
          }
          break
        case 'uuid':
          sanitized = this.sanitizeUUID(String(value))
          if (!sanitized) {
            errors.push(`${key} must be a valid UUID`)
            continue
          }
          break
        case 'date':
          sanitized = this.sanitizeDate(value as string | Date)
          if (!sanitized) {
            errors.push(`${key} must be a valid date`)
            continue
          }
          break
        case 'html':
          sanitized = this.sanitizeHtml(String(value))
          break
        default:
          sanitized = this.sanitizeString(String(value))
      }

      (data as Record<string, unknown>)[key] = sanitized
    }

    return { data, errors }
  }
}

export default InputSanitizer
