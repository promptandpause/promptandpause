"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import GlobalDataSync from "../components/global-data-sync"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Hash, BookOpen, CalendarBlank, ChartBar, Brain, ClockClockwise, Calendar } from "phosphor-react"
import QuickStats from "../components/quick-stats"
import ActivityCalendar from "../components/activity-calendar"
import { calculateWritingMetrics } from "@/lib/services/analyticsService"
import { TierGate, UpgradePrompt } from "@/components/tier/TierGate"
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
  }, [supabase])

  async function fetchTopTags(userId: string): Promise<TagCount[]> {
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
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0A0A0A]" : "bg-[#FFFFFF]"}`}>
      <GlobalDataSync />

      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1100px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-10 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                Insights
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>
                Your writing patterns, mood trends, and reflection stats.
              </p>
            </motion.div>

            <QuickStats />

            <ActivityCalendar />

            <div className="grid gap-6 lg:grid-cols-2">
              {isFree ? (
                <div className="lg:col-span-2">
                  <UpgradePrompt feature="insights" />
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {writingMetrics && writingMetrics.averageWordCount > 0 && (
              <div className={`rounded-2xl p-5 ${isDark ? "bg-white/[0.04] border border-white/[0.06]" : "bg-white/70 border border-[#EFF3F4]"}`}>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={18} weight="bold" className={isDark ? "text-white/40" : "text-[#8B98A5]"} />
                  <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>Writing Stats</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className={`text-xs ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>Avg Words</p>
                    <p className={`text-lg font-bold tabular-nums ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                      {writingMetrics.averageWordCount}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>Total Words</p>
                    <p className={`text-lg font-bold tabular-nums ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                      {writingMetrics.totalWords.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>Shortest</p>
                    <p className={`text-lg font-bold tabular-nums ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                      {writingMetrics.shortestReflection}
                    </p>
                  </div>
                </div>
                <div className={`mt-2 flex items-center gap-1.5 text-xs ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>
                  {writingMetrics.trend === 'increasing' ? 'Trending longer' : writingMetrics.trend === 'decreasing' ? 'Trending shorter' : 'Steady writing'} · Longest: {writingMetrics.longestReflection}
                </div>
              </div>
            )}

            {topTags.length > 0 && (
              <div className={`rounded-2xl p-5 ${isDark ? "bg-white/[0.04] border border-white/[0.06]" : "bg-white/70 border border-[#EFF3F4]"}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Hash size={18} weight="bold" className={isDark ? "text-white/40" : "text-[#8B98A5]"} />
                  <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>Top Tags</h3>
                </div>
                <div className="space-y-2">
                  {topTags.map((t, i) => {
                    const maxCount = topTags[0].count
                    const barWidth = (t.count / maxCount) * 100
                    return (
                      <div key={t.tag} className="flex items-center gap-3">
                        <span className={`text-sm w-24 truncate ${isDark ? "text-white/60" : "text-[#536471]"}`}>
                          #{t.tag}
                        </span>
                        <div className="flex-1 h-5 rounded-full overflow-hidden bg-[#EFF3F4] dark:bg-white/[0.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className="h-full rounded-full bg-gradient-to-r from-[#1D9BF0] to-[#1A8CD8]"
                          />
                        </div>
                        <span className={`text-xs tabular-nums w-8 text-right ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>
                          {t.count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(!writingMetrics || writingMetrics.averageWordCount === 0) && (
              <div className={`text-center py-12 rounded-2xl ${isDark ? "bg-white/[0.02] border border-white/[0.06]" : "bg-white/50 border border-[#EFF3F4]"}`}>
                <CalendarBlank size={36} weight="bold" className={`mx-auto mb-3 ${isDark ? "text-white/15" : "text-[#D0CFC0]"}`} />
                <p className={`text-sm font-medium ${isDark ? "text-white/50" : "text-[#8B98A5]"}`}>
                  Start reflecting to see your insights
                </p>
                <p className={`text-xs mt-1 ${isDark ? "text-white/25" : "text-[#B4B0A0]"}`}>
                  Stats, tags, and trends appear after your first entry.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
