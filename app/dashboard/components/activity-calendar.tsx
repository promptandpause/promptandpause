"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { calculateReflectionStreak, getDailyActivity } from "@/lib/services/analyticsService"
import { supabaseReflectionService } from "@/lib/services/supabaseReflectionService"
import { DailyActivity } from "@/lib/types/reflection"
import { motion, AnimatePresence } from "framer-motion"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendar, faFire, faLightbulb, faSeedling, faStar, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/ThemeContext"

export default function ActivityCalendar() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activities, setActivities] = useState<DailyActivity[]>([])
  const [hoveredDay, setHoveredDay] = useState<DailyActivity | null>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalReflections, setTotalReflections] = useState(0)
  const supabase = getSupabaseClient()

  // Pre-load data on mount without loading state
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
        }
      } catch (error) {
        console.error('Failed to load activity data:', error)
      }
    }

    loadActivityData()
    return () => { isMounted = false }
  }, [supabase])

  const getIntensityColor = (count: number) => {
    if (count === 0) return isDark ? "bg-white/5" : "bg-slate-100"
    if (count === 1) return isDark ? "bg-indigo-500/40" : "bg-indigo-200"
    if (count === 2) return isDark ? "bg-indigo-500/60" : "bg-indigo-300"
    if (count === 3) return isDark ? "bg-indigo-500/80" : "bg-indigo-400"
    return "bg-indigo-500"
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

  const card = isDark
    ? 'bg-white/[0.04] border border-white/[0.06]'
    : 'glass rounded-3xl border-slate-100 soft-shadow'

  return (
    <Card className={`animate-fade-up rounded-3xl p-6 lg:p-8 flex flex-col transition-all duration-200 ${card}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <FontAwesomeIcon icon={faCalendar} className="text-sm" />
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Activity</h3>
        </div>

        <div className="flex gap-8">
          <div className="text-center">
            <p className={`text-xs uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Total</p>
            <p className={`text-2xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalReflections}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <FontAwesomeIcon icon={faFire} className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
              <p className={`text-xs uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Streak</p>
            </div>
            <p className={`text-2xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentStreak}</p>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-4 mb-3">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className={isDark ? 'text-white/50' : 'text-slate-500'}>Last 12 weeks</span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Less</span>
            <div className="flex gap-1">
              <div className={`w-3 h-3 rounded-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`} />
              <div className={`w-3 h-3 rounded-sm ${isDark ? 'bg-indigo-500/40' : 'bg-indigo-200'}`} />
              <div className={`w-3 h-3 rounded-sm ${isDark ? 'bg-indigo-500/60' : 'bg-indigo-300'}`} />
              <div className={`w-3 h-3 rounded-sm ${isDark ? 'bg-indigo-500' : 'bg-indigo-500'}`} />
            </div>
            <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>More</span>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-12 gap-1.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1.5">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={day.date}
                    whileHover={{ scale: 1.25 }}
                    className="relative w-full"
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div
                      className={`w-full aspect-square rounded-[5px] ${getIntensityColor(day.count)} border cursor-pointer transition-all duration-200 ${isDark ? 'border-white/10' : 'border-slate-200'}`}
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
                <div className={`backdrop-blur-xl border rounded-lg p-3 min-w-[180px] shadow-xl ${isDark ? 'bg-slate-800/90 border-white/20' : 'bg-white/90 border-slate-200'}`}>
                  <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatDate(hoveredDay.date)}
                  </p>
                  <p className={`text-xs mb-2 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                    {getDayOfWeek(hoveredDay.date)}
                  </p>
                  {hoveredDay.count > 0 ? (
                    <div className="space-y-1">
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {hoveredDay.count} reflection{hoveredDay.count !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-1">
                        {hoveredDay.moods.map((mood, index) => (
                          <span key={index} className="text-lg">{mood}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>No reflections</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick insights */}
      <div className="mt-2 space-y-2">
        {currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-purple-500/20 to-red-500/20 border border-purple-400/30 rounded-lg p-3"
          >
            <p className="text-purple-400 font-semibold text-sm mb-1 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faFire} className="text-xs" />
              {currentStreak} days in a row
            </p>
            <p className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
              A gentle rhythm is taking shape.
            </p>
          </motion.div>
        )}
        
        {currentStreak === 0 && totalReflections > 0 && (
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
            <p className="text-blue-400 font-semibold text-sm mb-1 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLightbulb} className="text-xs" />
              Reflect today to start a rhythm
            </p>
            <p className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
              Complete today's reflection to begin.
            </p>
          </div>
        )}

        {totalReflections === 0 && (
          <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
            <p className="text-purple-400 font-semibold text-sm mb-1 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs" />
              Begin your journey
            </p>
            <p className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
              Your first reflection is waiting!
            </p>
          </div>
        )}

        {/* Milestone badges */}
        {totalReflections >= 7 && (
          <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-400/30">
            <FontAwesomeIcon icon={faSeedling} />
            First Week Complete
          </Badge>
        )}
        {totalReflections >= 30 && (
          <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-400/30">
            <FontAwesomeIcon icon={faStar} />
            Month Milestone
          </Badge>
        )}
        {currentStreak >= 7 && (
          <Badge className="bg-gradient-to-r from-purple-500/20 to-red-500/20 text-purple-400 border border-purple-400/30">
            <FontAwesomeIcon icon={faSeedling} />
            A Week of Rhythm
          </Badge>
        )}
      </div>
    </Card>
  )
}
