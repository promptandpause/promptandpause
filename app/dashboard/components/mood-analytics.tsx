"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Loader2,
  ChevronDown
} from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface MoodAnalyticsData {
  overall: { mood: string; count: number; percentage: number }[]
  daily: { date: string; mood: string; score: number }[]
  mostCommon: string | null
  trend: 'improving' | 'declining' | 'stable'
  weeklyAverage: number
  monthlyAverage: number
}

// Mood colors for charts
const MOOD_COLORS: Record<string, string> = {
  '😔': '#ef4444', // red
  '😐': '#f59e0b', // amber
  '🤔': '#eab308', // yellow
  '😊': '#84cc16', // lime
  '😄': '#22c55e', // green
  '😌': '#14b8a6', // teal
  '🙏': '#06b6d4', // cyan
  '💪': '#8b5cf6', // purple
}

// Mood names for better labels
const MOOD_NAMES: Record<string, string> = {
  '😔': 'Sad',
  '😐': 'Neutral',
  '🤔': 'Thoughtful',
  '😊': 'Happy',
  '😄': 'Joyful',
  '😌': 'Calm',
  '🙏': 'Grateful',
  '💪': 'Strong',
}

// Mood scores for trend calculation
const MOOD_SCORES: Record<string, number> = {
  '😔': 1,
  '😐': 2,
  '🤔': 3,
  '😊': 4,
  '😄': 5,
  '😌': 4,
  '🙏': 4,
  '💪': 5,
}

const TIME_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
]

