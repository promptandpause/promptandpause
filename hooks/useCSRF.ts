/**
 * CSRF Token Hook
 * 
 * React hook for managing CSRF tokens in client components.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Get CSRF token from cookie
 */
function getCSRFTokenFromCookie(): string | null {
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
 * Hook for managing CSRF tokens
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Get token on mount
  useEffect(() => {
    const csrfToken = getCSRFTokenFromCookie()
    setToken(csrfToken)
    setLoading(false)
  }, [])

  // Refresh token
  const refreshToken = useCallback(async () => {
    setLoading(true)
    try {
      // Make a request to get a new CSRF token
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'same-origin',
      })
      
      if (response.ok) {
        // Token will be set in cookie by the response
        const newToken = getCSRFTokenFromCookie()
        setToken(newToken)
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get headers with CSRF token
  const getHeaders = useCallback((): HeadersInit => {
    if (!token) {
      return {}
    }

    return {
      [CSRF_HEADER_NAME]: token,
    }
  }, [token])

  // Make a secure fetch request
  const secureFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = new Headers(options.headers || {})
    
    // Add CSRF token for non-GET requests
    if (token && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
      headers.set(CSRF_HEADER_NAME, token)
    }
    
    return fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
    })
  }, [token])

  return {
    token,
    loading,
    refreshToken,
    getHeaders,
    secureFetch,
  }
}

export default useCSRF
