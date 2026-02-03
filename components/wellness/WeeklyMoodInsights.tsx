'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  BarChart3, 
  Sparkles,
  Lock,
  ChevronRight,
  Crown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  getWeeklyMoodData, 
  getMonthlyMoodData,
  getMoodStats,
  generateMoodInsights,
  type WeeklyMoodData 
} from '@/lib/services/moodInsightsService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useTier } from '@/hooks/useTier'
import { useTheme } from '@/contexts/ThemeContext'

interface WeeklyMoodInsightsProps {
  userId: string
}

export default function WeeklyMoodInsights({ userId }: WeeklyMoodInsightsProps) {
  const { tier } = useTier()
  const { theme } = useTheme()
  const isPremium = tier === 'premium'
  
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [moodData, setMoodData] = useState<WeeklyMoodData[]>([])
  const [stats, setStats] = useState<{
    averageMood: number | null
    totalReflections: number
    trend: 'improving' | 'stable' | 'declining'
    bestDay: string | null
    worstDay: string | null
    topEmotions: string[]
  } | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    loadData()
  }, [userId, period])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const today = new Date()
      const days = period === 'week' ? 7 : 30
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - days)

      // Load mood data
      const data = period === 'week' 
        ? await getWeeklyMoodData(supabase, userId)
        : await getMonthlyMoodData(supabase, userId)
      setMoodData(data)

      // Load stats
      const statsData = await getMoodStats(
        supabase, 
        userId, 
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      )
      setStats(statsData)

      // Load insights (premium only for AI insights)
      if (isPremium) {
        const insightsData = await generateMoodInsights(supabase, userId, period === 'week' ? 'weekly' : 'monthly')
        setInsights(insightsData)
      } else {
        // Basic insights for free users
        const basicInsights: string[] = []
        if (statsData.totalReflections > 0) {
          basicInsights.push(`You reflected ${statsData.totalReflections} times this ${period}.`)
        }
        if (statsData.averageMood !== null) {
          basicInsights.push(`Average mood: ${statsData.averageMood}/10`)
        }
        setInsights(basicInsights)
      }
    } catch (error) {
      console.error('Error loading mood data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = () => {
    if (!stats) return <Minus className="w-5 h-5 text-gray-400" />
    switch (stats.trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-rose-500" />
      default:
        return <Minus className="w-5 h-5 text-gray-400" />
    }
  }

  const getMoodColor = (mood: number | null) => {
    if (mood === null) return theme === 'dark' ? 'bg-white/20' : 'bg-gray-200'
    if (mood >= 7) return 'bg-emerald-400'
    if (mood >= 5) return 'bg-amber-400'
    return 'bg-rose-400'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return period === 'week' 
      ? date.toLocaleDateString('en-US', { weekday: 'short' })
      : date.getDate().toString()
  }

  if (isLoading) {
    return (
      <Card className={theme === 'dark' ? 'bg-white/5 border-white/10' : ''}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className={`h-6 rounded w-1/3 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <div className={`h-32 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Mood Insights
          </CardTitle>
          <div className={`flex gap-1 rounded-lg p-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
            <button
              className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${
                period === 'week' 
                  ? theme === 'dark' ? 'bg-white/20 shadow-sm text-white' : 'bg-white shadow-sm text-gray-900'
                  : theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setPeriod('week')}
            >
              Week
            </button>
            <button
              className={`h-7 px-3 text-xs font-medium rounded-md transition-all flex items-center ${
                period === 'month' 
                  ? theme === 'dark' ? 'bg-white/20 shadow-sm text-white' : 'bg-white shadow-sm text-gray-900'
                  : theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              } ${!isPremium ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (isPremium) {
                  setPeriod('month')
                }
              }}
              disabled={!isPremium}
            >
              {!isPremium && <Lock className="w-3 h-3 mr-1" />}
              Month
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mood Chart */}
        <div className="pt-2">
          <div className="flex items-end justify-between gap-1 h-24">
            {moodData.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: day.mood ? `${(day.mood / 10) * 100}%` : '10%' }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`w-full max-w-[20px] rounded-t ${getMoodColor(day.mood)} ${
                    !day.hasReflection ? 'opacity-30' : ''
                  }`}
                  title={day.mood ? `${day.mood}/10` : 'No reflection'}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {moodData.map((day) => (
              <div key={day.date} className="flex-1 text-center">
                <span className={`text-[10px] ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'}`}>{formatDate(day.date)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className={`text-center p-2 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {stats.averageMood !== null ? stats.averageMood : '—'}
              </div>
              <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>Avg Mood</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {getTrendIcon()}
              </div>
              <div className={`text-xs capitalize ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>{stats.trend}</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.totalReflections}</div>
              <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>Reflections</div>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              Insights
            </div>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`text-sm pl-6 relative before:content-['•'] before:absolute before:left-2 ${theme === 'dark' ? 'text-white/70 before:text-white/40' : 'text-gray-600 before:text-gray-400'}`}
                >
                  {insight}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Top Emotions */}
        {stats?.topEmotions && stats.topEmotions.length > 0 && (
          <div className="pt-2">
            <div className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Top Feelings</div>
            <div className="flex flex-wrap gap-2">
              {stats.topEmotions.map((emotion, index) => (
                <span
                  key={emotion}
                  className={`px-2 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}
                >
                  {emotion}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Best/Worst Days (Premium) */}
        {isPremium && stats?.bestDay && stats?.worstDay && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
              <div className={`text-xs font-medium ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Best Day</div>
              <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>{stats.bestDay}s</div>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-rose-500/20' : 'bg-rose-50'}`}>
              <div className={`text-xs font-medium ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>Challenging Day</div>
              <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-rose-300' : 'text-rose-700'}`}>{stats.worstDay}s</div>
            </div>
          </div>
        )}

        {/* Upgrade prompt for free users */}
        {!isPremium && (
          <div className={`pt-2 ${theme === 'dark' ? 'border-t border-white/10' : 'border-t'}`}>
            <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'}`}>
              <div>
                <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Unlock Full Insights</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>Monthly trends, AI analysis & more</div>
              </div>
              <Link href="/dashboard/settings#subscription">
                <Button size="sm" className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
