import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * Hook to protect pages from unauthenticated access
 * Redirects to sign-in if user is not authenticated
 * 
 * @param redirectPath - Path to redirect to after sign-in (default: current path)
 * @param requireAdmin - Whether to check for admin access (default: false)
 * @returns Object with isAuthenticated and isLoading states
 */
export function useAuthGuard(redirectPath?: string, requireAdmin: boolean = false) {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Not authenticated - redirect to sign in
        const redirect = redirectPath || window.location.pathname
        router.push(`/login?redirect=${redirect}`)
        return
      }
      
      setIsAuthenticated(true)

      // Check admin status if required
      if (requireAdmin) {
        try {
          const res = await fetch('/api/admin/auth/me')
          const data = await res.json()
          setIsAdmin(!!data?.isAdmin)

          if (!data?.isAdmin) {
            // Not an admin - redirect to dashboard
            router.push('/dashboard')
            return
          }
        } catch (_error) {
          setIsAdmin(false)
          router.push('/dashboard')
          return
        }
      }
    }
    
    checkAuth()
  }, [router, supabase, redirectPath, requireAdmin])

  return {
    isAuthenticated,
    isAdmin,
    isLoading: isAuthenticated === null
  }
}
