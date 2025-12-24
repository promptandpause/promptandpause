import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'

interface AuthGuardProps {
  children: ReactNode
  redirectPath?: string
  requireAdmin?: boolean
}

/**
 * Component wrapper to protect pages from unauthenticated access
 * Shows loading spinner while checking auth, redirects if not authenticated
 */
export function AuthGuard({ children, redirectPath, requireAdmin = false }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthGuard(redirectPath, requireAdmin)

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
