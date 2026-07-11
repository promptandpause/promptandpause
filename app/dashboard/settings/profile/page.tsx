"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Spinner } from 'phosphor-react'
import { useTheme } from '@/contexts/ThemeContext'

// Profile editing now happens inline on the profile page itself (Twitter-style
// "Edit profile" modal), not as a separate settings page. This route stays
// around only to redirect anyone who still has it bookmarked or linked.
export default function ProfileSettingsRedirectPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : Promise.resolve(null))
      .then(d => {
        const username = d?.data?.username
        router.replace(username ? `/${username}` : '/dashboard')
      })
      .catch(() => router.replace('/dashboard'))
  }, [router])

  return (
    <AuthGuard redirectPath="/dashboard/settings/profile">
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
        <Spinner size={24} weight="bold" className={`animate-spin ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`} />
      </div>
    </AuthGuard>
  )
}