export default function MoodAnalytics() {
  const { theme } = useTheme()
  const [data, setData] = useState<MoodAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30)

  useEffect(() => {
    fetchMoodAnalytics()
  }, [timeRange])

  const fetchMoodAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/premium/mood-analytics?days=${timeRange}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else if (result.requiresPremium) {
        return // User is not premium
      } else {
        toast.error('Failed to load mood analytics')
      }
    } catch (error) {
      toast.error('Failed to load mood analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-8 flex items-center justify-center min-h-[400px] ${
        theme === 'dark'
          ? 'bg-white/5 border border-white/10'
          : 'bg-white/80 border border-gray-300'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          <p className={theme === 'dark' ? 'text-white/60 text-sm' : 'text-gray-500 text-sm'}>Analyzing your moods...</p>
        </div>
      </section>
    )
  }

  if (!data || data.overall.length === 0) {
    return null
  }

  // Prepare data for charts
  const pieData = data.overall.map(item => ({
    name: item.mood,
    displayName: `${item.mood} ${MOOD_NAMES[item.mood] || 'Unknown'}`,
    value: item.count,
    percentage: item.percentage,
  }))

  const trendData = data.daily.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    score: item.score,
    mood: item.mood,
  }))

  const barData = data.overall.map(item => ({
    mood: item.mood,
    moodLabel: `${item.mood} ${MOOD_NAMES[item.mood] || ''}`,
    count: item.count,
    percentage: item.percentage,
  }))

  return (
    <section className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20'
        : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/40'
    }`}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 sm:p-2.5 bg-blue-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={`font-semibold text-base sm:text-lg truncate ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Mood Analytics
            </h4>
            <p className={`text-[10px] sm:text-xs mt-0.5 line-clamp-1 ${
              theme === 'dark' ? 'text-white/60' : 'text-gray-500'
            }`}>
              Insights into your emotional patterns
            </p>
          </div>
        </div>

        {/* Time Range Selector - Improved for dark mode & mobile */}
        <div className="flex gap-1 sm:gap-2 w-full md:w-auto">
          {TIME_RANGES.map(range => (
            <motion.button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              whileTap={{ scale: 0.95 }}
              className={`
                relative overflow-hidden rounded-lg sm:rounded-xl
                flex-1 md:flex-initial
                px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5
                text-[11px] sm:text-xs md:text-sm font-semibold
                touch-manipulation select-none
                transition-all duration-200
                min-w-[70px] sm:min-w-[80px]
                ${
                  timeRange === range.value
                    ? theme === 'dark'
                      ? 'bg-gradient-to-br from-blue-500/60 via-blue-600/50 to-cyan-500/60 text-white border-2 border-blue-400/80 shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-br from-blue-500/80 via-blue-600/70 to-cyan-500/80 text-white border-2 border-blue-400/90 shadow-lg shadow-blue-500/30'
                    : theme === 'dark'
                      ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80 hover:border-white/20 active:bg-white/15'
                      : 'bg-white/60 text-gray-600 border border-gray-200 hover:bg-white hover:text-gray-900 hover:border-gray-300 hover:shadow-md active:bg-gray-100'
                }
              `}
            >
              {/* Active indicator */}
              {timeRange === range.value && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute inset-0 -z-10 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30'
                      : 'bg-gradient-to-br from-blue-400/30 to-cyan-400/30'
                  }`}
                  style={{ borderRadius: 'inherit' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap text-center w-full">{range.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Overview Stats - Mobile optimized */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className={`backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 shadow-md ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-gray-50/80 border-2 border-gray-200'
          }`}
        >
          <p className={`text-[9px] sm:text-[10px] md:text-xs mb-1 font-medium uppercase tracking-wide ${
            theme === 'dark' ? 'text-white/60' : 'text-gray-500'
          }`}>Most Common</p>
          <p className={`text-2xl sm:text-3xl md:text-4xl leading-none ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{data.mostCommon}</p>
        </motion.div>
        
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className={`backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 shadow-md ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-gray-50/80 border-2 border-gray-200'
          }`}
        >
          <p className={`text-[9px] sm:text-[10px] md:text-xs mb-1 font-medium uppercase tracking-wide ${
            theme === 'dark' ? 'text-white/60' : 'text-gray-500'
          }`}>Trend</p>
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <TrendingUp className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0 ${
                data.trend === 'improving' ? 'text-green-400 rotate-0' :
                data.trend === 'declining' ? 'text-red-400 rotate-180' :
                'text-yellow-400 rotate-90'
              } transition-transform`} />
              <p className={`text-xs sm:text-sm md:text-base font-semibold capitalize leading-none ${
                data.trend === 'improving' ? 'text-green-400' :
                data.trend === 'declining' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {data.trend}
              </p>
            </div>
            <p className={`text-[8px] sm:text-[9px] md:text-[10px] leading-tight ${
              theme === 'dark' ? 'text-white/40' : 'text-gray-400'
            }`}>
              {data.trend === 'improving' && 'Improving ↗'}
              {data.trend === 'declining' && 'Declining ↘'}
              {data.trend === 'stable' && 'Consistent →'}
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className={`backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 shadow-md ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-gray-50/80 border-2 border-gray-200'
          }`}
        >
          <p className={`text-[9px] sm:text-[10px] md:text-xs mb-1 font-medium uppercase tracking-wide ${
            theme === 'dark' ? 'text-white/60' : 'text-gray-500'
          }`}>Mood Average</p>
          <p className={`text-xl sm:text-2xl md:text-3xl font-bold leading-none ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {data.monthlyAverage.toFixed(1)}
            <span className={`text-sm sm:text-base md:text-lg ml-0.5 ${
              theme === 'dark' ? 'text-white/60' : 'text-gray-500'
            }`}>/5</span>
          </p>
        </motion.div>
      </div>

      {/* Charts Grid - Mobile optimized */}
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Mood Distribution - Pie Chart */}
        <div className={`backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-md ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10'
            : 'bg-gray-50/80 border-2 border-gray-200'
        }`}>
          <h5 className={`font-semibold text-xs sm:text-sm mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
            Mood Distribution
          </h5>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(30, 30, 30, 0.95)', 
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any, name: any, props: any) => [
                  `${value} reflections (${props.payload.percentage}%)`,
                  props.payload.displayName
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Mood Frequency - Bar Chart */}
        <div className={`backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-md ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10'
            : 'bg-gray-50/80 border-2 border-gray-200'
        }`}>
          <h5 className={`font-semibold text-xs sm:text-sm mb-3 sm:mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Frequency Analysis</h5>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
              <XAxis 
                dataKey="mood" 
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                style={{ fontSize: '20px' }}
                tick={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
              />
              <YAxis stroke={theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} tick={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(30, 30, 30, 0.95)', 
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any, name: any, props: any) => [
                  `${value} times`, 
                  props.payload.moodLabel || props.payload.mood
                ]}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.mood] || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mood Trend Over Time - Area Chart */}
        <div className={`backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-md ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10'
            : 'bg-gray-50/80 border-2 border-gray-200'
        }`}>
          <h5 className={`font-semibold text-xs sm:text-sm mb-3 sm:mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Mood Trend Over Time</h5>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
              <XAxis 
                dataKey="date" 
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                style={{ fontSize: '11px' }}
                tick={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
              />
              <YAxis 
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(30, 30, 30, 0.95)', 
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any, name: any, props: any) => [
                  `${props.payload.mood} ${MOOD_NAMES[props.payload.mood] || ''} (${value})`,
                  'Mood'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorScore)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights - Mobile optimized */}
      <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-md ${
        theme === 'dark'
          ? 'bg-white/5 border border-white/10'
          : 'bg-gray-50/80 border-2 border-gray-200'
      }`}>
        <h5 className={`font-semibold text-xs sm:text-sm mb-2 sm:mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>📊 Quick Insights</h5>
        <ul className={`space-y-1.5 sm:space-y-2 text-xs sm:text-sm leading-relaxed ${
          theme === 'dark' ? 'text-white/70' : 'text-gray-600'
        }`}>
          {data.trend === 'improving' && (
            <li>• Your mood has been improving over this period - keep it up! 🌟</li>
          )}
          {data.trend === 'declining' && (
            <li>• Your mood trend shows a decline - consider reaching out for support 💙</li>
          )}
          {data.trend === 'stable' && (
            <li>• Your mood has been relatively stable - consistency is good! ✨</li>
          )}
          <li>• You've reflected with {data.overall.length} different moods in this period</li>
          <li>• Your most common mood {data.mostCommon} appeared {data.overall[0]?.count || 0} times</li>
        </ul>
      </div>
    </section>
  )
}
