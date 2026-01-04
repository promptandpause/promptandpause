"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { calculateReflectionStreak, getDailyActivity } from "@/lib/services/analyticsService"
import { supabaseReflectionService } from "@/lib/services/supabaseReflectionService"
import { DailyActivity } from "@/lib/types/reflection"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, TrendingUp } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/ThemeContext"

export default function ActivityCalendar() {
  const { theme } = useTheme()
  const [activities, setActivities] = useState<DailyActivity[]>([])
  const [hoveredDay, setHoveredDay] = useState<DailyActivity | null>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalReflections, setTotalReflections] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    let isMounted = true

    async function loadActivityData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        // Load last 84 days (12 weeks for better grid display)
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 83)

        const [activityData, streak, reflections] = await Promise.all([
          getDailyActivity(user.id, startDate, today),
          calculateReflectionStreak(user.id),
          supabaseReflectionService.getAllReflections()
        ])

        if (isMounted) {
          setActivities(activityData)
          setCurrentStreak(streak)
          setTotalReflections(reflections.length)
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadActivityData()
    return () => { isMounted = false }
  }, [])

  const getIntensityColor = (count: number) => {
    if (count === 0) return "bg-gray-100/50"
    if (count === 1) return "bg-[#B8D8B8]/40"
    if (count === 2) return "bg-[#B8D8B8]/60"
    if (count >= 3) return "bg-[#B8D8B8]/80"
    return "bg-[#B8D8B8]"
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { weekday: 'short' })
  }

  // Group activities into weeks (7 days each)
  const weeks: DailyActivity[][] = []
  for (let i = 0; i < activities.length; i += 7) {
    weeks.push(activities.slice(i, i + 7))
  }

  if (loading) {
    return (
      <Card className={`rounded-3xl p-6 h-fit flex flex-col transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activity</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`rounded-lg p-3 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <Skeleton className={`h-4 w-16 mb-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
            <Skeleton className={`h-6 w-12 ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
          </div>
          <div className={`rounded-lg p-3 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <Skeleton className={`h-4 w-16 mb-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
            <Skeleton className={`h-6 w-12 ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className={`h-4 w-24 ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
          <Skeleton className={`h-32 w-full ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80'}`} />
        </div>
      </Card>
    )
  }

  return (
    <Card className={`rounded-3xl p-6 h-fit flex flex-col transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-400" />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activity</h3>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`rounded-lg p-3 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Total</p>
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalReflections}</p>
        </div>
        <div className={`rounded-lg p-3 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-orange-400" />
            <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Streak</p>
          </div>
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentStreak} 🔥</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2 mb-3">
        <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Last 12 weeks</p>
        <div className="relative">
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={day.date}
                    whileHover={{ scale: 1.2 }}
                    className="relative"
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(day.count)} border cursor-pointer transition-all duration-200 ${theme === 'dark' ? 'border-white/20' : 'border-gray-200'}`}
                      title={`${formatDate(day.date)}: ${day.count} reflection${day.count !== 1 ? 's' : ''}`}
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredDay && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
              >
                <div className={`backdrop-blur-xl border rounded-lg p-3 min-w-[180px] shadow-xl ${theme === 'dark' ? 'bg-slate-800/90 border-white/20' : 'bg-white/80 border-gray-300'}`}>
                  <p className={`font-medium text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(hoveredDay.date)}
                  </p>
                  <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                    {getDayOfWeek(hoveredDay.date)}
                  </p>
                  {hoveredDay.count > 0 ? (
                    <div className="space-y-1">
                      <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {hoveredDay.count} reflection{hoveredDay.count !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-1">
                        {hoveredDay.moods.map((mood, index) => (
                          <span key={index} className="text-lg">{mood}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>No reflections</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      <div className={`flex items-center justify-between text-xs pt-3 border-t ${theme === 'dark' ? 'text-white/50 border-white/10' : 'text-gray-500 border-gray-200'}`}>
        <span>Less</span>
        <div className="flex gap-1">
          <div className={`w-3 h-3 rounded-sm border ${theme === 'dark' ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-200'}`} />
          <div className={`w-3 h-3 rounded-sm bg-green-400/30 border ${theme === 'dark' ? 'border-white/20' : 'border-gray-200'}`} />
          <div className={`w-3 h-3 rounded-sm bg-green-400/50 border ${theme === 'dark' ? 'border-white/20' : 'border-gray-200'}`} />
          <div className={`w-3 h-3 rounded-sm bg-green-400/70 border ${theme === 'dark' ? 'border-white/20' : 'border-gray-200'}`} />
        </div>
        <span>More</span>
      </div>

      {/* Quick insights */}
      <div className="mt-4 space-y-2">
        {currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-lg p-3"
          >
            <p className="text-orange-400 font-semibold text-sm mb-1">
              🔥 {currentStreak} Day Streak!
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
              Keep it up! You're building a great habit.
            </p>
          </motion.div>
        )}
        
        {currentStreak === 0 && totalReflections > 0 && (
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
            <p className="text-blue-400 font-semibold text-sm mb-1">
              💡 Start a new streak!
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
              Complete today's reflection to begin.
            </p>
          </div>
        )}

        {totalReflections === 0 && (
          <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
            <p className="text-purple-400 font-semibold text-sm mb-1">
              ✨ Begin your journey
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
              Your first reflection is waiting!
            </p>
          </div>
        )}

        {/* Milestone badges */}
        {totalReflections >= 7 && (
          <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-400/30">
            🌱 First Week Complete
          </Badge>
        )}
        {totalReflections >= 30 && (
          <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-400/30">
            🌟 Month Milestone
          </Badge>
        )}
        {currentStreak >= 7 && (
          <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-400/30">
            🔥 Week Streak
          </Badge>
        )}
      </div>
    </Card>
  )
}
