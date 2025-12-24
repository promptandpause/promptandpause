import { createBrowserClient } from '@supabase/ssr'

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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
