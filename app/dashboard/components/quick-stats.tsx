"use client"

import { useState, useEffect } from "react"
import { TrendUp, TrendDown, Minus, BookOpen, CalendarCheck, Activity } from "phosphor-react"
import { calculateMoodTrends } from "@/lib/services/analyticsService"
import { supabaseReflectionService } from "@/lib/services/supabaseReflectionService"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/ThemeContext"
import { IconOrb, type Accent } from "@/components/ui/accent-card"
import { motion } from "framer-motion"

export default function QuickStats() {
  const { theme } = useTheme()
  const [totalReflections, setTotalReflections] = useState(0)
  const [thisWeekCount, setThisWeekCount] = useState(0)
  const [moodTrend, setMoodTrend] = useState<'improving' | 'declining' | 'stable'>('stable')
  const supabase = getSupabaseClient()

  // Pre-load data on mount without loading state
  useEffect(() => {
    let isMounted = true

    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        // Fetch all stats in parallel
        const [reflections, moodData] = await Promise.all([
          supabaseReflectionService.getAllReflections(),
          calculateMoodTrends(user.id, 30)
        ])

        if (isMounted) {
          setTotalReflections(reflections.length)
          // Count reflections from this week (Mon–Sun)
          const now = new Date()
          const dayOfWeek = now.getDay()
          const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
          const monday = new Date(now)
          monday.setDate(now.getDate() - mondayOffset)
          monday.setHours(0, 0, 0, 0)
          const weekCount = reflections.filter(r => new Date(r.created_at || r.date) >= monday).length
          setThisWeekCount(weekCount)
          setMoodTrend(moodData.trend)
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }

    loadStats()
    return () => { isMounted = false }
  }, [supabase])

  const getTrendIcon = () => {
    if (moodTrend === 'improving') return <TrendUp size={20} weight="bold" className="text-green-400" />
    if (moodTrend === 'declining') return <TrendDown size={20} weight="bold" className="text-red-400" />
    return <Minus size={20} weight="bold" className="text-yellow-400" />
  }

  const getTrendText = () => {
    if (moodTrend === 'improving') return 'Improving'
    if (moodTrend === 'declining') return 'Declining'
    return 'Stable'
  }

  const getTrendLabel = () => {
    return (
      <span className={`text-xs text-center leading-tight ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
        <span className="hidden md:inline">Mood Trend</span>
        <span className="md:hidden">Mood</span>
      </span>
    )
  }

  const isDark = theme === 'dark'

  const tiles: Array<{
    key: string
    accent: Accent
    icon: React.ReactNode
    label: string
    value: React.ReactNode
  }> = [
    {
      key: 'reflections',
      accent: 'blue',
      icon: <BookOpen size={16} weight="bold" className="text-white" />,
      label: 'Reflections',
      value: <span className={`text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{totalReflections}</span>,
    },
    {
      key: 'week',
      accent: 'emerald',
      icon: <CalendarCheck size={16} weight="bold" className="text-white" />,
      label: 'This week',
      value: <span className={`text-xl font-bold tabular-nums ${isDark ? 'text-emerald-300' : 'text-[#5A8F6E]'}`}>{thisWeekCount}</span>,
    },
    {
      key: 'mood',
      accent: 'violet',
      icon: <Activity size={16} weight="bold" className="text-white" />,
      label: 'Mood trend',
      value: (
        <div className="flex items-center gap-1.5">
          {getTrendIcon()}
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{getTrendText()}</span>
        </div>
      ),
    },
  ]

  return (
    <div className={`rounded-2xl p-5 space-y-0 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-[#EFF3F4]'}`}>
      {tiles.map((t, i) => (
        <div key={t.key}>
          <motion.div
            whileHover={{ x: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`flex items-center justify-between py-3 px-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#F5F3EE]/60'}`}
          >
            <div className="flex items-center gap-3">
              <IconOrb accent={t.accent} size="sm">{t.icon}</IconOrb>
              <span className={`text-sm ${isDark ? 'text-white/60' : 'text-[#536471]'}`}>{t.label}</span>
            </div>
            {t.value}
          </motion.div>
          {i < tiles.length - 1 && <div className={`h-px mx-1 ${isDark ? 'bg-white/[0.04]' : 'bg-[#EFF3F4]/80'}`} />}
        </div>
      ))}
    </div>
  )
}
