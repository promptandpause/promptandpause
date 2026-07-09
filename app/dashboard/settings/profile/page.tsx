"use client"

import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardSidebar } from '@/app/dashboard/components/DashboardSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { ProfileEditor } from '@/components/social/ProfileEditor'
import { CaretLeft } from 'phosphor-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ProfileSettingsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <AuthGuard redirectPath="/dashboard/settings/profile">
      <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
            <div className="max-w-[800px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-6">
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                <Link
                  href="/settings"
                  className={`inline-flex items-center gap-1.5 text-sm mb-6 transition-colors ${
                    isDark ? 'text-white/40 hover:text-white' : 'text-[#8B98A5] hover:text-[#536471]'
                  }`}
                >
                  <CaretLeft size={14} weight="bold" />
                  Back to Settings
                </Link>

                <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                  Profile & Theme
                </h1>
                <p className={`text-sm mb-8 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                  Customize your public profile, choose a theme, and set sharing preferences
                </p>
              </motion.div>

              <ProfileEditor />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
