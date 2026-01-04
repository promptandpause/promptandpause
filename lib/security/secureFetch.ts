/**
 * Secure Fetch Utility
 * 
 * Client-side utility for making secure API requests with CSRF protection.
 */

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken(): string | null {
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
 * Make a secure fetch request with CSRF protection
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCSRFToken()
  
  const headers = new Headers(options.headers || {})
  
  // Add CSRF token for non-GET requests
  if (csrfToken && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    headers.set(CSRF_HEADER_NAME, csrfToken)
  }
  
  // Ensure content type is set for JSON requests
  if (options.body && typeof options.body === 'string') {
    try {
      JSON.parse(options.body)
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
    } catch {
      // Not JSON, don't set content type
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin', // Include cookies
  })
}

/**
 * Make a secure POST request
 */
export async function securePost<T = unknown>(
  url: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await secureFetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        data: null,
        error: responseData?.error || responseData?.message || `Request failed with status ${response.status}`,
        status: response.status,
      }
    }

    return {
      data: responseData as T,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
    }
  }
}

/**
 * Make a secure PUT request
 */
export async function securePut<T = unknown>(
  url: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await secureFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        data: null,
        error: responseData?.error || responseData?.message || `Request failed with status ${response.status}`,
        status: response.status,
      }
    }

    return {
      data: responseData as T,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
    }
  }
}

/**
 * Make a secure DELETE request
 */
export async function secureDelete<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await secureFetch(url, {
      ...options,
      method: 'DELETE',
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        data: null,
        error: responseData?.error || responseData?.message || `Request failed with status ${response.status}`,
        status: response.status,
      }
    }

    return {
      data: responseData as T,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
    }
  }
}

/**
 * Make a secure PATCH request
 */
export async function securePatch<T = unknown>(
  url: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await secureFetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        data: null,
        error: responseData?.error || responseData?.message || `Request failed with status ${response.status}`,
        status: response.status,
      }
    }

    return {
      data: responseData as T,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
    }
  }
}

export default {
  fetch: secureFetch,
  post: securePost,
  put: securePut,
  delete: secureDelete,
  patch: securePatch,
  getCSRFToken,
}
