/**
 * CSRF Token API Route
 * 
 * Generates and returns a CSRF token for client-side use.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/security/csrf'

export async function GET(request: NextRequest) {
  const token = generateCSRFToken()
  
  const response = NextResponse.json({ 
    success: true,
    message: 'CSRF token generated'
  })
  
  // Set CSRF token in cookie
  response.cookies.set('csrf-token', token, {
    httpOnly: false, // Must be accessible to JavaScript for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })
  
  return response
}
