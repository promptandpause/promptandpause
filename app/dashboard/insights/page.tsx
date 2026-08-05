"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import GlobalDataSync from "../components/global-data-sync"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { getSupabaseClient } from "@/lib/supabase/client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenNib, faHashtag, faCalendar } from '@fortawesome/free-solid-svg-icons'
import QuickStats from "../components/quick-stats"
import ActivityCalendar from "../components/activity-calendar"
import { calculateWritingMetrics } from "@/lib/services/analyticsService"
import { TierGate, UpgradePrompt, PremiumStatusCard } from "@/components/tier/TierGate"
import { useTier } from "@/hooks/useTier"
import dynamic from "next/dynamic"

const MoodAnalytics = dynamic(() => import("../components/mood-analytics"), { ssr: false })
const WeeklyInsights = dynamic(() => import("../components/weekly-insights"), { ssr: false })
const FromYourPastCard = dynamic(() => import("../components/from-your-past-card"), { ssr: false })
const MonthlyReflectionCard = dynamic(() => import("../components/monthly-reflection-card"), { ssr: false })

interface TagCount {
  tag: string
  count: number
}

export default function InsightsPage() {
  return (
    <AuthGuard redirectPath="/dashboard/insights">
      <InsightsContent />
    </AuthGuard>
  )
}

function InsightsContent() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { tier, isLoading } = useTier()
  const isFree = !isLoading && tier === "free"
  const supabase = getSupabaseClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [topTags, setTopTags] = useState<TagCount[]>([])
  const [writingMetrics, setWritingMetrics] = useState<{
    averageWordCount: number
    totalWords: number
    shortestReflection: number
    longestReflection: number
    trend: 'increasing' | 'decreasing' | 'stable'
  } | null>(null)

  const fetchTopTags = useCallback(async (userId: string): Promise<TagCount[]> => {
    try {
      const { data, error } = await supabase
        .from("reflections")
        .select("tags")
        .eq("user_id", userId)
        .not("tags", "is", null)

      if (error) return []

      const tagMap = new Map<string, number>()
      for (const row of data) {
        if (Array.isArray(row.tags)) {
          for (const tag of row.tags) {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
          }
        }
      }
      return Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    } catch {
      return []
    }
  }, [supabase])

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const [tags, metrics] = await Promise.all([
          fetchTopTags(user.id),
          calculateWritingMetrics(user.id),
        ])

        setTopTags(tags)
        setWritingMetrics(metrics)
      } catch {}
    }
    load()
  }, [supabase, fetchTopTags])

  const cardClass = isDark
    ? 'bg-white/[0.04] border border-white/[0.06]'
    : 'glass rounded-3xl border-slate-100 soft-shadow'

  const hasData = writingMetrics !== null && writingMetrics.averageWordCount > 0

  const leftColumn = (
    <div className="lg:col-span-2 space-y-6 lg:space-y-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <ActivityCalendar />

      {hasData && (
        <div className={`rounded-3xl p-6 lg:p-8 ${cardClass}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-600'}`}>
              <FontAwesomeIcon icon={faPenNib} className="text-sm" />
            </div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Writing Stats</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-xs mb-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Avg Words</p>
              <p className={`text-2xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {writingMetrics.averageWordCount}
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-xs mb-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Total Words</p>
              <p className={`text-2xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {writingMetrics.totalWords.toLocaleString()}
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-xs mb-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Shortest</p>
              <p className={`text-2xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {writingMetrics.shortestReflection}
              </p>
            </div>
          </div>

          <div className={`p-4 border border-dashed rounded-2xl flex items-center justify-between text-sm ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <span className={isDark ? 'text-white/50' : 'text-slate-500'}>
              Trending <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{writingMetrics.trend === 'increasing' ? 'longer' : writingMetrics.trend === 'decreasing' ? 'shorter' : 'steady'}</span>
            </span>
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>Longest entry: {writingMetrics.longestReflection} words</span>
          </div>
        </div>
      )}

      {!hasData && (
        <div className={`text-center py-12 rounded-3xl ${cardClass}`}>
          <FontAwesomeIcon icon={faCalendar} className={`mx-auto mb-3 text-4xl ${isDark ? 'text-white/15' : 'text-slate-300'}`} />
          <p className={`text-sm font-medium ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
            Start reflecting to see your insights
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-white/25' : 'text-slate-400'}`}>
            Stats, tags, and trends appear after your first entry.
          </p>
        </div>
      )}

      {!isFree && (
        <div className="grid gap-6 lg:grid-cols-2">
          <TierGate feature="mood-analytics">
            <MoodAnalytics />
          </TierGate>

          <TierGate feature="weekly-insights">
            <WeeklyInsights />
          </TierGate>

          <TierGate feature="from-your-past">
            <FromYourPastCard />
          </TierGate>

          <TierGate feature="monthly-summary">
            <MonthlyReflectionCard />
          </TierGate>
        </div>
      )}
    </div>
  )

  const rightColumn = (
    <div className="space-y-6 lg:space-y-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
      {!isLoading && (isFree ? (
        <UpgradePrompt feature="insights" />
      ) : (
        <PremiumStatusCard />
      ))}

      {topTags.length > 0 && (
        <div className={`rounded-3xl p-6 lg:p-8 ${cardClass}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-600'}`}>
              <FontAwesomeIcon icon={faHashtag} className="text-sm" />
            </div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Top Tags</h3>
          </div>

          <div className="space-y-6">
            {topTags.map((t, i) => {
              const maxCount = topTags[0].count
              const barWidth = (t.count / maxCount) * 100
              return (
                <div key={t.tag}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium truncate ${isDark ? 'text-white/60' : 'text-slate-700'}`}>
                      #{t.tag}
                    </span>
                    <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8]"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0A0E18]" : "bg-[#F9FBFB]"}`}>
      <GlobalDataSync />

      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1100px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-10 space-y-8">
            <div className="animate-fade-up">
              <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Insights
              </h1>
              <p className={`text-sm mt-2 font-medium ${isDark ? "text-white/40" : "text-slate-500"}`}>
                Your writing patterns, mood trends, and reflection stats.
              </p>
            </div>

            <QuickStats />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {leftColumn}
              {rightColumn}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
