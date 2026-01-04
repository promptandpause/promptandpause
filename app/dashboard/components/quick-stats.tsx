"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { calculateReflectionStreak, calculateMoodTrends } from "@/lib/services/analyticsService"
import { supabaseReflectionService } from "@/lib/services/supabaseReflectionService"
import { Skeleton } from "@/components/ui/skeleton"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/ThemeContext"

export default function QuickStats() {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [totalReflections, setTotalReflections] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [moodTrend, setMoodTrend] = useState<'improving' | 'declining' | 'stable'>('stable')
  const supabase = getSupabaseClient()

  useEffect(() => {
    let isMounted = true

    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        // Fetch all stats in parallel
        const [reflections, streak, moodData] = await Promise.all([
          supabaseReflectionService.getAllReflections(),
          calculateReflectionStreak(user.id),
          calculateMoodTrends(user.id, 30)
        ])

        if (isMounted) {
          setTotalReflections(reflections.length)
          setCurrentStreak(streak)
          setMoodTrend(moodData.trend)
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStats()
    return () => { isMounted = false }
  }, [])

  if (loading) {
    return (
      <section className={`rounded-3xl p-4 md:p-7 flex flex-row gap-3 md:gap-8 justify-between transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`}>
        <div className="flex flex-col items-center gap-2 flex-1">
          <Skeleton className={`h-7 md:h-6 w-10 md:w-12 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
          <Skeleton className={`h-3 w-16 md:w-24 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <Skeleton className={`h-7 md:h-6 w-10 md:w-12 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
          <Skeleton className={`h-3 w-16 md:w-24 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <Skeleton className={`h-7 md:h-6 w-14 md:w-16 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
          <Skeleton className={`h-3 w-20 md:w-32 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
        </div>
      </section>
    )
  }

  const getTrendIcon = () => {
    if (moodTrend === 'improving') return <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
    if (moodTrend === 'declining') return <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
    return <Minus className="h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
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

  return (
    <section className={`rounded-3xl p-4 md:p-7 flex flex-row gap-3 md:gap-8 justify-between transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`}>
      {/* Reflections */}
      <div className="flex flex-col items-center justify-center gap-1.5 md:gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalReflections}</span>
        </div>
        <span className={`text-xs md:text-sm font-medium text-center leading-tight ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Reflections</span>
      </div>
      
      {/* Vertical Divider */}
      <div className={`w-px self-stretch my-2 ${theme === 'dark' ? 'bg-white/20' : 'bg-white/80'}`} />
      
      {/* Day Streak */}
      <div className="flex flex-col items-center justify-center gap-1.5 md:gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-2xl md:text-3xl font-bold text-orange-400">{currentStreak}</span>
          {currentStreak > 0 && <span className="text-lg md:text-xl">🔥</span>}
        </div>
        <span className={`text-xs md:text-sm font-medium text-center leading-tight ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
          <span className="hidden md:inline">Day Streak</span>
          <span className="md:hidden">Streak</span>
        </span>
      </div>
      
      {/* Vertical Divider */}
      <div className={`w-px self-stretch my-2 ${theme === 'dark' ? 'bg-white/20' : 'bg-white/80'}`} />
      
      {/* Mood Trend */}
      <div className="flex flex-col items-center justify-center gap-1.5 md:gap-2 flex-1 min-w-0">
        <div className="flex items-center justify-center">
          {getTrendIcon()}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-xs md:text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{getTrendText()}</span>
          {getTrendLabel()}
        </div>
      </div>
    </section>
  )
}
