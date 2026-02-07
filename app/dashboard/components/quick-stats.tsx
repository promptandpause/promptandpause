"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus, BookOpen, Flame, Activity } from "lucide-react"
import { calculateReflectionStreak, calculateMoodTrends } from "@/lib/services/analyticsService"
import { supabaseReflectionService } from "@/lib/services/supabaseReflectionService"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/ThemeContext"

export default function QuickStats() {
  const { theme } = useTheme()
  const [totalReflections, setTotalReflections] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
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
        const [reflections, streak, moodData] = await Promise.all([
          supabaseReflectionService.getAllReflections(),
          calculateReflectionStreak(user.id),
          calculateMoodTrends(user.id, 30)
        ])

        if (isMounted) {
          setTotalReflections(reflections.length)
          setCurrentStreak(streak)
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

  const isDark = theme === 'dark'

  return (
    <div className={`rounded-2xl p-5 space-y-0 ${isDark ? 'bg-white/5 border border-white/8' : 'bg-[#FAFAF7] border border-[#E8E5DE]'}`}>
      {/* Reflections */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#B8C9E0]/10' : 'bg-[#D4E4F7]/50'}`}>
            <BookOpen className={`h-4 w-4 ${isDark ? 'text-[#B8C9E0]' : 'text-[#5B7FA5]'}`} />
          </div>
          <span className={`text-sm ${isDark ? 'text-white/50' : 'text-[#5A5A4E]'}`}>Reflections</span>
        </div>
        <span className={`text-lg font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>{totalReflections}</span>
      </div>
      <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-[#E8E5DE]'}`} />
      {/* Day Streak */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#A8D5BA]/10' : 'bg-[#E8F5E9]'}`}>
            <Flame className={`h-4 w-4 ${isDark ? 'text-[#A8D5BA]' : 'text-[#5A8F6E]'}`} />
          </div>
          <span className={`text-sm ${isDark ? 'text-white/50' : 'text-[#5A5A4E]'}`}>Day streak</span>
        </div>
        <span className={`text-lg font-bold tabular-nums ${isDark ? 'text-[#A8D5BA]' : 'text-[#5A8F6E]'}`}>{currentStreak}</span>
      </div>
      <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-[#E8E5DE]'}`} />
      {/* Mood Trend */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#C4B5E0]/10' : 'bg-[#EDE7F6]'}`}>
            <Activity className={`h-4 w-4 ${isDark ? 'text-[#C4B5E0]' : 'text-[#7E6BA5]'}`} />
          </div>
          <span className={`text-sm ${isDark ? 'text-white/50' : 'text-[#5A5A4E]'}`}>Mood trend</span>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>{getTrendText()}</span>
        </div>
      </div>
    </div>
  )
}
