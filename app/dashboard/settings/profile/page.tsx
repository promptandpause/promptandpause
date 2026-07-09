"use client"

import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardSidebar } from '@/app/dashboard/components/DashboardSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { ProfileEditor } from '@/components/social/ProfileEditor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProfileSettingsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <AuthGuard redirectPath="/dashboard/settings/profile">
      <div className={`min-h-screen ${isDark ? 'bg-[#141820]' : 'bg-[#F5F3EE]'}`}>
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
            <div className="max-w-[800px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-6">
              <Link
                href="/dashboard/settings"
                className={`inline-flex items-center gap-1.5 text-sm mb-6 transition-colors ${
                  isDark ? 'text-white/40 hover:text-white' : 'text-[#A0A090] hover:text-[#5A5A4E]'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
              </Link>

              <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>
                Profile & Theme
              </h1>
              <p className={`text-sm mb-8 ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
                Customize your public profile, choose a theme, and set sharing preferences
              </p>

              <ProfileEditor />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
