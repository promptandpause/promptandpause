import { createBrowserClient } from '@supabase/ssr'

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getCookie(name: string) {
  if (!isBrowser()) return undefined
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

type CookieOptionsSubset = {
  path?: string
  maxAge?: number
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
}

function setCookie(name: string, value: string, options?: CookieOptionsSubset) {
  if (!isBrowser()) return
  const path = options?.path ?? '/'
  const maxAge = options?.maxAge
  const sameSite = options?.sameSite ?? 'lax'
  const secure = options?.secure ?? (process.env.NODE_ENV === 'production')

  let cookie = `${name}=${value}; path=${path}; SameSite=${sameSite}`
  if (secure) cookie += '; Secure'
  if (typeof maxAge === 'number') cookie += `; Max-Age=${maxAge}`

  document.cookie = cookie
}

function deleteCookie(name: string, options?: Pick<CookieOptionsSubset, 'path'>) {
  setCookie(name, '', { ...options, maxAge: -1 })
}

/**
 * Supabase Client for Browser/Client-Side Operations
 * 
 * This client is safe to use in React components, hooks, and client-side code.
 * It uses the public anon key which is safe to expose in the browser.
 * 
 * Row Level Security (RLS) policies ensure users can only access their own data.
 */

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return getCookie(name)
        },
        set(name, value, options) {
          const sanitized: CookieOptionsSubset = {
            path: options?.path,
            maxAge: options?.maxAge,
            sameSite: typeof options?.sameSite === 'string' ? options.sameSite : undefined,
            secure: options?.secure,
          }
          setCookie(name, value, sanitized)
        },
        remove(name, options) {
          deleteCookie(name, { path: options?.path })
        },
      },
    }
  )
}

// Singleton instance for client-side
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}
