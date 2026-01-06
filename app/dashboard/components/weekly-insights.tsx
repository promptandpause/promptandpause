"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, TrendingUp, Target, Brain, Mail, Loader2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useTheme } from "@/contexts/ThemeContext"

interface WeeklyInsightsData {
  weekStart: string
  weekEnd: string
  totalReflections: number
  currentStreak: number
  averageWordCount: number
  topTags: { tag: string; count: number }[]
  moodDistribution: { mood: string; count: number }[]
  insights: {
    headline?: string
    observations?: string[]
    reflection?: string
    question?: string
    summary?: string
    keyInsights?: string[]
    recommendations?: string[]
    moodAnalysis?: string
    growthAreas?: string[]
    provider: string
    model: string
  }
  generatedAt: string
}

export default function WeeklyInsights() {
  const { theme } = useTheme()
  const [data, setData] = useState<WeeklyInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchWeeklyDigest()
  }, [])

  const fetchWeeklyDigest = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/premium/weekly-digest')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else if (result.requiresPremium) {
        // User is not premium - don't show this component
        return
      } else {
        toast.error('Failed to load weekly insights')
      }
    } catch (error) {
      toast.error('Failed to load weekly insights')
    } finally {
      setLoading(false)
    }
  }

  const sendDigestEmail = async () => {
    try {
      setSending(true)
      const response = await fetch('/api/premium/weekly-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail: true }),
      })

      const result = await response.json()

      if (result.success && result.emailSent) {
        toast.success('Weekly digest sent to your email! 📧')
      } else {
        toast.error('Failed to send email')
      }
    } catch (error) {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <section className={`rounded-2xl md:rounded-3xl p-6 md:p-8 flex items-center justify-center min-h-[300px] transition-all duration-200 ${
        theme === 'dark'
          ? 'glass-light shadow-soft-lg'
          : 'glass-medium shadow-soft-md'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          <p className={theme === 'dark' ? 'text-white/60 text-sm' : 'text-gray-500 text-sm'}>Generating your insights...</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return null // Don't show for non-premium users
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  }

  const headline = data.insights.headline || data.insights.summary || ''
  const observations = (data.insights.observations && data.insights.observations.length > 0)
    ? data.insights.observations
    : (data.insights.keyInsights || [])
  const reflectionText = data.insights.reflection || data.insights.moodAnalysis || ''
  const questionText = data.insights.question || ''

  return (
    <section className={`rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-200 ${
      theme === 'dark'
        ? 'glass-light shadow-soft-lg bg-gradient-to-br from-[#C8B8D8]/10 to-[#B8C8E8]/10 border border-[#C8B8D8]/20'
        : 'glass-medium shadow-soft-md bg-gradient-to-br from-[#C8B8D8]/20 to-[#B8C8E8]/20 border border-[#C8B8D8]/30'
    }`}>
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 relative">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h4 className={`font-semibold text-base sm:text-lg ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Your Weekly Insights
            </h4>
            <p className={`text-xs mt-0.5 ${
              theme === 'dark' ? 'text-white/60' : 'text-gray-500'
            }`}>
              {formatDate(data.weekStart)} - {formatDate(data.weekEnd)}
            </p>
          </div>
        </div>
        
        <Button
          onClick={sendDigestEmail}
          disabled={sending}
          size="default"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-2 border-purple-700 transition-all w-full sm:w-auto flex-shrink-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 font-bold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed h-10 px-5"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Email Me
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className={`backdrop-blur-sm rounded-lg p-3 ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <p className={`text-[10px] md:text-xs mb-1 ${
            theme === 'dark' ? 'text-white/60' : 'text-gray-500'
          }`}>Reflections</p>
          <p className={`text-xl md:text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{data.totalReflections}</p>
        </div>
        <div className={`backdrop-blur-sm rounded-lg p-3 ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <p className={`text-[10px] md:text-xs mb-1 ${
            theme === 'dark' ? 'text-white/60' : 'text-gray-500'
          }`}>Streak</p>
          <p className={`text-xl md:text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{data.currentStreak} 🔥</p>
        </div>
        <div className={`backdrop-blur-sm rounded-lg p-3 ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <p className={`text-[10px] md:text-xs mb-1 ${
            theme === 'dark' ? 'text-white/60' : 'text-gray-500'
          }`}>Avg Words</p>
          <p className={`text-xl md:text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{data.averageWordCount}</p>
        </div>
      </div>

      {/* AI Summary */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-purple-400" />
          <h5 className={`font-medium text-sm ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>This Week</h5>
        </div>
        <p className={`text-sm leading-relaxed ${
          theme === 'dark' ? 'text-white/80' : 'text-gray-700'
        }`}>
          {headline}
        </p>
      </div>

      {/* Observations */}
      {observations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <h5 className={`font-medium text-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Observations</h5>
          </div>
          <ul className="space-y-2">
            {observations.slice(0, showAll ? undefined : 2).map((insight, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-start gap-2 text-sm ${
                  theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                }`}
              >
                <span className="text-green-400 mt-0.5">•</span>
                <span>{insight}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Theme Reflection */}
      {reflectionText && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-blue-400" />
            <h5 className={`font-medium text-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Theme Reflection</h5>
          </div>
          <p className={`text-sm leading-relaxed ${
            theme === 'dark' ? 'text-white/70' : 'text-gray-600'
          }`}>
            {reflectionText}
          </p>
        </div>
      )}

      {/* Mood Analysis (collapsed by default) */}
      <AnimatePresence>
        {showAll && (
          <>
            {questionText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <h5 className={`font-medium text-sm mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Gentle Invitation</h5>
                <p className={`text-sm leading-relaxed ${
                  theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  {questionText}
                </p>
              </motion.div>
            )}

            {/* Top Themes */}
            {data.topTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <h5 className={`font-medium text-sm mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Top Themes</h5>
                <div className="flex flex-wrap gap-2">
                  {data.topTags.map(({ tag, count }, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-xs ${
                        theme === 'dark'
                          ? 'bg-white/10 border border-white/20 text-white/80'
                          : 'bg-white/80 border border-gray-300 text-gray-700'
                      }`}
                    >
                      {tag} ({count})
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Show More/Less Button */}
      <button
        onClick={() => setShowAll(!showAll)}
        className={`w-full mt-4 py-3 flex items-center justify-center gap-2 transition-all text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] ${
          theme === 'dark'
            ? 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white'
            : 'bg-white/80 hover:bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900'
        }`}
      >
        {showAll ? 'Show Less' : 'Show More'}
        <ChevronRight className={`h-4 w-4 transition-transform ${showAll ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      {/* AI Attribution */}
      <div className={`mt-4 pt-4 ${
        theme === 'dark' ? 'border-t border-white/10' : 'border-t border-gray-200'
      }`}>
        <p className={`text-[10px] text-center ${
          theme === 'dark' ? 'text-white/40' : 'text-gray-400'
        }`}>
          Powered by AI
        </p>
      </div>
    </section>
  )
}
