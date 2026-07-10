"use client"

import { WhoToFollow } from './components/WhoToFollow'
import { TrendingTopics } from './components/TrendingTopics'
import { useTheme } from '@/contexts/ThemeContext'

export function DashboardRightSidebar() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <aside className="hidden lg:block w-[320px] xl:w-[350px] shrink-0 h-screen overflow-y-auto scrollbar-hide py-3 px-3 xl:px-4 space-y-4">
      <div className="sticky top-3 space-y-4">
        <WhoToFollow />
        <TrendingTopics />
        <p className={`text-xs leading-relaxed px-1 ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>
          &copy; 2026 Prompt &amp; Pause from DC REGENT GROUP
        </p>
      </div>
    </aside>
  )
}
