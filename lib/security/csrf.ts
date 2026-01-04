/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Implements CSRF token generation and validation to protect
 * against unauthorized state-changing requests.
 */

import { randomBytes, createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'default-csrf-secret-change-in-production'
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

interface CSRFTokenData {
  token: string
  timestamp: number
  signature: string
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex')
  const timestamp = Date.now()
  const data = `${token}:${timestamp}`
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(data)
    .digest('hex')
  
  return Buffer.from(JSON.stringify({ token, timestamp, signature })).toString('base64')
}

/**
 * Parse and validate a CSRF token
 */
function parseCSRFToken(encodedToken: string): CSRFTokenData | null {
  try {
    const decoded = Buffer.from(encodedToken, 'base64').toString('utf-8')
    const data = JSON.parse(decoded) as CSRFTokenData
    
    if (!data.token || !data.timestamp || !data.signature) {
      return null
    }
    
    return data
  } catch {
    return null
  }
}

/**
 * Verify a CSRF token is valid and not expired
 */
export function verifyCSRFToken(encodedToken: string): boolean {
  const tokenData = parseCSRFToken(encodedToken)
  
  if (!tokenData) {
    return false
  }
  
  // Check if token is expired
  const now = Date.now()
  if (now - tokenData.timestamp > TOKEN_EXPIRY_MS) {
    return false
  }
  
  // Verify signature
  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(`${tokenData.token}:${tokenData.timestamp}`)
    .digest('hex')
  
  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const actualBuffer = Buffer.from(tokenData.signature, 'hex')
    
    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }
    
    return timingSafeEqual(expectedBuffer, actualBuffer)
  } catch {
    return false
  }
}

/**
 * Validate CSRF token from request
 * Checks both cookie and header/body for double-submit pattern
 */
export function validateCSRFRequest(request: NextRequest): { valid: boolean; error?: string } {
  // Skip CSRF validation for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(request.method)) {
    return { valid: true }
  }
  
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  
  if (!cookieToken) {
    return { valid: false, error: 'Missing CSRF cookie' }
  }
  
  // Get token from header (preferred) or form data
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  
  if (!headerToken) {
    return { valid: false, error: 'Missing CSRF header' }
  }
  
  // Validate both tokens match
  if (cookieToken !== headerToken) {
    return { valid: false, error: 'CSRF token mismatch' }
  }
  
  // Verify token is valid
  if (!verifyCSRFToken(cookieToken)) {
    return { valid: false, error: 'Invalid or expired CSRF token' }
  }
  
  return { valid: true }
}

/**
 * Add CSRF token to response cookies
 */
export function addCSRFTokenToResponse(response: NextResponse): NextResponse {
  const token = generateCSRFToken()
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be accessible to JavaScript for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_EXPIRY_MS / 1000,
  })
  
  return response
}

/**
 * Get CSRF token for client-side use
 * Call this from a server component or API route
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value
  
  if (!token || !verifyCSRFToken(token)) {
    token = generateCSRFToken()
  }
  
  return token
}

/**
 * CSRF protection middleware for API routes
 */
export function withCSRFProtection<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse<T | { error: string }>> {
  return async (request: NextRequest) => {
    const validation = validateCSRFRequest(request)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'CSRF validation failed' },
        { status: 403 }
      ) as NextResponse<{ error: string }>
    }
    
    return handler(request)
  }
}

/**
 * Client-side helper to get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }
  
  return null
}

/**
 * Client-side helper to add CSRF token to fetch headers
 */
export function getCSRFHeaders(): HeadersInit {
  const token = getCSRFTokenFromCookie()
  
  if (!token) {
    return {}
  }
  
  return {
    [CSRF_HEADER_NAME]: token,
  }
}
