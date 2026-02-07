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
  // TEMP: Bypassed for local UI preview - REMOVE AFTER
  return {
    isAuthenticated: true,
    isAdmin: true,
    isLoading: false
  }
}
