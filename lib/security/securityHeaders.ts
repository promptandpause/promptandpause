/**
 * Security Headers Configuration
 * 
 * Implements essential HTTP security headers to protect against
 * common web vulnerabilities like XSS, clickjacking, and MIME sniffing.
 */

import { NextResponse } from 'next/server'

export interface SecurityHeadersConfig {
  enableHSTS: boolean
  enableCSP: boolean
  enableXSSProtection: boolean
  enableFrameOptions: boolean
  enableContentTypeOptions: boolean
  enableReferrerPolicy: boolean
  enablePermissionsPolicy: boolean
  cspDirectives?: Record<string, string[]>
}

const defaultConfig: SecurityHeadersConfig = {
  enableHSTS: true,
  enableCSP: true,
  enableXSSProtection: true,
  enableFrameOptions: true,
  enableContentTypeOptions: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true,
}

const defaultCSPDirectives: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com', 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https:', 'https://www.googletagmanager.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'connect-src': ["'self'", 'https://*.supabase.co', 'https://api.stripe.com', 'https://ipapi.co', 'https://www.google-analytics.com', 'wss://*.supabase.co'],
  'frame-src': ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
}

/**
 * Build Content Security Policy header value
 */
function buildCSP(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key
      }
      return `${key} ${values.join(' ')}`
    })
    .join('; ')
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: Partial<SecurityHeadersConfig> = {}
): NextResponse {
  const finalConfig = { ...defaultConfig, ...config }
  const cspDirectives = config.cspDirectives || defaultCSPDirectives

  // HTTP Strict Transport Security (HSTS)
  // Forces HTTPS connections for 1 year, including subdomains
  if (finalConfig.enableHSTS) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Content Security Policy (CSP)
  // Controls which resources can be loaded
  if (finalConfig.enableCSP) {
    response.headers.set('Content-Security-Policy', buildCSP(cspDirectives))
  }

  // X-XSS-Protection
  // Legacy XSS protection for older browsers
  if (finalConfig.enableXSSProtection) {
    response.headers.set('X-XSS-Protection', '1; mode=block')
  }

  // X-Frame-Options
  // Prevents clickjacking by disallowing embedding in frames
  if (finalConfig.enableFrameOptions) {
    response.headers.set('X-Frame-Options', 'DENY')
  }

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  if (finalConfig.enableContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  // Referrer-Policy
  // Controls referrer information sent with requests
  if (finalConfig.enableReferrerPolicy) {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  // Permissions-Policy
  // Controls browser features and APIs
  if (finalConfig.enablePermissionsPolicy) {
    response.headers.set(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self "https://js.stripe.com"), usb=()'
    )
  }

  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  return response
}

/**
 * Get security headers as an object (for API routes)
 */
export function getSecurityHeadersObject(
  config: Partial<SecurityHeadersConfig> = {}
): Record<string, string> {
  const finalConfig = { ...defaultConfig, ...config }
  const cspDirectives = config.cspDirectives || defaultCSPDirectives
  const headers: Record<string, string> = {}

  if (finalConfig.enableHSTS) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  if (finalConfig.enableCSP) {
    headers['Content-Security-Policy'] = buildCSP(cspDirectives)
  }

  if (finalConfig.enableXSSProtection) {
    headers['X-XSS-Protection'] = '1; mode=block'
  }

  if (finalConfig.enableFrameOptions) {
    headers['X-Frame-Options'] = 'DENY'
  }

  if (finalConfig.enableContentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff'
  }

  if (finalConfig.enableReferrerPolicy) {
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
  }

  if (finalConfig.enablePermissionsPolicy) {
    headers['Permissions-Policy'] = 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self "https://js.stripe.com"), usb=()'
  }

  headers['X-DNS-Prefetch-Control'] = 'on'
  headers['X-Download-Options'] = 'noopen'
  headers['X-Permitted-Cross-Domain-Policies'] = 'none'

  return headers
}
