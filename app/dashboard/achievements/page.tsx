"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/ThemeContext"
import {
  BADGES,
  Badge,
  getBadgesByCategory,
  getCategoryDisplayName,
  getRarityColor,
} from "@/lib/types/achievements"
import { achievementService } from "@/lib/services/achievementService"
import { Trophy } from "phosphor-react"
import { BadgeIcon } from "./components/BadgeIcon"

export default function AchievementsPage() {
  return (
    <AuthGuard redirectPath="/dashboard/achievements">
      <AchievementsPageContent />
    </AuthGuard>
  )
}

function AchievementsPageContent() {
  const supabase = getSupabaseClient()
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [achievements, setAchievements] = useState<Map<string, { unlocked: boolean, earnedAt?: string }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setLoading(true)
      const progress = await achievementService.getAchievementProgress(user.id)
      setAchievements(progress)
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const categories = [
    { key: 'streak', name: getCategoryDisplayName('streak'), icon: '🔥' },
    { key: 'reflection', name: getCategoryDisplayName('reflection'), icon: '📝' },
    { key: 'topic', name: getCategoryDisplayName('topic'), icon: '🏷️' },
    { key: 'milestone', name: getCategoryDisplayName('milestone'), icon: '⭐' },
    { key: 'exploration', name: getCategoryDisplayName('exploration'), icon: '🌟' },
  ]

  const displayedBadges = selectedCategory
    ? getBadgesByCategory(selectedCategory as any)
    : BADGES

  const unlockedCount = Array.from(achievements.values()).filter(a => a.unlocked).length
  const totalCount = BADGES.length
  const progressPct = totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0

  const filterActive = (active: boolean) =>
    active
      ? isDark
        ? 'bg-white text-slate-900'
        : 'bg-slate-900 text-white'
      : isDark
        ? 'bg-white/[0.04] border border-white/10 text-white/60 hover:border-white/20'
        : 'bg-white/70 border border-slate-200 text-slate-600 hover:border-slate-400'

  return (
    <div
      data-dashboard
      className={`min-h-screen ${isDark ? "bg-[#0A0E18]" : "bg-[#F9FBFB]"}`}
    >
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1100px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-10 space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Trophy size={20} weight="bold" />
                </div>
                <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Achievements
                </h1>
              </div>
              <p className={`text-sm font-medium ${isDark ? "text-white/40" : "text-slate-500"}`}>
                Your journey of growth and consistency
              </p>
            </motion.div>

            {/* Progress Summary */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
              className={`relative overflow-hidden rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 text-white ${isDark ? 'bg-gradient-to-br from-[#1B2436] to-[#0A0E18] border border-white/10' : 'bg-slate-900 shadow-soft-card'}`}
            >
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">
                  {unlockedCount} <span className="text-slate-400 text-xl font-medium">of {totalCount}</span>
                </h2>
                <p className="text-slate-400">
                  Achievements unlocked. Keep reflecting to earn more!
                </p>
              </div>

              <div className="w-full md:w-64 h-3 bg-white/10 rounded-full overflow-hidden relative z-10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8]"
                />
              </div>

              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="absolute -left-10 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
            </motion.section>

            {/* Filters */}
            <section className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${filterActive(selectedCategory === null)}`}
              >
                All
              </button>
              {categories.map((category) => {
                const categoryBadges = getBadgesByCategory(category.key as any)
                const unlockedInCategory = categoryBadges.filter(b => achievements.get(b.id)?.unlocked).length
                const active = selectedCategory === category.key

                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${filterActive(active)}`}
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span className="hidden sm:inline">{category.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      active
                        ? isDark ? 'bg-slate-900/10' : 'bg-white/20'
                        : isDark ? 'bg-white/10' : 'bg-slate-100'
                    }`}>
                      {unlockedInCategory}/{categoryBadges.length}
                    </span>
                  </button>
                )
              })}
            </section>

            {/* Achievement Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                <div className={`col-span-full text-center py-16 text-sm font-medium ${isDark ? "text-white/40" : "text-slate-500"}`}>
                  Loading achievements...
                </div>
              ) : (
                displayedBadges.map((badge, index) => {
                  const isUnlocked = achievements.get(badge.id)?.unlocked || false
                  const earnedAt = achievements.get(badge.id)?.earnedAt
                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isUnlocked={isUnlocked}
                      earnedAt={earnedAt}
                      isDark={isDark}
                      index={index}
                    />
                  )
                })
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

interface BadgeCardProps {
  badge: Badge
  isUnlocked: boolean
  earnedAt?: string
  isDark: boolean
  index: number
}

function BadgeCard({ badge, isUnlocked, earnedAt, isDark, index }: BadgeCardProps) {
  const rarityColors = getRarityColor(badge.rarity)
  const isLegendary = badge.rarity === 'legendary'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={isUnlocked ? { y: -4 } : undefined}
      className={`rounded-2xl p-6 flex flex-col items-center text-center transition-colors ${
        isDark
          ? 'bg-white/[0.04] border border-white/[0.06]'
          : 'bg-white/70 backdrop-blur-[12px] border border-slate-100 shadow-soft-card'
      } ${
        isLegendary
          ? isDark
            ? 'border-white/10 ring-1 ring-amber-400/20'
            : 'border-2 border-amber-100'
          : ''
      } ${!isUnlocked ? 'opacity-60 grayscale' : ''}`}
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
        isUnlocked ? rarityColors.bg : isDark ? 'bg-white/5' : 'bg-slate-100'
      } ${isUnlocked && isLegendary ? 'shadow-inner' : ''}`}>
        <BadgeIcon badge={badge} isUnlocked={isUnlocked} size="sm" />
      </div>

      <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
        isUnlocked ? rarityColors.text : isDark ? 'text-white/30' : 'text-slate-400'
      }`}>
        {badge.rarity}
      </span>

      <h3 className={`font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
        {badge.name}
      </h3>

      <p className={`text-xs leading-relaxed ${isDark ? "text-white/50" : "text-slate-500"}`}>
        {badge.description}
      </p>

      {isUnlocked && earnedAt && (
        <div className={`mt-3 pt-2.5 border-t text-[10px] font-medium w-full ${
          isDark ? "border-white/10 text-white/40" : "border-slate-100 text-slate-400"
        }`}>
          Earned {new Date(earnedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      )}
    </motion.div>
  )
}
