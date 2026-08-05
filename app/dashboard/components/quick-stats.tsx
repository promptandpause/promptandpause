"use client"

import { useState, useEffect } from "react"
import { TrendUp, TrendDown, Minus, BookOpen, CalendarCheck, Activity } from "phosphor-react"
import { calculateMoodTrends } from "@/lib/services/analyticsService"
import { supabaseReflectionService } from "@/lib/services/supabaseReflectionService"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/ThemeContext"
import { motion } from "framer-motion"

export default function QuickStats() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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
    if (moodTrend === 'improving') return <TrendUp size={14} weight="bold" className="text-green-500" />
    if (moodTrend === 'declining') return <TrendDown size={14} weight="bold" className="text-red-500" />
    return <Minus size={14} weight="bold" className="text-slate-500" />
  }

  const getTrendText = () => {
    if (moodTrend === 'improving') return 'Improving'
    if (moodTrend === 'declining') return 'Declining'
    return 'Stable'
  }

  const card = isDark
    ? 'bg-white/[0.04] border border-white/[0.06]'
    : 'bg-white/70 backdrop-blur-[12px] border border-slate-100 shadow-soft-card'

  const orb = (accent: string) => {
    const map: Record<string, string> = {
      blue: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
      emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      violet: 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    }
    return map[accent] || map.blue
  }

  const tiles: Array<{
    key: string
    accent: string
    icon: React.ReactNode
    label: string
    value: React.ReactNode
  }> = [
    {
      key: 'reflections',
      accent: 'blue',
      icon: <BookOpen size={16} weight="bold" />,
      label: 'Reflections',
      value: <span className={`text-2xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalReflections}</span>,
    },
    {
      key: 'week',
      accent: 'emerald',
      icon: <CalendarCheck size={16} weight="bold" />,
      label: 'This Week',
      value: <span className={`text-2xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{thisWeekCount}</span>,
    },
    {
      key: 'mood',
      accent: 'violet',
      icon: <Activity size={16} weight="bold" />,
      label: 'Mood Trend',
      value: (
        <span className={`text-sm font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-green-50 text-green-600'}`}>
          {getTrendIcon()}
          {getTrendText()}
        </span>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiles.map((t, i) => (
        <motion.div
          key={t.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.06 }}
          className={`rounded-3xl p-6 ${card}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${orb(t.accent)}`}>
              {t.icon}
            </div>
            {t.value}
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
            {t.label}
          </h3>
        </motion.div>
      ))}
    </div>
  )
}
