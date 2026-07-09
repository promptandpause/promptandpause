import { ReactNode } from 'react'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'

interface AuthGuardProps {
  children: ReactNode
  redirectPath?: string
  requireAdmin?: boolean
}

export function AuthGuard({ children, redirectPath, requireAdmin = false }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthGuard(redirectPath, requireAdmin)

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
